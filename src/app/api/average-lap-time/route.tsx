import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        // Calculate the time one hour ago
        const oneHourAgo = new Date();
        oneHourAgo.setHours(oneHourAgo.getHours() - 1);

        // Fetch all laps from the last hour that have a valid time (not 'null')
        const lapsLastHour = await prisma.lap.findMany({
            where: {
                startTime: {
                    gte: oneHourAgo,
                },
                NOT: {
                    time: 'null',
                },
            },
        });

        if (lapsLastHour.length === 0) {
            return NextResponse.json({ averageTime: null });
        }

        // Convert time strings to seconds for calculation
        const timeInSeconds = lapsLastHour.map(lap => {
            const [minutes, seconds] = lap.time.split(':').map(Number);
            return minutes * 60 + seconds;
        });

        // Calculate average time in seconds
        const averageTimeInSeconds = timeInSeconds.reduce((sum, time) => sum + time, 0) / timeInSeconds.length;

        // Convert back to mm:ss format
        const minutes = Math.floor(averageTimeInSeconds / 60);
        const seconds = Math.round(averageTimeInSeconds % 60);
        const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        return NextResponse.json({ averageTime: formattedTime });
    } catch (error) {
        console.error('Error calculating average lap time:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
