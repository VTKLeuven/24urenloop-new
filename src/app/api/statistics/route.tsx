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
            facultyId: currentLap.runner.facultyId
        } : { name: '', startTime: null, facultyId: null };

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
            facultyId: lap.runner.facultyId,
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
            facultyId: queue.runner.facultyId,
        }));

        // Retrieve the top 7 groups with the most laps
        const runners = await prisma.runner.findMany({
            include: { laps: true },
        });

        const groupLapCounts = await Promise.all(runners.map(async runner => {
            // Skip runners without a group
            if (!runner.groupNumber) {
                return { groupName: null, laps: 0 };
            }
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

        // Retrieve runners with at least one lap
        const runnersWithLaps = await prisma.runner.findMany({
            where: {
                laps: {
                    some: {},
                },
            },
            include: {
                laps: true,
            },
        });

        // Calculate lap points with custom hour ranges
        const runnersWithPoints = runnersWithLaps.map(runner => {
            const totalPoints = runner.laps.reduce((sum, lap) => {
                const hour = new Date(lap.startTime).getHours() - 2; //- 2 for UTC + 2 timezone
                let points = 0;

                if (hour >= 20 || hour < 2) {
                    points = 1;       // 20h-2h
                } else if (hour >= 2 && hour < 4) {
                    points = 3;       // 2h-4h
                } else if (hour >= 4 && hour < 9) {
                    points = 10;      // 4h-9h
                } else if (hour >= 9 && hour < 12) {
                    points = 5;       // 9h-12h
                } else if (hour >= 12 && hour < 18) {
                    points = 1;       // 12h-18h
                } else if (hour >= 18 && hour < 20) {
                    points = 3;       // 18h-20h
                }

                return sum + points;
            }, 0);

            return {
                name: `${runner.firstName} ${runner.lastName}`,
                points: totalPoints,
            };
        });


        // Sort descending and take top 10
            const top7LapPoints = runnersWithPoints
                .sort((a, b) => b.points - a.points)
                .slice(0, 7);


        // Retrieve the top 7 runners with the most laps
        const top7Runners = await prisma.runner.findMany({
            where: {
                laps: {
                    some: {}, // at least one lap must exist
                },
            },
            orderBy: {
                laps: {
                    _count: 'desc',
                },
            },
            take: 7,
            include: {
                laps: true,
            },
        });

        // Retrieve the top 7 runners with the most laps who are first years
        const top7FirstyearRunners = await prisma.runner.findMany({
            where: {
                laps: {
                    some: {}, // at least one lap must exist
                },
                firstYear: true,
            },
            orderBy: {
                laps: {
                    _count: 'desc',
                },
            },
            take: 7,
            include: {
                laps: true,
            },
        });

        const top7FirstyearRunnersData = top7FirstyearRunners.map(runner => ({
            name: `${runner.firstName} ${runner.lastName}`,
            laps: runner.laps.length,
        }));

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
            top7FirstyearRunners: top7FirstyearRunnersData,
            top7LapPoints: top7LapPoints,
        });
    } catch (error) {
        console.error('Error fetching statistics:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}