'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import Modal from '../ui/Modal';
import { getBookingDisplayStatus, getBookingStatusColor } from '@/lib/utils';

type Booking = {
  id: string;
  bookingDate: string;
  slot: 'AM' | 'PM' | 'FULL_DAY';
  seat: {
    seatCode: string;
    type: string;
    isBlocked?: boolean;
    blockedReason?: string | null;
  };
  status: 'ACTIVE' | 'CANCELLED';
};

export default function MyBookingsList() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

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

  const handleCancel = (id: string) => {
    setCancelBookingId(id);
  };

  const executeCancel = async () => {
    if (!cancelBookingId) return;

    try {
      const res = await fetch(`/api/bookings/${cancelBookingId}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        setBookings(bookings.filter(b => b.id !== cancelBookingId));
        setCancelBookingId(null);
      } else {
        setAlertMessage('Failed to cancel booking');
        setCancelBookingId(null);
      }
    } catch (error) {
      setAlertMessage('An error occurred');
      setCancelBookingId(null);
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
    <>
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
                  {(() => {
                    const displayStatus = getBookingDisplayStatus(booking.status, booking.bookingDate);
                    return (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getBookingStatusColor(displayStatus)}`}>
                        {displayStatus}
                      </span>
                    );
                  })()}
                </div>
                {booking.seat.isBlocked && (
                  <div className="mt-2 rounded-md bg-red-50 p-2 border border-red-200">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">
                          Seat Blocked
                        </h3>
                        <div className="mt-1 text-sm text-red-700">
                          <p>
                            This seat is currently unavailable ({booking.seat.blockedReason || 'No reason provided'}). 
                            Please cancel this booking and select another seat.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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

      <Modal
        isOpen={!!cancelBookingId}
        onClose={() => setCancelBookingId(null)}
        title="Cancel Booking"
        footer={
          <>
            <button
              onClick={executeCancel}
              className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:w-auto"
            >
              Yes, Cancel Booking
            </button>
            <button
              onClick={() => setCancelBookingId(null)}
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
            >
              Keep Booking
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-500">
          Are you sure you want to cancel this booking? This action cannot be undone.
        </p>
      </Modal>

      <Modal
        isOpen={!!alertMessage}
        onClose={() => setAlertMessage(null)}
        title="Alert"
        footer={
          <button
            onClick={() => setAlertMessage(null)}
            className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:w-auto"
          >
            OK
          </button>
        }
      >
        <p className="text-sm text-gray-500">{alertMessage}</p>
      </Modal>
    </>
  );
}
