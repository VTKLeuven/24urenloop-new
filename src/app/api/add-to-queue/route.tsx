import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper function to parse time slots and check if current time is within range
function isWithinShiftTime(timeSlot: string): boolean {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTotalMinutes = currentHour * 60 + currentMinute;

    // Parse time slot (e.g., "20u-22u", "20u30-22u", "1u00-2u00")
    const parts = timeSlot.split('-');
    if (parts.length !== 2) return false;

    const parseTime = (timeStr: string): number | null => {
        // Remove 'u' and parse
        const cleaned = timeStr.replace('u', ':');
        const timeParts = cleaned.split(':').filter(p => p);

        if (timeParts.length === 1) {
            // Just hour (e.g., "20")
            return parseInt(timeParts[0]) * 60;
        } else if (timeParts.length === 2) {
            // Hour and minute (e.g., "20:30")
            return parseInt(timeParts[0]) * 60 + parseInt(timeParts[1]);
        }
        return null;
    };

    const startMinutes = parseTime(parts[0]);
    const endMinutes = parseTime(parts[1]);

    if (startMinutes === null || endMinutes === null) return false;

    // Add 30-minute buffer before shift starts
    const startWithBuffer = startMinutes - 30;

    // Handle overnight shifts (e.g., 23u00-01u00)
    if (endMinutes < startMinutes) {
        // Shift crosses midnight
        return currentTotalMinutes >= startWithBuffer || currentTotalMinutes <= endMinutes;
    } else {
        // Regular shift
        return currentTotalMinutes >= startWithBuffer && currentTotalMinutes <= endMinutes;
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

                for (const checkIn of shiftCheckIns) {
                    if (isWithinShiftTime(checkIn.timeSlot) && !checkIn.checkedIn) {
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