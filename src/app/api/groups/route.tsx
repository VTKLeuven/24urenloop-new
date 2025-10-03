// app/api/groups/route.tsx
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const groups = await prisma.group.findMany();
        return NextResponse.json(groups);
    } catch {
        return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { groupName } = await request.json();

        if (!groupName) {
            return NextResponse.json({ error: 'Group name is required' }, { status: 400 });
        }

        const newGroup = await prisma.group.create({
            data: { groupName },
        });

        return NextResponse.json(newGroup, { status: 201 });
    } catch (error: any) {
        console.error('Error creating group:', error);
        return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
    }
}