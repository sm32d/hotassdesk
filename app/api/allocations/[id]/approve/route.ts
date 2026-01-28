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
  
  const allocation = await prisma.longTermAllocation.update({
    where: { id: params.id },
    data: {
      status: 'APPROVED',
      approvedBy: session.user.id
    }
  });
  
  return NextResponse.json(allocation);
}
