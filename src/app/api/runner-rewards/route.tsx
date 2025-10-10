import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const runners = await prisma.runner.findMany({
            orderBy: { lastName: 'asc' },
            include: {
                laps: {
                    where: { NOT: { time: 'null' } },
                    select: { id: true },
                },
            },
        });

        // Return a slim shape with a computed completedLaps property.
        const result = (runners as unknown[]).map((r) => {
            const rec = (r ?? {}) as Record<string, unknown>;
            const lapsVal = rec['laps'];
            const lapsArr = Array.isArray(lapsVal) ? (lapsVal as unknown[]) : [];
            return {
                id: rec['id'],
                firstName: rec['firstName'],
                lastName: rec['lastName'],
                identification: rec['identification'],
                reward1Collected: Boolean(rec['reward1Collected']),
                reward2Collected: Boolean(rec['reward2Collected']),
                reward3Collected: Boolean(rec['reward3Collected']),
                completedLaps: lapsArr.length,
            };
        });

        return NextResponse.json(result);
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
