import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Create booking (supports bulk and recurrence)
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const body = await request.json();
  const { bookings, groupBookings, recurrence } = body; 
  // bookings: Array of {seatId, bookingDate, slot}
  // recurrence: { type: 'DAILY' | 'WEEKLY', until: string } | undefined
  
  if (!bookings || bookings.length === 0) {
    return NextResponse.json({ error: 'No bookings provided' }, { status: 400 });
  }

  // Validate no past dates
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const invalidDates = bookings.filter(
    (b: any) => new Date(b.bookingDate) < now
  );
  if (invalidDates.length > 0) {
    return NextResponse.json(
      { error: 'Cannot book dates in the past' },
      { status: 400 }
    );
  }

  // Expand bookings if recurrence is set
  let allBookings = [...bookings];
  
  if (recurrence) {
    const { type, until } = recurrence;
    const untilDate = new Date(until);
    // Assume all initial bookings are on the same start date
    const startDate = new Date(bookings[0].bookingDate); 
    
    // Safety check for infinite loops or massive bookings
    const MAX_RECURRENCE_DAYS = 90; // Limit to ~3 months
    const msInDay = 24 * 60 * 60 * 1000;
    const diffDays = Math.ceil((untilDate.getTime() - startDate.getTime()) / msInDay);
    
    if (diffDays > MAX_RECURRENCE_DAYS) {
       return NextResponse.json({ error: 'Cannot book more than 90 days in advance' }, { status: 400 });
    }

    let currentDate = new Date(startDate);
    // Advance one step first because the first date is already in `bookings`
    if (type === 'DAILY') {
        currentDate.setDate(currentDate.getDate() + 1);
    } else if (type === 'WEEKLY') {
        currentDate.setDate(currentDate.getDate() + 7);
    }

    while (currentDate <= untilDate) {
      // Check if weekend for DAILY (skip Sat/Sun)
      if (type === 'DAILY') {
        const day = currentDate.getDay();
        if (day === 0 || day === 6) {
           currentDate.setDate(currentDate.getDate() + 1);
           continue;
        }
      }

      // Add bookings for this date
      for (const b of bookings) {
        allBookings.push({
          ...b,
          bookingDate: new Date(currentDate) // Clone date
        });
      }

      // Advance
      if (type === 'DAILY') {
        currentDate.setDate(currentDate.getDate() + 1);
      } else if (type === 'WEEKLY') {
        currentDate.setDate(currentDate.getDate() + 7);
      }
    }
  }

  // Final check on total count (to prevent abuse)
  if (allBookings.length > 100) { 
     return NextResponse.json({ error: 'Too many bookings generated. Please reduce range or seat count.' }, { status: 400 });
  }
  
  // Use groupId if explicitly grouped OR if recurring (so the whole series is linked)
  const shouldGroup = (groupBookings && bookings.length > 1) || !!recurrence;
  const groupId = shouldGroup ? crypto.randomUUID() : null;

  try {
    // Use transaction for atomic bulk insert
    const created = await prisma.$transaction(
      allBookings.map((booking: any) =>
        prisma.booking.create({
          data: {
            userId: session.user.id,
            seatId: booking.seatId,
            bookingDate: new Date(booking.bookingDate),
            slot: booking.slot,
            groupId
          },
          include: { seat: true }
        })
      )
    );
    
    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'One or more seats are already booked for the selected dates.' },
        { status: 409 }
      );
    }
    throw error;
  }
}

// Get all bookings (admin only)
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  
  const bookings = await prisma.booking.findMany({
    where: {
      status: 'ACTIVE',
      ...(startDate && endDate && {
        bookingDate: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      })
    },
    include: {
      user: { select: { name: true, email: true } },
      seat: true
    },
    orderBy: { bookingDate: 'asc' }
  });
  
  return NextResponse.json(bookings);
}
