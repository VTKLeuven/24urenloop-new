import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { emitPersonalRecord } from '@/lib/sse';

const prisma = new PrismaClient();

function parseTimeToMs(t: string): number {
    // format M:SS.HH (minutes, seconds, hundredths)
    const m = t.match(/^(\d+):(\d{2})\.(\d{2})$/);
    if (!m) return Number.POSITIVE_INFINITY;
    const minutes = Number(m[1]);
    const seconds = Number(m[2]);
    const hundredths = Number(m[3]);
    return minutes * 60_000 + seconds * 1_000 + hundredths * 10;
}

export async function POST() {
    try {
        // Fetch the raining state from the database
        const globalState = await prisma.globalState.findUnique({
            where: { id: 1 },
        });

        if (!globalState) {
            return NextResponse.json({ error: 'Global state not found' }, { status: 500 });
        }

        const raining = globalState.raining;


        // Fetch the most recent lap before creating a new one
        const previousLap = await prisma.lap.findFirst({
            orderBy: { startTime: 'desc' },
            include: { runner: true },
        });

        const nextRunnerInQueue = await prisma.queue.findFirst({
            orderBy: { queuePlace: 'asc' },
            include: { runner: { include: { laps: true } } },
        });

        if (!nextRunnerInQueue) {
            return NextResponse.json({ error: 'No next runner in queue' }, { status: 400 });
        }

        await prisma.lap.create({
            data: {
                startTime: new Date(),
                runnerId: nextRunnerInQueue.runnerId,
                raining: raining,
                time: 'null', // Default value
            },
        });

        await prisma.queue.delete({
            where: { id: nextRunnerInQueue.id },
        });

        let lapTime = null as string | null;
        if (previousLap) {
            const startTime = new Date(previousLap.startTime).getTime();
            const currentTime = Date.now();
            const timeDiff = currentTime - startTime;
            const minutes = Math.floor(timeDiff / 60000);
            const seconds = Math.floor((timeDiff % 60000) / 1000);
            const hundreds = Math.floor((timeDiff % 1000) / 10);
            lapTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}.${hundreds < 10 ? '0' : ''}${hundreds}`;

            // Compute old best (only consider finished laps excluding the one we're finalizing)
            const finished = await prisma.lap.findMany({
                where: {
                    runnerId: previousLap.runnerId,
                    NOT: { time: 'null' },
                },
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
                where: { id: previousLap.id },
                data: { time: lapTime },
            });

            // Emit PR if this is a new personal best and there was an old best
            if (oldBest && parseTimeToMs(lapTime) < oldBestMs) {
                emitPersonalRecord({
                    type: 'pr',
                    runnerId: previousLap.runnerId,
                    runnerName: `${previousLap.runner.firstName} ${previousLap.runner.lastName}`,
                    oldBest,
                    newBest: lapTime,
                });
            }
        }

        return NextResponse.json({
            message: 'Next runner started successfully',
        });
    } catch (error) {
        console.error('Error starting next runner:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}