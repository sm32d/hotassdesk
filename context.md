# **Hot Desk Booking System - Technical Requirements & Context**

## **Project Overview**
Automate the current manual desk booking process that uses Google Sheets for tracking workstation allocations. The system should support both short-term (daily AM/PM) bookings and long-term desk allocations with admin approval workflows.
***

## **Tech Stack**
- **Framework**: Next.js 14+ (App Router, TypeScript)
- **Database**: PostgreSQL 15+ with Prisma ORM
- **Authentication**: NextAuth.js v5 (Auth.js)
- **Styling**: Tailwind CSS (recommended)
- **Deployment**: Vercel / Docker / Self-hosted Node.js

***

## **Project Structure**

```
/app
  /api                           # Backend API routes
    /auth
      /[...nextauth]/route.ts    # NextAuth handler
    /seats
      /route.ts                  # List/create seats
      /[id]/route.ts             # Update/delete seat
      /[id]/block/route.ts       # Block/unblock seat
    /bookings
      /route.ts                  # Create booking, list all
      /availability/route.ts     # Check availability
      /my-bookings/route.ts      # User's bookings
      /by-date/route.ts          # Bookings for specific date
      /[id]/route.ts             # Cancel booking
    /allocations
      /route.ts                  # CRUD long-term allocations
      /[id]/approve/route.ts     # Approve allocation
    /floorplans
      /route.ts                  # Upload/list floor plans
      /active/route.ts           # Get active floor plan
  
  /(auth)
    /login/page.tsx              # Login page
  
  /(employee)                    # Employee portal
    /dashboard/page.tsx          # Main dashboard
    /book/page.tsx               # Booking interface
    /my-bookings/page.tsx        # View/cancel bookings
    /floor-plan/page.tsx         # Static floor plan view
  
  /(admin)                       # Admin portal
    /admin
      /seats/page.tsx            # Manage seats
      /bookings/page.tsx         # View all bookings
      /allocations/page.tsx      # Long-term allocations
      /floorplan/page.tsx        # Upload floor plan
  
  /layout.tsx                    # Root layout
  /middleware.ts                 # Auth middleware

/lib
  /auth.ts                       # NextAuth configuration
  /db.ts                         # Prisma client instance
  /utils.ts                      # Helper functions
  /validations.ts                # Zod schemas

/prisma
  schema.prisma                  # Database schema
  /migrations                    # Migration files

/components
  /ui                            # Reusable UI components
  /booking                       # Booking-specific components
  /admin                         # Admin components

/actions
  /bookings.ts                   # Server actions for bookings
  /seats.ts                      # Server actions for seats
```

***

## **Database Schema (Prisma)**

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  EMPLOYEE
  ADMIN
}

enum SeatType {
  SOLO
  TEAM_CLUSTER
}

enum BookingSlot {
  AM
  PM
  FULL_DAY
}

enum BookingStatus {
  ACTIVE
  CANCELLED
}

enum AllocationStatus {
  PENDING
  APPROVED
  EXPIRED
}

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  password      String
  name          String
  role          Role      @default(EMPLOYEE)
  department    String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  bookings      Booking[]
  allocationsRequested LongTermAllocation[] @relation("RequestedAllocations")
  allocationsApproved  LongTermAllocation[] @relation("ApprovedAllocations")
  floorPlansUploaded   FloorPlan[]
}

model Seat {
  id            String    @id @default(uuid())
  seatCode      String    @unique // e.g., "T21", "S4"
  type          SeatType
  hasMonitor    Boolean   @default(false)
  metadata      Json?     // Flexible JSONB for tags, properties
  isBlocked     Boolean   @default(false)
  blockedReason String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  bookings      Booking[]
  allocations   LongTermAllocation[]
  
  @@index([type, isBlocked])
}

model Booking {
  id            String        @id @default(uuid())
  userId        String
  seatId        String
  bookingDate   DateTime      @db.Date
  slot          BookingSlot
  status        BookingStatus @default(ACTIVE)
  createdAt     DateTime      @default(now())
  cancelledAt   DateTime?
  
  user          User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  seat          Seat          @relation(fields: [seatId], references: [id], onDelete: Cascade)
  
  @@unique([seatId, bookingDate, slot, status], name: "unique_active_booking")
  @@index([seatId, bookingDate, slot, status])
  @@index([userId, bookingDate])
}

model LongTermAllocation {
  id            String            @id @default(uuid())
  seatId        String
  allocatedTo   String            // Team/person name
  reason        String
  startDate     DateTime          @db.Date
  endDate       DateTime          @db.Date
  requestedBy   String
  approvedBy    String?
  status        AllocationStatus  @default(PENDING)
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt
  
  seat          Seat              @relation(fields: [seatId], references: [id], onDelete: Cascade)
  requester     User              @relation("RequestedAllocations", fields: [requestedBy], references: [id])
  approver      User?             @relation("ApprovedAllocations", fields: [approvedBy], references: [id])
  
  @@index([startDate, endDate, status])
}

model FloorPlan {
  id            String    @id @default(uuid())
  imageUrl      String
  uploadedBy    String
  isActive      Boolean   @default(false)
  uploadedAt    DateTime  @default(now())
  
  uploader      User      @relation(fields: [uploadedBy], references: [id])
}
```

***

## **Authentication Configuration**

### **NextAuth.js Setup**

```typescript
// lib/auth.ts
import NextAuth, { DefaultSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './db';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession['user'];
  }
  interface User {
    role: Role;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: Role;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        });
        
        if (!user) {
          return null;
        }
        
        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );
        
        if (!isValid) {
          return null;
        }
        
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    }
  }
});
```

### **Middleware for Route Protection**

```typescript
// middleware.ts
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  
  // Public routes
  if (pathname.startsWith('/login') || pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }
  
  // Protected routes - require authentication
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  
  // Admin-only routes
  if (pathname.startsWith('/admin') && session.user.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
  
  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)']
};
```

***

## **API Routes Implementation**

### **Seats API**

```typescript
// app/api/seats/route.ts
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
```

```typescript
// app/api/seats/[id]/route.ts
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
  
  const body = await request.json();
  const seat = await prisma.seat.update({
    where: { id: params.id },
    data: body
  });
  
  return NextResponse.json(seat);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  await prisma.seat.delete({
    where: { id: params.id }
  });
  
  return NextResponse.json({ success: true });
}
```

```typescript
// app/api/seats/[id]/block/route.ts
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
```

### **Bookings API**

```typescript
// app/api/bookings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Create booking (supports bulk)
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const body = await request.json();
  const { bookings } = body; // Array of {seatId, bookingDate, slot}
  
  // Validate max 14 days
  if (bookings.length > 14) {
    return NextResponse.json(
      { error: 'Maximum 14 bookings per request' },
      { status: 400 }
    );
  }
  
  // Validate no past dates
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const invalidDates = bookings.filter(
    (b: any) => new Date(b.bookingDate) < now
  );
  if (invalidDates.length > 0) {
    return NextResponse.json(
      { error: 'Cannot book dates in the past' },
      { status: 400 }
    );
  }
  
  try {
    // Use transaction for atomic bulk insert
    const created = await prisma.$transaction(
      bookings.map((booking: any) =>
        prisma.booking.create({
          data: {
            userId: session.user.id,
            seatId: booking.seatId,
            bookingDate: new Date(booking.bookingDate),
            slot: booking.slot
          },
          include: { seat: true }
        })
      )
    );
    
    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'One or more seats already booked for selected slot' },
        { status: 409 }
      );
    }
    throw error;
  }
}

// Get all bookings (admin only)
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  
  const bookings = await prisma.booking.findMany({
    where: {
      status: 'ACTIVE',
      ...(startDate && endDate && {
        bookingDate: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      })
    },
    include: {
      user: { select: { name: true, email: true } },
      seat: true
    },
    orderBy: { bookingDate: 'asc' }
  });
  
  return NextResponse.json(bookings);
}
```

```typescript
// app/api/bookings/availability/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const seatType = searchParams.get('seatType');
  
  if (!date) {
    return NextResponse.json(
      { error: 'Date parameter required' },
      { status: 400 }
    );
  }
  
  // Get all seats
  const seats = await prisma.seat.findMany({
    where: {
      isBlocked: false,
      ...(seatType && { type: seatType as any })
    }
  });
  
  // Get bookings for the date
  const bookings = await prisma.booking.findMany({
    where: {
      bookingDate: new Date(date),
      status: 'ACTIVE'
    }
  });
  
  // Get active long-term allocations
  const allocations = await prisma.longTermAllocation.findMany({
    where: {
      status: 'APPROVED',
      startDate: { lte: new Date(date) },
      endDate: { gte: new Date(date) }
    }
  });
  
  const allocatedSeatIds = new Set(allocations.map(a => a.seatId));
  
  // Build availability map
  const availability = seats
    .filter(seat => !allocatedSeatIds.has(seat.id))
    .map(seat => {
      const seatBookings = bookings.filter(b => b.seatId === seat.id);
      const amBooked = seatBookings.some(
        b => b.slot === 'AM' || b.slot === 'FULL_DAY'
      );
      const pmBooked = seatBookings.some(
        b => b.slot === 'PM' || b.slot === 'FULL_DAY'
      );
      
      return {
        ...seat,
        availability: {
          AM: !amBooked,
          PM: !pmBooked,
          FULL_DAY: !amBooked && !pmBooked
        }
      };
    });
  
  return NextResponse.json(availability);
}
```

```typescript
// app/api/bookings/my-bookings/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const bookings = await prisma.booking.findMany({
    where: {
      userId: session.user.id,
      status: 'ACTIVE',
      bookingDate: { gte: new Date() }
    },
    include: { seat: true },
    orderBy: { bookingDate: 'asc' }
  });
  
  return NextResponse.json(bookings);
}
```

```typescript
// app/api/bookings/by-date/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  
  if (!date) {
    return NextResponse.json(
      { error: 'Date parameter required' },
      { status: 400 }
    );
  }
  
  const bookings = await prisma.booking.findMany({
    where: {
      bookingDate: new Date(date),
      status: 'ACTIVE'
    },
    include: {
      user: { select: { name: true, email: true, department: true } },
      seat: true
    },
    orderBy: { seat: { seatCode: 'asc' } }
  });
  
  return NextResponse.json(bookings);
}
```

```typescript
// app/api/bookings/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const booking = await prisma.booking.findUnique({
    where: { id: params.id }
  });
  
  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }
  
  // Only owner or admin can cancel
  if (booking.userId !== session.user.id && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  await prisma.booking.update({
    where: { id: params.id },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date()
    }
  });
  
  return NextResponse.json({ success: true });
}
```

### **Allocations API**

```typescript
// app/api/allocations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await auth();
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
  const session = await auth();
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
  const session = await auth();
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
```

```typescript
// app/api/allocations/[id]/approve/route.ts
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
```

### **Floor Plans API**

```typescript
// app/api/floorplans/route.ts
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
```

```typescript
// app/api/floorplans/active/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const floorPlan = await prisma.floorPlan.findFirst({
    where: { isActive: true },
    orderBy: { uploadedAt: 'desc' }
  });
  
  return NextResponse.json(floorPlan);
}
```

***

## **Server Actions (Alternative to API Routes)**

```typescript
// actions/bookings.ts
'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function createBooking(data: {
  seatId: string;
  bookingDate: Date;
  slot: 'AM' | 'PM' | 'FULL_DAY';
}) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');
  
  const booking = await prisma.booking.create({
    data: {
      userId: session.user.id,
      ...data
    }
  });
  
  revalidatePath('/my-bookings');
  return booking;
}

export async function cancelBooking(bookingId: string) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');
  
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId }
  });
  
  if (booking?.userId !== session.user.id && session.user.role !== 'ADMIN') {
    throw new Error('Forbidden');
  }
  
  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date()
    }
  });
  
  revalidatePath('/my-bookings');
}
```

***

## **Business Logic Requirements**

### **Booking Rules**
1. **Conflict Prevention**: Cannot book same seat for same date/slot (enforced by unique constraint)
2. **Long-term Allocation Override**: Seats with active allocations hidden from booking UI
3. **Same-day Booking**: Allow bookings for current day if slot hasn't passed (frontend validation)
4. **Past Date Prevention**: Cannot book dates in the past
5. **Double Booking Prevention**: User cannot book multiple seats for same slot (frontend validation)
6. **Cancellation**: Users can cancel own bookings anytime; admins can cancel any booking
7. **Bulk Booking Limit**: Maximum 14 days per request
8. **Transaction Isolation**: Use Prisma transactions for bulk operations

### **Authorization Rules**
- **Public**: Login page only
- **Employee**: Dashboard, booking, my-bookings, floor-plan
- **Admin**: All employee pages + admin portal (seats, allocations, floor plan upload, all bookings)

### **Validation Requirements**
- Email format validation on registration/login
- Password minimum 8 characters
- Seat code unique and format validation (e.g., T1-T80, S1-S4)
- Date ranges: startDate < endDate for allocations
- File upload: Images only, max 5MB

***

## **Frontend Implementation Guidelines**

### **Employee Portal Pages**

**Dashboard (`/dashboard/page.tsx`)**
- Display upcoming bookings count
- Quick stats: bookings this week
- Link to booking page
- Display active floor plan thumbnail

**Booking Page (`/book/page.tsx`)**
- Date picker (single or range)
- Slot selector (AM/PM/Full Day)
- Seat availability grid with filters (Solo/Team, Monitor)
- Visual indicators: Available (green), Booked (red), Blocked (gray)
- Bulk booking mode toggle
- Real-time availability check on date/slot change
- Confirmation dialog before submit

**My Bookings (`/my-bookings/page.tsx`)**
- List view of upcoming bookings
- Sortable/filterable by date
- Cancel button per booking
- Past bookings tab (read-only)

### **Admin Portal Pages**

**All Bookings (`/admin/bookings/page.tsx`)**
- Calendar view or table view toggle
- Date range filter
- Export to CSV button
- User/seat search
- Cancel booking action

**Allocations (`/admin/allocations/page.tsx`)**
- List of all allocations (pending, approved, expired)
- Create allocation form
- Approve/reject actions
- Expiry date indicators

**Floor Plan Upload (`/admin/floor-plan/page.tsx`)**
- Drag-and-drop upload zone
- Preview before confirm
- History of previous uploads
- Block/unblock action with reason input

***

## **UI/UX Considerations**

### **Design Principles**
- Mobile-responsive (employees may book from phones)
- Accessibility: ARIA labels, keyboard navigation
- Loading states for async operations
- Error messages: Clear, actionable
- Confirmation dialogs for destructive actions

### **Component Library**
Recommended: shadcn/ui (Tailwind-based, tree-shakeable)
- Button, Card, Dialog, Table, Calendar, Select, Input, Badge

### **Color Coding**
- Available: Green (#10B981)
- Booked: Red (#EF4444)
- Blocked: Gray (#6B7280)
- Your Booking: Blue (#3B82F6)

***

## **Deployment Configuration**

### **Environment Variables**

```bash
# .env
DATABASE_URL="postgresql://user:password@localhost:5432/hotdesk"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NODE_ENV="development"
```

### **Production Checklist**
- [ ] Set up PostgreSQL database (e.g., Supabase, AWS RDS, Vercel Postgres)
- [ ] Configure NEXTAUTH_SECRET in production
- [ ] Set up file storage (local `/public/uploads` or S3)
- [ ] Run Prisma migrations: `npx prisma migrate deploy`
- [ ] Create initial admin user via seed script
- [ ] Set up HTTPS
- [ ] Configure CORS if needed
- [ ] Set up monitoring (Sentry, LogRocket)

### **Seed Script Example**

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@company.com' },
    update: {},
    create: {
      email: 'admin@company.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'ADMIN'
    }
  });
  
  // Create sample seats based on your layout
  const seats = [
    // Solo desks
    { seatCode: 'S1', type: 'SOLO', hasMonitor: false },
    { seatCode: 'S2', type: 'SOLO', hasMonitor: false },
    { seatCode: 'S3', type: 'SOLO', hasMonitor: false },
    { seatCode: 'S4', type: 'SOLO', hasMonitor: false },
    // Team cluster desks
    ...Array.from({ length: 80 }, (_, i) => ({
      seatCode: `T${i + 1}`,
      type: 'TEAM_CLUSTER',
      hasMonitor: true
    }))
  ];
  
  for (const seat of seats) {
    await prisma.seat.upsert({
      where: { seatCode: seat.seatCode },
      update: {},
      create: seat as any
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

***

## **Testing Strategy**

### **Unit Tests**
- Business logic functions (validation, date calculations)
- Utility functions

### **Integration Tests**
- API route handlers with mocked Prisma
- Authentication flows
- Booking creation with conflict scenarios

### **E2E Tests (Playwright)**
- Login flow
- Complete booking flow: select date → choose seat → confirm
- Cancel booking
- Admin: Create/block seat
- Admin: Approve allocation

***

## **Stretch Goals (Prioritized)**

### **1. Interactive Floor Plan** [Medium Complexity]
- SVG overlay on floor plan image
- Clickable seats with tooltips
- Visual status indicators
- Click-to-book functionality
- Implementation: Use React + SVG coordinates stored in seat metadata

### **2. Recurring Bookings** [Low-Medium Complexity]
- UI: Pattern selector (Weekly: Mon, Wed, Fri for 4 weeks)
- Backend: Generate array of booking dates from pattern
- Validation: Check each occurrence for conflicts
- Display: Grouped view in "My Bookings"

### **3. Basic Analytics Dashboard** [Low-Medium Complexity]
- Metrics: Daily occupancy rate, popular desks, peak days
- Charts: Occupancy trends (7/30 days)
- Admin-only page: `/admin/analytics`
- Use Chart.js or Recharts

### **4. MS Calendar Integration** [Medium Complexity]
- Microsoft Graph API integration
- OAuth flow for Microsoft accounts
- Auto-create Outlook event on booking
- Event details: Desk code, slot time, floor plan link

### **5. Admin Floor Plan Editor** [High Complexity]
- Drag-and-drop seat placement on blueprint
- Save seat coordinates to metadata
- Enable interactive mode when coordinates exist
- Konva.js or Fabric.js for canvas editing

***

## **Known Constraints from Current System**

Based on your existing Google Sheets process: [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/333623/08262693-4cc0-442e-86b1-e52f4ea52cbb/Reservations-280126-030032.pdf)

1. **Seat Layout**: Main Work Zone has ~80 team cluster desks (T1-T80) and 4 solo desks (S1-S4)
2. **Current Long-term Allocations**: Multiple teams have reserved desks until end of 2025
3. **Allocation Process**: Currently requires speaking with Reporting Officer/PM/Head, then informing Siew Bee/Victor/Jin
4. **Physical Stickers**: Current system uses sticker cards for allocated desks
5. **Shared Cupboards**: Available for storage (reference in floor plan)

**System Should Support**:
- Migrating existing long-term allocations from spreadsheet
- Notification workflow when allocation requested (email to approvers)
- Export current allocations for physical sticker printing
- Grace period for expired allocations (e.g., 7 days before auto-expiring)

***

## **Performance Optimizations**

1. **Database Indexes**: Already defined in Prisma schema
2. **Query Optimization**:
   - Use `select` to limit returned fields
   - Batch seat availability checks
3. **Caching**:
   - Cache active floor plan URL (Redis or in-memory)
   - Cache seat list (revalidate on mutation)
4. **Pagination**:
   - Admin booking list: 50 per page
   - Load more pattern for better UX
5. **Optimistic UI Updates**:
   - Show booking immediately, rollback on error

***

## **Security Considerations**

1. **Password Hashing**: bcryptjs with salt rounds 10
2. **SQL Injection**: Prevented by Prisma ORM
3. **CSRF Protection**: NextAuth handles automatically
4. **Rate Limiting**: Implement for login endpoint (e.g., 5 attempts per minute)
5. **File Upload Security**:
   - Validate file types by magic bytes, not just extension
   - Sanitize filenames
   - Store outside webroot or use signed URLs
6. **Session Security**:
   - httpOnly cookies
   - Secure flag in production
   - SameSite=Lax
7. **Input Validation**: Zod schemas for all user inputs

***

## **Package.json Dependencies**

```json
{
  "dependencies": {
    "next": "^14.2.0",
    "@prisma/client": "^5.14.0",
    "next-auth": "^5.0.0-beta.19",
    "@auth/prisma-adapter": "^2.4.0",
    "bcryptjs": "^2.4.3",
    "zod": "^3.23.0",
    "date-fns": "^3.6.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "prisma": "^5.14.0",
    "typescript": "^5.4.0",
    "@types/node": "^20.12.0",
    "@types/react": "^18.3.0",
    "@types/bcryptjs": "^2.4.6",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

***

## **Quick Start Commands**

```bash
# Install dependencies
npm install

# Set up database
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed

# Run development server
npm run dev

# Build for production
npm run build
npm start
```

***
