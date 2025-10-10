// app/api/add-runner/route.tsx
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    const { firstName, lastName, identification, facultyId, groupNumber, testTime, firstYear } = await req.json();
    try {
        // If identification is empty or null, generate a unique one based on timestamp
        const finalIdentification = identification || `ID-${Date.now()}`;

        const newRunner = await prisma.runner.create({
            data: {
                firstName,
                lastName,
                identification: finalIdentification,
                facultyId: facultyId || null,
                registrationTime: new Date(), // Set to current time
                groupNumber: groupNumber || null,
                testTime: testTime || null,
                firstYear,
            },
        });
        return NextResponse.json(newRunner, { status: 201 });
    } catch (error) {
        console.error('Error adding runner:', error);
        return NextResponse.json({ error: 'Failed to add runner' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}