import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

            // Update the lap time in the database
            await prisma.lap.update({
                where: { id: currentLap.id },
                data: { time: lapTime },
            });
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
