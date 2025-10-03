import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const lastLap = await prisma.lap.findFirst({
            orderBy: { startTime: 'desc' },
            select: { runnerId: true },
            skip: 1,
        });

        const previousRunner = lastLap
            ? await prisma.runner.findUnique({
                where: { id: lastLap.runnerId },
                include: { laps: true },
            })
            : null;

        const currentLap = await prisma.lap.findFirst({
            orderBy: { startTime: 'desc' },
            select: { runnerId: true },
        });

        const currentRunner = currentLap
            ? await prisma.runner.findUnique({
                where: { id: currentLap.runnerId },
                include: { laps: true },
            })
            : null;

        // Fetch the queue with the first two entries
        const queueEntries = await prisma.queue.findMany({
            orderBy: { queuePlace: 'asc' },
            include: { runner: { include: { laps: true } } },
            take: 2
        });

        const nextRunnerInQueue = queueEntries.length > 0 ? queueEntries[0] : null;
        const secondNextRunnerInQueue = queueEntries.length > 1 ? queueEntries[1] : null;

        const globalState = await prisma.globalState.findUnique({
            where: { id: 1 },
        });

        return NextResponse.json({
            previousRunner: previousRunner ? {
                ...previousRunner,
                lapTime: previousRunner.laps?.[0]?.time,
            } : null,
            currentRunner: currentRunner ? {
                ...currentRunner,
                startTime: currentRunner.laps?.[0]?.startTime,
            } : null,
            nextRunner: nextRunnerInQueue ? nextRunnerInQueue.runner : null,
            secondNextRunner: secondNextRunnerInQueue ? secondNextRunnerInQueue.runner : null,
            raining: globalState?.raining || false,
        });
    } catch (error) {
        console.error('Error fetching data:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}