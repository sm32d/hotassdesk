import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const bookings = await prisma.booking.findMany({
    where: {
      userId: session.user.id
    },
    include: { seat: true },
    orderBy: { bookingDate: 'desc' }
  });
  
  return NextResponse.json(bookings);
}
