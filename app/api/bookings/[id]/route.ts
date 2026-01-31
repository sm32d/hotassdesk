import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const booking = await prisma.booking.findUnique({
    where: { id: params.id }
  });
  
  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }
  
  // Only owner or admin can cancel
  if (booking.userId !== session.user.id && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  await prisma.booking.update({
    where: { id: params.id },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date()
    }
  });
  
  return NextResponse.json({ success: true });
}
