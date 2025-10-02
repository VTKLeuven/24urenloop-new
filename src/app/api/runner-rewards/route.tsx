import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const runners = await prisma.runner.findMany({
            orderBy: { lastName: 'asc' },
        });
        return NextResponse.json(runners);
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Failed to fetch runners' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { id, field, value } = await req.json();
        if (!id || !field) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        // Only allow updates to reward1Collected/2/3
        const allowed = ['reward1Collected', 'reward2Collected', 'reward3Collected'];
        if (!allowed.includes(field)) {
            return NextResponse.json({ error: 'Invalid field' }, { status: 400 });
        }

        const data: Record<string, boolean> = {};
        data[field] = !!value;

        const updated = await prisma.runner.update({
            where: { id: Number(id) },
            data,
        });

        return NextResponse.json(updated);
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Failed to update runner' }, { status: 500 });
    }
}
