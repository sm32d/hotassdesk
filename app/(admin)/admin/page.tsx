import { prisma } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Assuming these exist, if not I'll use raw HTML/Tailwind
// Actually, to be safe I will use raw Tailwind for now as I am not sure if UI components are installed.
import Link from 'next/link';

export default async function AdminDashboard() {
  const stats = {
    totalUsers: await prisma.user.count(),
    totalSeats: await prisma.seat.count(),
    totalBookings: await prisma.booking.count(),
    pendingAllocations: await prisma.longTermAllocation.count({
      where: { status: 'PENDING' }
    })
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg p-5">
          <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
          <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.totalUsers}</dd>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg p-5">
          <dt className="text-sm font-medium text-gray-500 truncate">Total Seats</dt>
          <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.totalSeats}</dd>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg p-5">
          <dt className="text-sm font-medium text-gray-500 truncate">Active Bookings</dt>
          <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.totalBookings}</dd>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg p-5">
          <dt className="text-sm font-medium text-gray-500 truncate">Pending Approvals</dt>
          <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.pendingAllocations}</dd>
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
