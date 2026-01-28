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
  
  const { isBlocked, blockedReason } = await request.json();
  
  const seat = await prisma.seat.update({
    where: { id: params.id },
    data: {
      isBlocked,
      blockedReason: isBlocked ? blockedReason : null
    }
  });
  
  return NextResponse.json(seat);
}
