import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST: Manually check in or uncheck a runner
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { checkInId, checkIn } = body;

    if (!checkInId) {
      return NextResponse.json({ error: 'Check-in ID is required' }, { status: 400 });
    }

    // Update the check-in status
    const updatedCheckIn = await prisma.shiftCheckIn.update({
      where: { id: checkInId },
      data: { checkedIn: checkIn !== undefined ? checkIn : true },
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

    const action = updatedCheckIn.checkedIn ? 'checked in' : 'unchecked';
    console.log(`[Manual ${action}] Runner ${updatedCheckIn.runner.firstName} ${updatedCheckIn.runner.lastName} manually ${action} for shift ${updatedCheckIn.timeSlot}`);

    return NextResponse.json(updatedCheckIn);
  } catch (error) {
    console.error('Error during manual check-in/uncheck:', error);
    return NextResponse.json({ error: 'Failed to update runner status' }, { status: 500 });
  }
}
