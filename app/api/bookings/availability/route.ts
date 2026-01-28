import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const seatType = searchParams.get('seatType');
  
  if (!date) {
    return NextResponse.json(
      { error: 'Date parameter required' },
      { status: 400 }
    );
  }
  
  // Get all seats
  const seats = await prisma.seat.findMany({
    where: {
      isBlocked: false,
      ...(seatType && { type: seatType as any })
    }
  });
  
  // Get bookings for the date
  const bookings = await prisma.booking.findMany({
    where: {
      bookingDate: new Date(date),
      status: 'ACTIVE'
    }
  });
  
  // Get active long-term allocations
  const allocations = await prisma.longTermAllocation.findMany({
    where: {
      status: 'APPROVED',
      startDate: { lte: new Date(date) },
      endDate: { gte: new Date(date) }
    }
  });
  
  const allocatedSeatIds = new Set(allocations.map(a => a.seatId));
  
  // Build availability map
  const availability = seats
    .filter(seat => !allocatedSeatIds.has(seat.id))
    .map(seat => {
      const seatBookings = bookings.filter(b => b.seatId === seat.id);
      const amBooked = seatBookings.some(
        b => b.slot === 'AM' || b.slot === 'FULL_DAY'
      );
      const pmBooked = seatBookings.some(
        b => b.slot === 'PM' || b.slot === 'FULL_DAY'
      );
      
      return {
        id: seat.id,
        seatCode: seat.seatCode,
        type: seat.type,
        hasMonitor: seat.hasMonitor,
        isBlocked: seat.isBlocked,
        x: seat.x,
        y: seat.y,
        availability: {
          AM: !amBooked,
          PM: !pmBooked,
          FULL_DAY: !amBooked && !pmBooked
        }
      };
    });
  
  return NextResponse.json(availability);
}
