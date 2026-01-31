'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { getBookingDisplayStatus, getBookingStatusColor } from '@/lib/utils';

type BookingWithDetails = {
  id: string;
  bookingDate: string;
  slot: string;
  status: string;
  user: {
    name: string;
    email: string;
    department: string | null;
  };
  seat: {
    seatCode: string;
    type: string;
  };
};

export default function BookingsTable({ 
  initialBookings 
}: { 
  initialBookings: BookingWithDetails[] 
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // State for filters
  const [userSearch, setUserSearch] = useState(searchParams.get('user') || '');
  const [seatFilter, setSeatFilter] = useState(searchParams.get('seat') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [startDate, setStartDate] = useState(searchParams.get('startDate') || '');
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || '');
  
  const applyFilters = () => {
    const params = new URLSearchParams();
    if (userSearch) params.set('user', userSearch);
    if (seatFilter) params.set('seat', seatFilter);
    if (statusFilter) params.set('status', statusFilter);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);

    startTransition(() => {
      router.replace(`/admin/bookings?${params.toString()}`);
    });
  };

  const clearFilters = () => {
    setUserSearch('');
    setSeatFilter('');
    setStatusFilter('');
    setStartDate('');
    setEndDate('');
    startTransition(() => {
      router.replace('/admin/bookings');
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      applyFilters();
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* User Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700">User (Name/Email)</label>
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search user..."
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 text-gray-900"
            />
          </div>

          {/* Seat Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Seat Code</label>
            <input
              type="text"
              value={seatFilter}
              onChange={(e) => setSeatFilter(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. S1"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 text-gray-900"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 text-gray-900"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active (Not Cancelled)</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 text-gray-900"
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-4">
          <button
            onClick={clearFilters}
            disabled={isPending}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed gap-2"
          >
            {isPending && (
              <svg className="h-4 w-4 animate-spin text-gray-700" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            Clear Filters
          </button>
          <button
            onClick={applyFilters}
            disabled={isPending}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed gap-2"
          >
            {isPending && (
              <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            {isPending ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      <div className={`bg-white shadow overflow-hidden sm:rounded-lg transition-opacity duration-200 ${isPending ? 'opacity-50' : 'opacity-100'}`}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Seat
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Slot
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {initialBookings.length > 0 ? (
                initialBookings.map((booking) => (
                  <tr key={booking.id} className={booking.status === 'CANCELLED' ? 'bg-gray-50 opacity-75' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(booking.bookingDate), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{booking.user.name}</div>
                      <div className="text-sm text-gray-500">{booking.user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="font-medium text-gray-900">{booking.seat.seatCode}</span>
                      <span className="ml-2 text-xs text-gray-400">({booking.seat.type})</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {booking.slot}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        const displayStatus = getBookingDisplayStatus(
                          booking.status as 'ACTIVE' | 'CANCELLED',
                          booking.bookingDate
                        );
                        return (
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getBookingStatusColor(displayStatus)}`}>
                            {displayStatus}
                          </span>
                        );
                      })()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    No bookings found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
