'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { format } from 'date-fns';

type Seat = {
  id: string;
  seatCode: string;
  type: 'SOLO' | 'TEAM_CLUSTER';
  hasMonitor: boolean;
  isBlocked: boolean;
  x: number | null;
  y: number | null;
  availability: {
    AM: boolean;
    PM: boolean;
    FULL_DAY: boolean;
  };
};

type FloorPlan = {
  imageUrl: string;
  defaultZoom: number;
};

export default function BookingInterface() {
  const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [slot, setSlot] = useState<'AM' | 'PM' | 'FULL_DAY'>('FULL_DAY');
  const [seats, setSeats] = useState<Seat[]>([]);
  const [floorPlan, setFloorPlan] = useState<FloorPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [zoom, setZoom] = useState(1);
  const [imgDimensions, setImgDimensions] = useState<{ width: number; height: number } | null>(null);
  const lastImageUrlRef = useRef<string | null>(null);

  const [groupBookings, setGroupBookings] = useState(true);
  
  // Recurrence state
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<'DAILY' | 'WEEKLY'>('WEEKLY');
  const [recurrenceEnd, setRecurrenceEnd] = useState<string>(
    format(new Date(new Date().setDate(new Date().getDate() + 7)), 'yyyy-MM-dd')
  );

  useEffect(() => {
    setZoom(floorPlan?.defaultZoom || 1);
    
    if (floorPlan?.imageUrl !== lastImageUrlRef.current) {
      setImgDimensions(null);
      lastImageUrlRef.current = floorPlan?.imageUrl || null;
    }
  }, [floorPlan]);

  const fetchFloorPlan = useCallback(async () => {
    try {
      const res = await fetch('/api/floorplans/active');
      if (res.ok) {
        const data = await res.json();
        setFloorPlan(data);
      }
    } catch (error) {
      console.error('Failed to fetch floor plan', error);
    }
  }, []);

  const fetchAvailability = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/availability?date=${date}`);
      if (res.ok) {
        const data = await res.json();
        setSeats(data);
      }
    } catch (error) {
      console.error('Failed to fetch availability', error);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchAvailability();
    fetchFloorPlan();
  }, [fetchAvailability, fetchFloorPlan]);

  const handleBooking = async () => {
    if (selectedSeats.length === 0) return;
    
    setSubmitting(true);
    setMessage('');
    
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookings: selectedSeats.map(seatId => ({
            seatId,
            bookingDate: date,
            slot
          })),
          groupBookings,
          recurrence: isRecurring ? {
            type: recurrenceType,
            until: recurrenceEnd
          } : undefined
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setMessage('Booking successful!');
        setSelectedSeats([]);
        fetchAvailability(); // Refresh
      } else {
        setMessage(data.error || 'Booking failed');
      }
    } catch (error) {
      setMessage('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSeat = (seatId: string) => {
    setSelectedSeats(prev => 
      prev.includes(seatId) 
        ? prev.filter(id => id !== seatId)
        : [...prev, seatId]
    );
  };

  const isSeatAvailable = (seat: Seat) => {
    if (slot === 'FULL_DAY') return seat.availability.FULL_DAY;
    if (slot === 'AM') return seat.availability.AM;
    if (slot === 'PM') return seat.availability.PM;
    return false;
  };

  const sortSeats = (a: Seat, b: Seat) => 
    a.seatCode.localeCompare(b.seatCode, undefined, { numeric: true, sensitivity: 'base' });

  const placedSeats = seats
    .filter(s => s.x !== null && s.y !== null)
    .sort(sortSeats);
    
  const unplacedSeats = seats
    .filter(s => s.x === null || s.y === null)
    .sort(sortSeats);
    
  // Sort all seats for list view when showing everything
  const sortedSeats = [...seats].sort(sortSeats);

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      {/* Controls */}
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Date</label>
          <input
            type="date"
            value={date}
            min={format(new Date(), 'yyyy-MM-dd')}
            onChange={(e) => setDate(e.target.value)}
            className="text-gray-700 mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Time Slot</label>
          <select
            value={slot}
            onChange={(e) => setSlot(e.target.value as any)}
            className="text-gray-700 mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="FULL_DAY">Full Day</option>
            <option value="AM">Morning (AM)</option>
            <option value="PM">Afternoon (PM)</option>
          </select>
        </div>
        
        {/* Recurrence Controls */}
        <div className="md:col-span-2">
           <div className="flex items-center">
             <input
               id="is-recurring"
               type="checkbox"
               checked={isRecurring}
               onChange={(e) => setIsRecurring(e.target.checked)}
               className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
             />
             <label htmlFor="is-recurring" className="ml-2 text-sm font-medium text-gray-700 cursor-pointer select-none">
               Repeat Booking
             </label>
           </div>
           
           <div className="mt-1 flex items-center">
              {isRecurring ? (
                <div className="flex gap-2 items-center w-full">
                 <select
                   value={recurrenceType}
                   onChange={(e) => setRecurrenceType(e.target.value as any)}
                   className="text-gray-700 text-sm block w-1/3 rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:outline-none"
                 >
                   <option value="DAILY">Daily (Mon-Fri)</option>
                   <option value="WEEKLY">Weekly</option>
                 </select>
                 <span className="text-sm text-gray-500">until</span>
                 <input
                   type="date"
                   value={recurrenceEnd}
                   min={date}
                   onChange={(e) => setRecurrenceEnd(e.target.value)}
                   className="text-gray-700 text-sm block flex-1 rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:outline-none"
                 />
               </div>
             ) : (
                <span className="text-xs text-gray-400">
                  Enable to book multiple days
                </span>
             )}
           </div>
        </div>

        <div className="flex items-end p-2 md:col-span-4 md:justify-end">
          <div className="flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`px-4 py-2 text-sm font-medium border rounded-l-lg ${
                viewMode === 'map' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              Map View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 text-sm font-medium border rounded-r-lg ${
                viewMode === 'list' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              List View
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-md ${message.includes('successful') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <svg className="h-8 w-8 animate-spin text-blue-600 mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <div className="text-gray-500 font-medium">Loading availability...</div>
        </div>
      ) : (
        <>
          {viewMode === 'map' && floorPlan ? (
            <>
            <div className="mb-8 border rounded-lg bg-gray-50 relative overflow-hidden">
               {/* Zoom Controls */}
               <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 bg-white rounded-md shadow-sm border border-gray-200 p-1">
                 <button 
                   onClick={() => setZoom(z => Math.min(3, z + 0.1))}
                   className="p-1 hover:bg-gray-100 rounded text-gray-700"
                   title="Zoom In"
                 >
                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                   </svg>
                 </button>
                 <button 
                   onClick={() => setZoom(z => Math.max(0.2, z - 0.1))}
                   className="p-1 hover:bg-gray-100 rounded text-gray-700"
                   title="Zoom Out"
                 >
                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                   </svg>
                 </button>
                 <button 
                   onClick={() => setZoom(1)}
                   className="p-1 hover:bg-gray-100 rounded text-xs font-medium text-gray-600"
                   title="Reset Zoom"
                 >
                   {Math.round(zoom * 100)}%
                 </button>
               </div>

               <div className="overflow-auto max-h-[75vh]">
                 <div className="relative inline-block">
                   <img
                    src={floorPlan.imageUrl}
                    alt="Floor Plan"
                    className="max-w-none transition-all duration-200 ease-in-out"
                    onLoad={(e) => {
                      setImgDimensions({
                        width: e.currentTarget.naturalWidth,
                        height: e.currentTarget.naturalHeight
                      });
                    }}
                    style={{ 
                      display: 'block',
                      width: imgDimensions ? `${imgDimensions.width * zoom}px` : 'auto'
                    }} 
                   />
                   
                   {placedSeats.map(seat => {
                     const available = isSeatAvailable(seat);
                     const isSelected = selectedSeats.includes(seat.id);
                     
                     return (
                       <button
                         key={seat.id}
                         onClick={() => available && toggleSeat(seat.id)}
                         disabled={!available}
                         className={`absolute w-8 h-8 -ml-4 -mt-4 flex items-center justify-center rounded-full text-xs font-bold shadow-md border-2 transition-transform hover:scale-110 ${
                           !available 
                              ? 'bg-gray-200 border-gray-400 text-gray-400 cursor-not-allowed'
                              : isSelected
                                ? 'bg-blue-600 border-blue-800 text-white ring-2 ring-offset-2 ring-blue-500 z-10'
                                : seat.type === 'SOLO'
                                  ? 'bg-green-100 border-green-500 text-green-800 hover:bg-green-200'
                                  : 'bg-blue-100 border-blue-500 text-blue-800 hover:bg-blue-200'
                         }`}
                         style={{ left: `${seat.x}%`, top: `${seat.y}%` }}
                         title={`${seat.seatCode} (${seat.type}${seat.hasMonitor ? ', Monitor' : ''}) - ${available ? 'Available' : 'Booked'}`}
                       >
                         {seat.seatCode}
                       </button>
                     );
                   })}
                 </div>
               </div>
            </div>
            
            {/* Legend for Map */}
            <div className="mb-8 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-700 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-100 border border-green-500"></div>
                <span>Solo Desk</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-blue-100 border border-blue-500"></div>
                <span>Team Desk</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-gray-200 border border-gray-400"></div>
                <span>Unavailable</span>
              </div>
               <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-blue-600 border border-blue-800"></div>
                <span>Selected</span>
              </div>
            </div>
            </>
          ) : viewMode === 'map' && !floorPlan ? (
             <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
                <p className="text-gray-500">No floor plan available. Please switch to List View.</p>
             </div>
          ) : null}

          {/* List View (Always show unplaced seats, or all seats if in list mode) */}
          {(viewMode === 'list' || unplacedSeats.length > 0) && (
            <div className="space-y-4">
              {viewMode === 'map' && unplacedSeats.length > 0 && (
                <h3 className="font-medium text-gray-900 border-b pb-2">Unmapped Seats</h3>
              )}
              
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {(viewMode === 'list' ? sortedSeats : unplacedSeats).map((seat) => {
                  const available = isSeatAvailable(seat);
                  const isSelected = selectedSeats.includes(seat.id);
                  return (
                    <button
                      key={seat.id}
                      onClick={() => available && toggleSeat(seat.id)}
                      disabled={!available}
                      className={`flex flex-col items-center justify-center rounded-lg border p-4 text-center transition-colors ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
                          : available
                          ? 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                          : 'cursor-not-allowed border-gray-100 bg-gray-50 opacity-50'
                      }`}
                    >
                      <span className={`text-lg font-bold ${available ? 'text-gray-900' : 'text-gray-400'}`}>
                        {seat.seatCode}
                      </span>
                      <span className="text-xs text-gray-500">{seat.type}</span>
                      {seat.hasMonitor && <span className="mt-1 text-[10px] text-blue-600">🖥️ Monitor</span>}
                      {!available && <span className="mt-1 text-xs font-medium text-red-500">Booked</span>}
                    </button>
                  );
                })}
              </div>
              
               {seats.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No seats found matching your criteria.
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Booking Footer */}
      <div className="mt-8 flex items-center justify-between border-t pt-6">
        <div className="flex flex-col gap-2">
          <div className="text-sm text-gray-500">
            {selectedSeats.length > 0 ? (
              <span>
                Selected ({selectedSeats.length}): <span className="font-bold text-gray-900">
                  {seats.filter(s => selectedSeats.includes(s.id)).map(s => s.seatCode).join(', ')}
                </span>
              </span>
            ) : (
              'Select seats to continue'
            )}
          </div>
          {selectedSeats.length > 1 && (
            <div className="flex items-center">
              <input
                id="group-booking"
                type="checkbox"
                checked={groupBookings}
                onChange={(e) => setGroupBookings(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="group-booking" className="ml-2 text-sm text-gray-700">
                Book as a group (manage together)
              </label>
            </div>
          )}
        </div>
        <button
          onClick={handleBooking}
          disabled={selectedSeats.length === 0 || submitting}
          className="rounded-md bg-blue-600 px-6 py-2 text-white shadow-sm hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {submitting && (
            <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
          {submitting ? 'Booking...' : `Confirm Booking (${selectedSeats.length})`}
        </button>
      </div>
    </div>
  );
}
