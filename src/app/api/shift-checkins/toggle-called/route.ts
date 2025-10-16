import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST: Toggle alreadyCalled status
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { checkInId } = body;

    if (!checkInId) {
      return NextResponse.json({ error: 'Check-in ID is required' }, { status: 400 });
    }

    // Get current status and toggle it
    const currentCheckIn = await prisma.shiftCheckIn.findUnique({
      where: { id: checkInId },
    });

    if (!currentCheckIn) {
      return NextResponse.json({ error: 'Check-in not found' }, { status: 404 });
    }

    // Toggle the alreadyCalled status
    const updatedCheckIn = await prisma.shiftCheckIn.update({
      where: { id: checkInId },
      data: { alreadyCalled: !currentCheckIn.alreadyCalled },
      include: {
        runner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
          },
        },
      },
    });

    return NextResponse.json(updatedCheckIn);
  } catch (error) {
    console.error('Error toggling alreadyCalled status:', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}

