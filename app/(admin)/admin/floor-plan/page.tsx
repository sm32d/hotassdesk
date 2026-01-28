import { prisma } from '@/lib/db';
import FloorPlanEditor from '@/components/admin/FloorPlanEditor';

export default async function FloorPlanPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [seatsData, activeFloorPlan] = await Promise.all([
    prisma.seat.findMany({
      orderBy: { seatCode: 'asc' },
      include: {
        bookings: {
          where: {
            bookingDate: { gte: today },
            status: 'ACTIVE'
          },
          select: { id: true }
        }
      }
    }),
    prisma.floorPlan.findFirst({
      where: { isActive: true },
      orderBy: { uploadedAt: 'desc' }
    })
  ]);

  const seats = seatsData.map(seat => ({
    id: seat.id,
    seatCode: seat.seatCode,
    type: seat.type,
    x: seat.x,
    y: seat.y,
    hasUpcomingBookings: seat.bookings.length > 0
  }));

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.24))] gap-6">
      <div className="flex justify-between items-center flex-shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">Floor Plan Management</h1>
      </div>
      <div className="flex-1 min-h-0">
        <FloorPlanEditor initialSeats={seats} activeFloorPlan={activeFloorPlan} />
      </div>
    </div>
  );
}
