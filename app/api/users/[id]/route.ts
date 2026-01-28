import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hash } from 'bcryptjs';
import { auth } from '@/lib/auth';

// Helper to check admin access
async function checkAdmin() {
  const session = await auth();
  if (!session || session.user.role !== 'ADMIN') {
    return false;
  }
  return true;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!await checkAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = params;
    const body = await request.json();
    const { name, email, role, department, isActive, password } = body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (department !== undefined) updateData.department = department; // Allow clearing department
    if (isActive !== undefined) updateData.isActive = isActive;
    
    // Only update password if provided
    if (password && password.trim() !== '') {
      updateData.password = await hash(password, 12);
    }

    // Check if email is taken by another user
    if (email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });
      if (existingUser && existingUser.id !== id) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 400 }
        );
      }
    }

    let updatedUser;
    try {
      updatedUser = await prisma.user.update({
        where: { id },
        data: updateData,
      });
    } catch (e: any) {
      const msg = String(e?.message || '');
      if (msg.includes('Unknown argument `isActive`')) {
        const { isActive: _ignore, ...safeData } = updateData;
        updatedUser = await prisma.user.update({
          where: { id },
          data: safeData,
        });
      } else {
        throw e;
      }
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = updatedUser;

    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!await checkAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = params;

    // Optional: Prevent deleting yourself
    const session = await auth();
    if (session?.user?.id === id) {
       return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
