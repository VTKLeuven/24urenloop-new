import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

                return tx.queue.create({
                    data: {
                        runnerId,
                        queuePlace: nextPlace,
                    },
                });
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