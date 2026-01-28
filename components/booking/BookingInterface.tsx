'use client';

import { useState, useEffect, useRef } from 'react';
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
};

export default function BookingInterface() {
  const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [slot, setSlot] = useState<'AM' | 'PM' | 'FULL_DAY'>('FULL_DAY');
  const [seats, setSeats] = useState<Seat[]>([]);
  const [floorPlan, setFloorPlan] = useState<FloorPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  useEffect(() => {
    fetchAvailability();
    fetchFloorPlan();
  }, [date]);

  const fetchFloorPlan = async () => {
    try {
      const res = await fetch('/api/floorplans/active');
      if (res.ok) {
        const data = await res.json();
        setFloorPlan(data);
      }
    } catch (error) {
      console.error('Failed to fetch floor plan', error);
    }
  };

  const fetchAvailability = async () => {
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
  };

  const handleBooking = async () => {
    if (!selectedSeat) return;
    
    setSubmitting(true);
    setMessage('');
    
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookings: [{
            seatId: selectedSeat,
            bookingDate: date,
            slot
          }]
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setMessage('Booking successful!');
        setSelectedSeat(null);
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

  const isSeatAvailable = (seat: Seat) => {
    if (slot === 'FULL_DAY') return seat.availability.FULL_DAY;
    if (slot === 'AM') return seat.availability.AM;
    if (slot === 'PM') return seat.availability.PM;
    return false;
  };

  const placedSeats = seats.filter(s => s.x !== null && s.y !== null);
  const unplacedSeats = seats.filter(s => s.x === null || s.y === null);

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
            className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Time Slot</label>
          <select
            value={slot}
            onChange={(e) => setSlot(e.target.value as any)}
            className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="FULL_DAY">Full Day</option>
            <option value="AM">Morning (AM)</option>
            <option value="PM">Afternoon (PM)</option>
          </select>
        </div>
        <div className="flex items-end">
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
        <div className="text-center py-12">Loading availability...</div>
      ) : (
        <>
          {viewMode === 'map' && floorPlan ? (
            <div className="mb-8 overflow-auto border rounded-lg bg-gray-50 relative">
               <div className="relative min-w-[800px] min-h-[600px] inline-block">
                 <img
                  src={floorPlan.imageUrl}
                  alt="Floor Plan"
                  className="max-w-none"
                  style={{ display: 'block' }} 
                 />
                 
                 {placedSeats.map(seat => {
                   const available = isSeatAvailable(seat);
                   const isSelected = selectedSeat === seat.id;
                   
                   return (
                     <button
                       key={seat.id}
                       onClick={() => available && setSelectedSeat(isSelected ? null : seat.id)}
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
                       title={`${seat.seatCode} (${seat.type}) - ${available ? 'Available' : 'Booked'}`}
                     >
                       {seat.seatCode}
                     </button>
                   );
                 })}
               </div>
               
               {/* Legend for Map */}
               <div className="absolute bottom-4 left-4 bg-white/90 p-3 rounded-lg shadow-md text-xs space-y-2 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-100 border border-green-500"></div>
                    <span>Solo Desk (Available)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-100 border border-blue-500"></div>
                    <span>Team Desk (Available)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-200 border border-gray-400"></div>
                    <span>Booked / Unavailable</span>
                  </div>
                   <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-600 border border-blue-800"></div>
                    <span>Selected</span>
                  </div>
               </div>
            </div>
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
                {(viewMode === 'list' ? seats : unplacedSeats).map((seat) => {
                  const available = isSeatAvailable(seat);
                  return (
                    <button
                      key={seat.id}
                      onClick={() => available && setSelectedSeat(selectedSeat === seat.id ? null : seat.id)}
                      disabled={!available}
                      className={`flex flex-col items-center justify-center rounded-lg border p-4 text-center transition-colors ${
                        selectedSeat === seat.id
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
        <div className="text-sm text-gray-500">
          {selectedSeat ? (
            <span>
              Selected: <span className="font-bold text-gray-900">{seats.find(s => s.id === selectedSeat)?.seatCode}</span>
            </span>
          ) : (
            'Select a seat to continue'
          )}
        </div>
        <button
          onClick={handleBooking}
          disabled={!selectedSeat || submitting}
          className="rounded-md bg-blue-600 px-6 py-2 text-white shadow-sm hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {submitting ? 'Booking...' : 'Confirm Booking'}
        </button>
      </div>
    </div>
  );
}
