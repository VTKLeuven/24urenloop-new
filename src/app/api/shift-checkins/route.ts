import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Get check-ins for a specific time slot
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const timeSlot = searchParams.get('timeSlot');

    if (!timeSlot) {
      return NextResponse.json({ error: 'Time slot is required' }, { status: 400 });
    }

    const checkIns = await prisma.shiftCheckIn.findMany({
      where: { timeSlot },
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
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(checkIns);
  } catch (error) {
    console.error('Error fetching check-ins:', error);
    return NextResponse.json({ error: 'Failed to fetch check-ins' }, { status: 500 });
  }
}

// POST: Add runners to a time slot from a text list
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { timeSlot, runnersList } = body;

    if (!timeSlot || !runnersList) {
      return NextResponse.json({ error: 'Time slot and runners list are required' }, { status: 400 });
    }

    // Parse the runners list (format: "FirstName LastName" per line)
    const lines = runnersList.trim().split('\n').filter((line: string) => line.trim());
    const results = {
      added: [] as string[],
      notFound: [] as string[],
    };

    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length < 2) continue;

      const firstName = parts[0];
      const lastName = parts.slice(1).join(' ');

      // Find runner by first and last name
      const runner = await prisma.runner.findFirst({
        where: {
          firstName: {
            equals: firstName,
            mode: 'insensitive',
          },
          lastName: {
            equals: lastName,
            mode: 'insensitive',
          },
        },
      });

      if (runner) {
        // Add to shift check-in (upsert to avoid duplicates)
        await prisma.shiftCheckIn.upsert({
          where: {
            runnerId_timeSlot: {
              runnerId: runner.id,
              timeSlot,
            },
          },
          create: {
            runnerId: runner.id,
            timeSlot,
            checkedIn: false,
          },
          update: {}, // Don't change anything if already exists
        });
        results.added.push(`${firstName} ${lastName}`);
      } else {
        results.notFound.push(`${firstName} ${lastName}`);
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error adding runners:', error);
    return NextResponse.json({ error: 'Failed to add runners' }, { status: 500 });
  }
}

// DELETE: Remove a runner from a time slot
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const checkInId = searchParams.get('checkInId');

    if (!checkInId) {
      return NextResponse.json({ error: 'Check-in ID is required' }, { status: 400 });
    }

    await prisma.shiftCheckIn.delete({
      where: { id: parseInt(checkInId) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing runner from shift:', error);
    return NextResponse.json({ error: 'Failed to remove runner' }, { status: 500 });
  }
}

// PUT: Add a single runner to a time slot by runner ID
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { timeSlot, runnerId } = body;

    if (!timeSlot || !runnerId) {
      return NextResponse.json({ error: 'Time slot and runner ID are required' }, { status: 400 });
    }

    // Add to shift check-in (upsert to avoid duplicates)
    const checkIn = await prisma.shiftCheckIn.upsert({
      where: {
        runnerId_timeSlot: {
          runnerId,
          timeSlot,
        },
      },
      create: {
        runnerId,
        timeSlot,
        checkedIn: false,
      },
      update: {}, // Don't change anything if already exists
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

    return NextResponse.json(checkIn);
  } catch (error) {
    console.error('Error adding runner to shift:', error);
    return NextResponse.json({ error: 'Failed to add runner' }, { status: 500 });
  }
}
