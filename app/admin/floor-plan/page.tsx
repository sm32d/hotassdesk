import { prisma } from '@/lib/db';
import FloorPlanEditor from '@/components/admin/FloorPlanEditor';

export default async function FloorPlanPage() {
  const [seats, activeFloorPlan] = await Promise.all([
    prisma.seat.findMany({
      orderBy: { seatCode: 'asc' },
      select: {
        id: true,
        seatCode: true,
        type: true,
        x: true,
        y: true
      }
    }),
    prisma.floorPlan.findFirst({
      where: { isActive: true },
      orderBy: { uploadedAt: 'desc' }
    })
  ]);

  return (
    <div className="space-y-6 h-full">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Floor Plan Management</h1>
      </div>
      <FloorPlanEditor initialSeats={seats} activeFloorPlan={activeFloorPlan} />
    </div>
  );
}
