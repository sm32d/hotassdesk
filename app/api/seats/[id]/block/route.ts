import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { sendBookingCancellationNotification } from '@/lib/notification';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { isBlocked, blockedReason } = await request.json();
  
  const seat = await prisma.seat.update({
    where: { id: params.id },
    data: {
      isBlocked,
      blockedReason: isBlocked ? blockedReason : null
    }
  });

  // If seat is being blocked, notify users with upcoming bookings
  if (isBlocked) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const affectedBookings = await prisma.booking.findMany({
      where: {
        seatId: params.id,
        status: 'ACTIVE',
        bookingDate: {
          gte: today
        }
      },
      include: {
        user: true,
        seat: true
      }
    });

    // Send notifications
    await Promise.all(affectedBookings.map(booking => 
      sendBookingCancellationNotification(booking, blockedReason || 'No reason provided')
    ));
  }
  
  return NextResponse.json(seat);
}
