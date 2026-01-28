import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Create booking (supports bulk)
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const body = await request.json();
  const { bookings } = body; // Array of {seatId, bookingDate, slot}
  
  // Validate max 14 days
  if (bookings.length > 14) {
    return NextResponse.json(
      { error: 'Maximum 14 bookings per request' },
      { status: 400 }
    );
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
  
  try {
    // Use transaction for atomic bulk insert
    const created = await prisma.$transaction(
      bookings.map((booking: any) =>
        prisma.booking.create({
          data: {
            userId: session.user.id,
            seatId: booking.seatId,
            bookingDate: new Date(booking.bookingDate),
            slot: booking.slot
          },
          include: { seat: true }
        })
      )
    );
    
    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'One or more seats already booked for selected slot' },
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
