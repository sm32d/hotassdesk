import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { updates } = body as { updates: { id: string; x: number; y: number }[] };

    if (!Array.isArray(updates)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    // Use a transaction to update all seats
    await prisma.$transaction(
      updates.map((update) =>
        prisma.seat.update({
          where: { id: update.id },
          data: { x: update.x, y: update.y }
        })
      )
    );

    return NextResponse.json({ success: true, count: updates.length });
  } catch (error) {
    console.error('Failed to batch update seats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
