import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const floorPlan = await prisma.floorPlan.findFirst({
    where: { isActive: true },
    orderBy: { uploadedAt: 'desc' }
  });
  
  return NextResponse.json(floorPlan);
}
