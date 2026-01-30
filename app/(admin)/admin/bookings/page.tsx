import { prisma } from '@/lib/db';
import BookingsTable from '@/components/admin/BookingsTable';
import { BookingStatus, Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const userSearch = typeof searchParams.user === 'string' ? searchParams.user : undefined;
  const seatFilter = typeof searchParams.seat === 'string' ? searchParams.seat : undefined;
  const statusFilter = typeof searchParams.status === 'string' ? searchParams.status : undefined;
  const startDate = typeof searchParams.startDate === 'string' ? searchParams.startDate : undefined;
  const endDate = typeof searchParams.endDate === 'string' ? searchParams.endDate : undefined;

  const where: Prisma.BookingWhereInput = {};
  const andConditions: Prisma.BookingWhereInput[] = [];

  if (userSearch) {
    andConditions.push({
      user: {
        OR: [
          { name: { contains: userSearch, mode: 'insensitive' } },
          { email: { contains: userSearch, mode: 'insensitive' } },
        ],
      },
    });
  }

  if (seatFilter) {
    andConditions.push({
      seat: {
        seatCode: { contains: seatFilter, mode: 'insensitive' },
      },
    });
  }

  if (statusFilter && Object.values(BookingStatus).includes(statusFilter as BookingStatus)) {
    andConditions.push({
      status: statusFilter as BookingStatus,
    });
  }

  if (startDate) {
    andConditions.push({
      bookingDate: {
        gte: new Date(startDate),
      },
    });
  }

  if (endDate) {
    andConditions.push({
      bookingDate: {
        lte: new Date(endDate),
      },
    });
  }

  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  const bookings = await prisma.booking.findMany({
    where,
    include: {
      user: {
        select: {
          name: true,
          email: true,
          department: true,
        },
      },
      seat: {
        select: {
          seatCode: true,
          type: true,
        },
      },
    },
    orderBy: {
      bookingDate: 'desc',
    },
    take: 100,
  });

  const formattedBookings = bookings.map(b => ({
    ...b,
    bookingDate: b.bookingDate.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">All Bookings</h1>
      </div>
      <BookingsTable initialBookings={formattedBookings} />
    </div>
  );
}
