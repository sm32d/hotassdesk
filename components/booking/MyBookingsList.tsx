'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

type Booking = {
  id: string;
  bookingDate: string;
  slot: 'AM' | 'PM' | 'FULL_DAY';
  seat: {
    seatCode: string;
    type: string;
  };
  status: 'ACTIVE' | 'CANCELLED';
};

export default function MyBookingsList() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/bookings/my-bookings');
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch (error) {
      console.error('Failed to fetch bookings', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        // Remove from list or refresh
        setBookings(bookings.filter(b => b.id !== id));
      } else {
        alert('Failed to cancel booking');
      }
    } catch (error) {
      alert('An error occurred');
    }
  };

  if (loading) {
    return <div className="text-gray-500">Loading bookings...</div>;
  }

  if (bookings.length === 0) {
    return (
      <div className="rounded-lg bg-white p-6 text-center shadow">
        <p className="text-gray-500">You have no upcoming bookings.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow">
      <ul className="divide-y divide-gray-200">
        {bookings.map((booking) => (
          <li key={booking.id} className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">
                  {format(new Date(booking.bookingDate), 'EEEE, MMMM d, yyyy')}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-lg font-bold text-gray-900">
                    Seat {booking.seat.seatCode}
                  </span>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                    {booking.slot === 'FULL_DAY' ? 'Full Day' : booking.slot}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleCancel(booking.id)}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Cancel
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
