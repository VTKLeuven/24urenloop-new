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

