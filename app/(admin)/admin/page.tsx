import { prisma } from '@/lib/db';
import Link from 'next/link';
import { format, addDays, startOfDay } from 'date-fns';

export default async function AdminDashboard() {
  const totalSeats = await prisma.seat.count();

  const stats = {
    totalUsers: await prisma.user.count(),
    totalSeats,
    totalBookings: await prisma.booking.count({ where: { status: 'ACTIVE', bookingDate: { gte: new Date() } } }),
    pendingAllocations: await prisma.longTermAllocation.count({
      where: { status: 'PENDING' }
    })
  };

  // Occupancy Data for next 7 days
  const today = startOfDay(new Date());
  const dates = Array.from({ length: 7 }, (_, i) => addDays(today, i));
  
  const occupancyData = await Promise.all(dates.map(async (date) => {
    // Count distinct seats booked for this date
    const bookings = await prisma.booking.findMany({
      where: {
        bookingDate: date,
        status: 'ACTIVE'
      },
      select: {
        seatId: true
      },
      distinct: ['seatId']
    });
    
    return {
      date: date,
      count: bookings.length,
      percentage: totalSeats > 0 ? Math.round((bookings.length / totalSeats) * 100) : 0
    };
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg p-5">
          <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
          <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.totalUsers}</dd>
          <div className="mt-4">
            <Link href="/admin/users" className="text-sm font-medium text-blue-600 hover:text-blue-500">
              View all users &rarr;
            </Link>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg p-5">
          <dt className="text-sm font-medium text-gray-500 truncate">Total Seats</dt>
          <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.totalSeats}</dd>
          <div className="mt-4">
            <Link href="/admin/floor-plan" className="text-sm font-medium text-blue-600 hover:text-blue-500">
              Manage floor plan &rarr;
            </Link>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg p-5">
          <dt className="text-sm font-medium text-gray-500 truncate">Active Bookings</dt>
          <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.totalBookings}</dd>
          <div className="mt-4">
            <Link href="/admin/bookings" className="text-sm font-medium text-blue-600 hover:text-blue-500">
              View all bookings &rarr;
            </Link>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg p-5">
          <dt className="text-sm font-medium text-gray-500 truncate">Pending Approvals</dt>
          <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.pendingAllocations}</dd>
          <div className="mt-4">
            <span className="text-sm font-medium text-gray-400 cursor-not-allowed">
              Coming soon
            </span>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Seat Occupancy Trends (Next 7 Days)</h2>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-end space-x-2 sm:space-x-4 h-64">
             {occupancyData.map((data, index) => (
                <div key={index} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                   {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                    <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap shadow-lg">
                       {format(data.date, 'MMM d')}: {data.count} / {totalSeats} seats ({data.percentage}%)
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-100 rounded-t-md relative flex-1 flex items-end overflow-hidden">
                     <div 
                        className={`w-full transition-all duration-500 ${
                           data.percentage > 80 ? 'bg-red-500' : 
                           data.percentage > 50 ? 'bg-blue-500' : 'bg-green-500'
                        }`}
                        style={{ height: `${data.percentage}%` }}
                     />
                  </div>
                  <div className="mt-2 text-xs text-gray-500 font-medium whitespace-nowrap">
                    {format(data.date, 'EEE')}
                  </div>
                </div>
             ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-4">
             {/* Placeholder for future actions */}
             <p className="text-gray-500">Manage Seats and Approvals functionality coming soon.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
