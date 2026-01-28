import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const formData = await request.formData();
  const file = formData.get('file') as File;
  
  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }
  
  // Validate file type and size
  const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
  if (!validTypes.includes(file.type)) {
    return NextResponse.json(
      { error: 'Only PNG and JPG images allowed' },
      { status: 400 }
    );
  }
  
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json(
      { error: 'File size must be under 5MB' },
      { status: 400 }
    );
  }
  
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  // Save file
  const filename = `floorplan-${Date.now()}.${file.name.split('.').pop()}`;
  const filepath = path.join(process.cwd(), 'public/uploads', filename);
  await writeFile(filepath, buffer);
  
  // Deactivate previous floor plans
  await prisma.floorPlan.updateMany({
    where: { isActive: true },
    data: { isActive: false }
  });
  
  // Create new floor plan record
  const floorPlan = await prisma.floorPlan.create({
    data: {
      imageUrl: `/uploads/${filename}`,
      uploadedBy: session.user.id,
      isActive: true
    }
  });
  
  return NextResponse.json(floorPlan, { status: 201 });
}
