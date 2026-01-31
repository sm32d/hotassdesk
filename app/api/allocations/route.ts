import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const allocations = await prisma.longTermAllocation.findMany({
    include: {
      seat: true,
      requester: { select: { name: true, email: true } },
      approver: { select: { name: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
  
  return NextResponse.json(allocations);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  
  const allocation = await prisma.longTermAllocation.create({
    data: {
      ...body,
      requestedBy: session.user.id
    }
  });
  
  return NextResponse.json(allocation, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  
  await prisma.longTermAllocation.delete({
    where: { id: id! }
  });
  
  return NextResponse.json({ success: true });
}
