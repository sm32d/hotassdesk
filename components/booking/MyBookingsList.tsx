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
  groupId?: string | null;
};

// Helper to download ICS
const downloadICS = (booking: Booking) => {
  const startDate = new Date(booking.bookingDate);
  // Set time based on slot
  if (booking.slot === 'PM') startDate.setHours(13, 0, 0);
  else startDate.setHours(9, 0, 0);
  
  const endDate = new Date(startDate);
  if (booking.slot === 'AM') endDate.setHours(13, 0, 0);
  else if (booking.slot === 'PM') endDate.setHours(17, 0, 0);
  else endDate.setHours(17, 0, 0);

  const formatDate = (date: Date) => date.toISOString().replace(/-|:|\.\d+/g, '');
  
  const content = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//HotAssDesk//Booking//EN',
    'BEGIN:VEVENT',
    `UID:${booking.id}`,
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${formatDate(startDate)}`,
    `DTEND:${formatDate(endDate)}`,
    `SUMMARY:Desk Booking: Seat ${booking.seat.seatCode}`,
    `DESCRIPTION:Desk booking at HotAssDesk. Seat: ${booking.seat.seatCode}, Slot: ${booking.slot}`,
    `LOCATION:Office`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `booking-${booking.bookingDate}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default function MyBookingsList() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelData, setCancelData] = useState<{ id: string; isGroup: boolean } | null>(null);
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

  const handleCancel = (id: string, isGroup: boolean = false) => {
    setCancelData({ id, isGroup });
  };

  const executeCancel = async () => {
    if (!cancelData) return;

    try {
      const url = cancelData.isGroup 
        ? `/api/bookings/groups/${cancelData.id}` 
        : `/api/bookings/${cancelData.id}`;

      const res = await fetch(url, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        if (cancelData.isGroup) {
          setBookings(bookings.map(b => 
            b.groupId === cancelData.id ? { ...b, status: 'CANCELLED' } : b
          ));
        } else {
          setBookings(bookings.map(b => 
            b.id === cancelData.id ? { ...b, status: 'CANCELLED' } : b
          ));
        }
        setCancelData(null);
      } else {
        setAlertMessage('Failed to cancel booking');
        setCancelData(null);
      }
    } catch (error) {
      setAlertMessage('An error occurred');
      setCancelData(null);
    }
  };

  if (loading) {
    return <div className="text-gray-500">Loading bookings...</div>;
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const upcomingBookings = bookings
    .filter((b) => {
      const bDate = new Date(b.bookingDate);
      const bDay = new Date(bDate.getFullYear(), bDate.getMonth(), bDate.getDate());
      return b.status === 'ACTIVE' && bDay >= today;
    })
    .sort((a, b) => new Date(a.bookingDate).getTime() - new Date(b.bookingDate).getTime());

  const pastBookings = bookings
    .filter((b) => {
      const bDate = new Date(b.bookingDate);
      const bDay = new Date(bDate.getFullYear(), bDate.getMonth(), bDate.getDate());
      return b.status === 'CANCELLED' || bDay < today;
    })
    .sort((a, b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime());

  const groupedUpcomingBookings = upcomingBookings.reduce((acc, booking) => {
    const key = booking.groupId || booking.id;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(booking);
    return acc;
  }, {} as Record<string, Booking[]>);

  const renderBookingItem = (booking: Booking, showCancel: boolean) => (
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
            {booking.status === 'ACTIVE' && (
                <button 
                onClick={() => downloadICS(booking)}
                className="ml-2 text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Add to Calendar
                </button>
            )}
          </div>
          {booking.seat.isBlocked && booking.status === 'ACTIVE' && (
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
        {showCancel && (
          <button
            onClick={() => handleCancel(booking.id)}
            className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Cancel
          </button>
        )}
      </div>
    </li>
  );

  const renderGroupItem = (bookings: Booking[]) => {
    if (bookings.length === 1) return renderBookingItem(bookings[0], true);
    
    // Check if it's a multi-date group (Recurring) or single-date group (Group Booking)
    const dates = Array.from(new Set(bookings.map(b => b.bookingDate)));
    const isRecurring = dates.length > 1;
    const first = bookings[0];
    const displayStatus = getBookingDisplayStatus(first.status, first.bookingDate);

    // If recurring, sort by date
    if (isRecurring) {
        bookings.sort((a, b) => new Date(a.bookingDate).getTime() - new Date(b.bookingDate).getTime());
    }

    return (
      <li key={first.groupId} className="p-4 sm:p-6">
        <div className="mb-3 flex items-center justify-between">
           <div>
              <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-1 rounded uppercase tracking-wider">
                    {isRecurring ? 'Recurring Booking' : 'Group Booking'}
                  </span>
                  {!isRecurring && (
                    <p className="text-sm font-medium text-blue-600">
                        {format(new Date(first.bookingDate), 'EEEE, MMMM d, yyyy')}
                    </p>
                  )}
              </div>
              <div className="mt-1 flex items-center gap-2">
                 <span className="text-sm font-medium text-gray-900">
                    {bookings.length} {isRecurring ? 'Days' : 'Seats'}
                 </span>
                 <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                   {first.slot === 'FULL_DAY' ? 'Full Day' : first.slot}
                 </span>
                 <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getBookingStatusColor(displayStatus)}`}>
                   {displayStatus}
                 </span>
              </div>
           </div>
           <button
             onClick={() => handleCancel(first.groupId!, true)}
             className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
           >
             Cancel Group
           </button>
        </div>
        <div className="ml-2 pl-4 border-l-2 border-blue-200 space-y-2">
          {bookings.map(booking => (
            <div key={booking.id} className="flex items-center justify-between py-1">
               <div className="flex items-center gap-3">
                 {isRecurring && (
                    <span className="text-sm text-gray-500 w-32">
                        {format(new Date(booking.bookingDate), 'MMM d, yyyy')}
                    </span>
                 )}
                 <span className="text-md font-bold text-gray-900">
                   Seat {booking.seat.seatCode}
                 </span>
                 {booking.status === 'ACTIVE' && (
                    <button 
                        onClick={() => downloadICS(booking)}
                        className="text-xs text-blue-600 hover:underline"
                    >
                        Add to Calendar
                    </button>
                 )}
               </div>
            </div>
          ))}
        </div>
      </li>
    );
  };

  return (
    <>
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Upcoming Bookings</h2>
          {upcomingBookings.length > 0 ? (
            <div className="overflow-hidden rounded-lg bg-white shadow">
              <ul className="divide-y divide-gray-200">
                {Object.values(groupedUpcomingBookings).map(group => renderGroupItem(group))}
              </ul>
            </div>
          ) : (
            <div className="rounded-lg bg-white p-6 text-center shadow">
              <p className="text-gray-500">You have no upcoming bookings.</p>
            </div>
          )}
        </div>

        {pastBookings.length > 0 && (
          <div className="pt-4 border-t border-gray-200">
             <details className="group">
              <summary className="flex cursor-pointer items-center justify-between rounded-lg bg-gray-50 p-4 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <span className="text-lg font-medium text-gray-900">Booking History</span>
                <span className="ml-6 flex items-center">
                   <svg className="h-5 w-5 text-gray-500 group-open:rotate-180 transition-transform" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                     <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                   </svg>
                </span>
              </summary>
              <div className="mt-4 overflow-hidden rounded-lg bg-white shadow">
                <ul className="divide-y divide-gray-200">
                  {pastBookings.map((booking) => renderBookingItem(booking, false))}
                </ul>
              </div>
            </details>
          </div>
        )}
      </div>

      <Modal
        isOpen={!!cancelData}
        onClose={() => setCancelData(null)}
        title={cancelData?.isGroup ? "Cancel Group Booking" : "Cancel Booking"}
        footer={
          <>
            <button
              onClick={executeCancel}
              className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:w-auto"
            >
              {cancelData?.isGroup ? "Yes, Cancel All Seats" : "Yes, Cancel Booking"}
            </button>
            <button
              onClick={() => setCancelData(null)}
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
            >
              Keep Booking
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-500">
          {cancelData?.isGroup 
            ? "Are you sure you want to cancel this entire group booking? All seats in this group will be released."
            : "Are you sure you want to cancel this booking? This action cannot be undone."}
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
