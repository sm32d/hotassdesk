import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const includeBlocked = searchParams.get('includeBlocked') === 'true';
  
  const seats = await prisma.seat.findMany({
    where: {
      ...(type && { type: type as any }),
      ...(!includeBlocked && { isBlocked: false })
    },
    orderBy: { seatCode: 'asc' }
  });
  
  return NextResponse.json(seats);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const body = await request.json();
  const seat = await prisma.seat.create({
    data: body
  });
  
  return NextResponse.json(seat, { status: 201 });
}
