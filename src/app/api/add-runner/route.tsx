// app/api/add-runner/route.tsx
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    const { firstName, lastName, identification, facultyId, groupNumber, testTime, firstYear } = await req.json();
    try {
        const newRunner = await prisma.runner.create({
            data: {
                firstName,
                lastName,
                identification,
                facultyId,
                registrationTime: new Date(), // Set to current time
                groupNumber,
                testTime,
                firstYear,
            },
        });
        return NextResponse.json(newRunner, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Failed to add runner' }, { status: 500 });
    }
}