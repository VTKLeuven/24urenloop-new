import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { emitPersonalRecord } from '@/lib/sse';

const prisma = new PrismaClient();

function parseTimeToMs(t: string): number {
    const m = t.match(/^(\d+):(\d{2})\.(\d{2})$/);
    if (!m) return Number.POSITIVE_INFINITY;
    const minutes = Number(m[1]);
    const seconds = Number(m[2]);
    const hundredths = Number(m[3]);
    return minutes * 60_000 + seconds * 1_000 + hundredths * 10;
}

export async function POST() {
    try {
        // Get the global state for raining information
        const globalState = await prisma.globalState.findUnique({
            where: { id: 1 },
        });

        const raining = globalState?.raining || false;

        // First check if there's a current runner with an ongoing lap
        const currentLap = await prisma.lap.findFirst({
            orderBy: { startTime: 'desc' },
            include: { runner: true },
        });

        // Calculate and update the time for the current lap if it exists
        if (currentLap) {
            const startTime = new Date(currentLap.startTime).getTime();
            const currentTime = Date.now();
            const timeDiff = currentTime - startTime;
            const minutes = Math.floor(timeDiff / 60000);
            const seconds = Math.floor((timeDiff % 60000) / 1000);
            const hundreds = Math.floor((timeDiff % 1000) / 10);
            const lapTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}.${hundreds < 10 ? '0' : ''}${hundreds}`;

            // Compute old best numerically before updating
            const finished = await prisma.lap.findMany({
                where: { runnerId: currentLap.runnerId, NOT: { time: 'null' } },
                select: { time: true },
            });
            let oldBest: string | null = null;
            let oldBestMs = Number.POSITIVE_INFINITY;
            for (const l of finished) {
                const ms = parseTimeToMs(l.time);
                if (ms < oldBestMs) {
                    oldBestMs = ms;
                    oldBest = l.time;
                }
            }

            // Update the lap time in the database
            await prisma.lap.update({
                where: { id: currentLap.id },
                data: { time: lapTime },
            });

            // Emit PR if this is a new personal best and there was an old best
            if (oldBest && parseTimeToMs(lapTime) < oldBestMs) {
                emitPersonalRecord({
                    type: 'pr',
                    runnerId: currentLap.runnerId,
                    runnerName: `${currentLap.runner.firstName} ${currentLap.runner.lastName}`,
                    oldBest,
                    newBest: lapTime,
                });
            }
        }

        // Get the first two runners in the queue
        const queue = await prisma.queue.findMany({
            orderBy: { queuePlace: 'asc' },
            include: { runner: true },
            take: 2 // Only need the first two runners
        });

        if (queue.length < 2) {
            return NextResponse.json(
                { error: 'Not enough runners in the queue to skip' },
                { status: 400 }
            );
        }

        const firstRunnerInQueue = queue[0];
        const secondRunnerInQueue = queue[1];

        // Remove the first runner from the queue
        await prisma.queue.delete({
            where: { id: firstRunnerInQueue.id },
        });

        // Start the second runner (create a new lap)
        await prisma.lap.create({
            data: {
                startTime: new Date(),
                runnerId: secondRunnerInQueue.runnerId,
                raining: raining,
                time: 'null',
            },
        });

        // Remove the second runner from the queue as well, since they're now the current runner
        await prisma.queue.delete({
            where: { id: secondRunnerInQueue.id },
        });

        return NextResponse.json({
            success: true,
            message: 'Successfully skipped runner and started next runner',
            skippedRunner: firstRunnerInQueue.runner,
            startedRunner: secondRunnerInQueue.runner
        });
    } catch (error) {
        console.error('Failed to skip next runner:', error);
        return NextResponse.json(
            { error: 'Failed to skip next runner' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}
