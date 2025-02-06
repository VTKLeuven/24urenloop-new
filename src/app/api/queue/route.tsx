import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const queue = await prisma.queue.findMany({
            include: {
                runner: true,
            },
            orderBy: {
                queuePlace: 'asc',
            },
        });
        return NextResponse.json(queue);
    } catch {
        return NextResponse.json({ error: 'Failed to fetch queue' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const url = new URL(request.url);
    const queuePlace = parseInt(url.searchParams.get('queuePlace') || '');

    if (isNaN(queuePlace)) {
        return NextResponse.json({ error: 'Invalid queue place' }, { status: 400 });
    }

    try {
        await prisma.queue.delete({
            where: { queuePlace },
        });
        return NextResponse.json({ message: 'Runner deleted from queue' });
    } catch {
        return NextResponse.json({ error: 'Failed to delete runner from queue' }, { status: 500 });
    }
}