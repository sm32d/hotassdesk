import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const floorPlan = await prisma.floorPlan.findFirst({
    where: { isActive: true },
    orderBy: { uploadedAt: 'desc' }
  });
  
  return NextResponse.json(floorPlan);
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { defaultZoom } = body;

  if (typeof defaultZoom !== 'number') {
    return NextResponse.json({ error: 'Invalid defaultZoom' }, { status: 400 });
  }

  // Find active floor plan
  const activePlan = await prisma.floorPlan.findFirst({
    where: { isActive: true }
  });

  if (!activePlan) {
    return NextResponse.json({ error: 'No active floor plan' }, { status: 404 });
  }

  const updatedPlan = await prisma.floorPlan.update({
    where: { id: activePlan.id },
    data: { defaultZoom }
  });

  return NextResponse.json(updatedPlan);
}
