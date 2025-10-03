import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const terms = searchParams.get('terms') || '[]';
    const searchTerms: string[] = JSON.parse(terms);

    try {
        const runners = await prisma.runner.findMany({
            where: {
                OR: searchTerms.map((term: string) => ({
                    OR: [
                        { firstName: { contains: term, mode: 'insensitive' } },
                        { lastName: { contains: term, mode: 'insensitive' } },
                        { identification: { contains: term, mode: 'insensitive' } },
                    ],
                })),
            },
            include: {
                laps: {
                    where: {
                        NOT: {
                            time: 'null',
                        },
                    },
                    orderBy: {
                        startTime: 'desc',
                    },
                    take: 1,
                },
            },
        });

        // Transform the data to include lastLapTime
        const runnersWithLastLap = runners.map(runner => ({
            ...runner,
            lastLapTime: runner.laps.length > 0 ? runner.laps[0].time : null,
            laps: undefined, // Remove the laps array from the response
        }));

        return NextResponse.json(runnersWithLastLap);
    } catch {
        return NextResponse.json({ error: 'Failed to fetch search results' }, { status: 500 });
    }
}