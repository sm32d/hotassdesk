import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Find bookings in this group to verify ownership
  const bookings = await prisma.booking.findMany({
    where: { groupId: params.groupId }
  });
  
  if (bookings.length === 0) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 });
  }
  
  // Verify ownership (check if at least one booking belongs to user)
  // Assuming all bookings in a group belong to the same user
  const isOwner = bookings.every(b => b.userId === session.user.id);
  
  if (!isOwner && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  await prisma.booking.updateMany({
    where: { groupId: params.groupId },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date()
    }
  });
  
  return NextResponse.json({ success: true });
}
