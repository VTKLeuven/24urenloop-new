import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper function to parse time slots and check if current time is within range
function isWithinShiftTime(timeSlot: string): boolean {
    // Get current time in Europe/Brussels timezone (UTC+1/UTC+2 depending on DST)
    const now = new Date();
    const belgiumTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Brussels' }));
    const currentHour = belgiumTime.getHours();
    const currentMinute = belgiumTime.getMinutes();
    const currentTotalMinutes = currentHour * 60 + currentMinute;

    console.log(`[Check-in] Current time in Belgium: ${currentHour}:${currentMinute.toString().padStart(2, '0')} (${currentTotalMinutes} minutes)`);
    console.log(`[Check-in] Checking timeSlot: ${timeSlot}`);

    // Parse time slot (e.g., "20u-22u", "20u30-22u", "1u00-2u00", "22u30-23u30")
    const parts = timeSlot.split('-');
    if (parts.length !== 2) return false;

    const parseTime = (timeStr: string): number | null => {
        // Handle formats like "22u30", "22u", "1u00", "0u30"
        const cleaned = timeStr.replace('u', ':');
        const timeParts = cleaned.split(':').filter(p => p);

        if (timeParts.length === 1) {
            // Just hour (e.g., "20")
            return parseInt(timeParts[0]) * 60;
        } else if (timeParts.length === 2) {
            // Hour and minute (e.g., "20:30")
            const hour = parseInt(timeParts[0]);
            const minute = parseInt(timeParts[1]);
            return hour * 60 + minute;
        }
        return null;
    };

    const startMinutes = parseTime(parts[0]);
    const endMinutes = parseTime(parts[1]);

    if (startMinutes === null || endMinutes === null) {
        console.log(`[Check-in] Failed to parse time slot: ${timeSlot}`);
        return false;
    }

    // Add 30-minute buffer before shift starts
    const startWithBuffer = startMinutes - 30;

    console.log(`[Check-in] Shift: ${Math.floor(startMinutes/60)}:${(startMinutes%60).toString().padStart(2, '0')} - ${Math.floor(endMinutes/60)}:${(endMinutes%60).toString().padStart(2, '0')}`);
    console.log(`[Check-in] With 30min buffer: ${Math.floor(startWithBuffer/60)}:${(startWithBuffer%60).toString().padStart(2, '0')} - ${Math.floor(endMinutes/60)}:${(endMinutes%60).toString().padStart(2, '0')}`);

    // Handle overnight shifts (e.g., 23u00-01u00)
    if (endMinutes < startMinutes) {
        // Shift crosses midnight
        const isInRange = currentTotalMinutes >= startWithBuffer || currentTotalMinutes <= endMinutes;
        console.log(`[Check-in] Overnight shift - In range: ${isInRange}`);
        return isInRange;
    } else {
        // Regular shift
        const isInRange = currentTotalMinutes >= startWithBuffer && currentTotalMinutes <= endMinutes;
        console.log(`[Check-in] Regular shift - In range: ${isInRange}`);
        return isInRange;
    }
}

export async function POST(req: NextRequest) {
    const { runnerId } = await req.json();

    if (!runnerId) {
        return NextResponse.json({ error: 'Runner ID is required' }, { status: 400 });
    }

    try {
        const newQueueEntry = await prisma.$transaction(
            async (tx) => {
                const { _max } = await tx.queue.aggregate({
                    _max: { queuePlace: true },
                });

                const nextPlace = (_max.queuePlace ?? 0) + 1;

                const queueEntry = await tx.queue.create({
                    data: {
                        runnerId,
                        queuePlace: nextPlace,
                    },
                });

                // Check if runner has any shift assignments and auto-check them in
                const shiftCheckIns = await tx.shiftCheckIn.findMany({
                    where: { runnerId },
                });

                console.log(`[Check-in] Runner ${runnerId} has ${shiftCheckIns.length} shift assignments`);

                for (const checkIn of shiftCheckIns) {
                    console.log(`[Check-in] Checking shift: ${checkIn.timeSlot}, already checked in: ${checkIn.checkedIn}`);
                    if (isWithinShiftTime(checkIn.timeSlot) && !checkIn.checkedIn) {
                        console.log(`[Check-in] ✓ Auto-checking in runner ${runnerId} for shift ${checkIn.timeSlot}`);
                        await tx.shiftCheckIn.update({
                            where: { id: checkIn.id },
                            data: { checkedIn: true },
                        });
                    }
                }

                return queueEntry;
            },
            // This avoids race conditions between concurrent requests
            { isolationLevel: "Serializable" }
        );

        return NextResponse.json(newQueueEntry, { status: 200 });
    } catch (error) {
        console.error('Error adding runner to queue:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}