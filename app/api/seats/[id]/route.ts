import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const body = await request.json();
  const seat = await prisma.seat.update({
    where: { id: params.id },
    data: body
  });
  
  return NextResponse.json(seat);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check for active future bookings
  const activeBookings = await prisma.booking.findFirst({
    where: {
      seatId: id,
      bookingDate: {
        gte: today
      },
      status: 'ACTIVE'
    }
  });

  if (activeBookings) {
    return NextResponse.json(
      { error: 'Cannot delete seat with active upcoming bookings. Please cancel them first.' },
      { status: 400 }
    );
  }
  
  await prisma.seat.delete({
    where: { id }
  });
  
  return NextResponse.json({ success: true });
}
