import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  
  if (!date) {
    return NextResponse.json(
      { error: 'Date parameter required' },
      { status: 400 }
    );
  }
  
  const bookings = await prisma.booking.findMany({
    where: {
      bookingDate: new Date(date),
      status: 'ACTIVE'
    },
    include: {
      user: { select: { name: true, email: true, department: true } },
      seat: true
    },
    orderBy: { seat: { seatCode: 'asc' } }
  });
  
  return NextResponse.json(bookings);
}
