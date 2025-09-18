import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        // Retrieve the current runner
        const currentLap = await prisma.lap.findFirst({
            orderBy: { startTime: 'desc' },
            include: { runner: true },
        });

        const currentRunner = currentLap ? {
            name: `${currentLap.runner.firstName} ${currentLap.runner.lastName}`,
            startTime: currentLap.startTime,
        } : { name: '', startTime: null };

        // Retrieve the last 7 laps
        const last7Laps = await prisma.lap.findMany({
            where: { NOT: { time: 'null' } },
            orderBy: { startTime: 'desc' },
            take: 7,
            include: { runner: true },
        });

        const last7LapsData = last7Laps.map(lap => ({
            name: `${lap.runner.firstName} ${lap.runner.lastName}`,
            time: lap.time,
        }));

        // Retrieve the 7 runners with the quickest laps
        const quickest7Runners = await prisma.lap.findMany({
            where: { NOT: { time: 'null' } },
            orderBy: { time: 'asc' },
            distinct: ['runnerId'],
            take: 7,
            include: { runner: true },
        });

        const quickest7RunnersData = quickest7Runners.map(lap => ({
            name: `${lap.runner.firstName} ${lap.runner.lastName}`,
            time: lap.time,
        }));

        // Retrieve the current queue (max 7 entries)
        const currentQueue = await prisma.queue.findMany({
            orderBy: { queuePlace: 'asc' },
            take: 7,
            include: { runner: true },
        });

        const currentQueueData = currentQueue.map(queue => ({
            name: `${queue.runner.firstName} ${queue.runner.lastName}`,
        }));

        // Retrieve the top 7 groups with the most laps
        const runners = await prisma.runner.findMany({
            include: { laps: true },
        });

        const groupLapCounts = await Promise.all(runners.map(async runner => {
            const group = await prisma.group.findUnique({
                where: { groupNumber: runner.groupNumber },
            });
            return { groupName: group?.groupName, laps: runner.laps.length };
        }));

        const groupLapCountsMap = groupLapCounts.reduce((acc: { [key: string]: number }, { groupName, laps }) => {
            if (!groupName) return acc;
            if (!acc[groupName]) {
                acc[groupName] = 0;
            }
            acc[groupName] += laps;
            return acc;
        }, {});

        const groupLapRanking = Object.entries(groupLapCountsMap)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 7)
            .map(([name, laps]) => ({ name, laps }));

        // Retrieve the top 7 runners with the most laps
        const top7Runners = await prisma.runner.findMany({
            orderBy: { laps: { _count: 'desc' } },
            take: 7,
            include: { laps: true },
        });

        const top7RunnersData = top7Runners.map(runner => ({
            name: `${runner.firstName} ${runner.lastName}`,
            laps: runner.laps.length,
        }));

        return NextResponse.json({
            currentRunner,
            last7Laps: last7LapsData,
            quickest7Runners: quickest7RunnersData,
            currentQueue: currentQueueData,
            groupLapRanking,
            top7Runners: top7RunnersData,
        });
    } catch (error) {
        console.error('Error fetching statistics:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}