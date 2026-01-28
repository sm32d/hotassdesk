'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

interface Seat {
  id: string;
  seatCode: string;
  type: 'SOLO' | 'TEAM_CLUSTER';
  x: number | null;
  y: number | null;
}

interface FloorPlan {
  id: string;
  imageUrl: string;
}

interface FloorPlanEditorProps {
  initialSeats: Seat[];
  activeFloorPlan: FloorPlan | null;
}

export default function FloorPlanEditor({ initialSeats, activeFloorPlan }: FloorPlanEditorProps) {
  const [seats, setSeats] = useState<Seat[]>(initialSeats);
  const [floorPlan, setFloorPlan] = useState<FloorPlan | null>(activeFloorPlan);
  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  // Filter seats
  const placedSeats = seats.filter(s => s.x !== null && s.y !== null);
  const unplacedSeats = seats.filter(s => s.x === null || s.y === null);

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedSeatId || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Update seat position
    setSeats(prev => prev.map(seat => 
      seat.id === selectedSeatId 
        ? { ...seat, x, y } 
        : seat
    ));
    
    // Auto-select next unplaced seat? Maybe not, could be annoying.
    setSelectedSeatId(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updates = seats
        .filter(s => s.x !== null && s.y !== null)
        .map(({ id, x, y }) => ({ id, x, y }));

      const res = await fetch('/api/seats/batch-update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });

      if (!res.ok) throw new Error('Failed to save');
      alert('Floor plan layout saved successfully!');
    } catch (error) {
      alert('Error saving layout');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    
    const formData = new FormData();
    formData.append('file', e.target.files[0]);

    try {
      const res = await fetch('/api/floorplans', {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) throw new Error('Upload failed');
      
      const newPlan = await res.json();
      setFloorPlan(newPlan);
    } catch (error) {
      alert('Error uploading floor plan');
    }
  };

  const handleUnassign = (id: string) => {
    setSeats(prev => prev.map(seat => 
      seat.id === id 
        ? { ...seat, x: null, y: null } 
        : seat
    ));
  };

  return (
    <div className="flex h-[calc(100vh-100px)] gap-6">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 flex flex-col bg-white border rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="font-semibold text-gray-900">Seats</h2>
          <div className="text-xs text-gray-500 mt-1">
            {unplacedSeats.length} unplaced, {placedSeats.length} placed
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {unplacedSeats.map(seat => (
            <div
              key={seat.id}
              onClick={() => setSelectedSeatId(seat.id)}
              className={`p-3 rounded-md cursor-pointer text-sm border transition-colors ${
                selectedSeatId === seat.id
                  ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500'
                  : 'bg-gray-50 border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium">{seat.seatCode}</div>
              <div className="text-xs text-gray-500">{seat.type}</div>
            </div>
          ))}
          
          {unplacedSeats.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
              All seats placed!
            </div>
          )}
        </div>
        
        <div className="p-4 border-t bg-gray-50">
           <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Layout'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-white border rounded-lg shadow-sm overflow-hidden flex flex-col">
        {!floorPlan ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="max-w-md w-full p-6 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Floor Plan Uploaded</h3>
              <p className="text-gray-500 mb-4">Upload a floor plan image to start mapping seats.</p>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="block w-full text-sm text-slate-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
            </div>
          </div>
        ) : (
          <div className="relative flex-1 bg-gray-100 overflow-auto">
             <div className="relative min-w-[800px] min-h-[600px] inline-block" onClick={handleImageClick}>
               <img
                ref={imageRef}
                src={floorPlan.imageUrl}
                alt="Floor Plan"
                className="max-w-none cursor-crosshair"
                style={{ display: 'block' }} // Ensure no extra space
               />
               
               {/* Render Placed Seats */}
               {placedSeats.map(seat => (
                 <div
                   key={seat.id}
                   className={`absolute w-8 h-8 -ml-4 -mt-4 flex items-center justify-center rounded-full text-xs font-bold shadow-md cursor-pointer border-2 transition-transform hover:scale-110 ${
                     seat.type === 'SOLO' ? 'bg-green-100 border-green-500 text-green-800' : 'bg-blue-100 border-blue-500 text-blue-800'
                   }`}
                   style={{ left: `${seat.x}%`, top: `${seat.y}%` }}
                   onClick={(e) => {
                     e.stopPropagation();
                     if (confirm(`Unassign seat ${seat.seatCode}?`)) {
                       handleUnassign(seat.id);
                     }
                   }}
                   title={`${seat.seatCode} (${seat.type})`}
                 >
                   {seat.seatCode}
                 </div>
               ))}
               
               {/* Selection Indicator Cursor */}
               {selectedSeatId && (
                  <div className="absolute top-4 right-4 bg-black/75 text-white px-4 py-2 rounded-full text-sm font-medium pointer-events-none">
                    Click map to place {seats.find(s => s.id === selectedSeatId)?.seatCode}
                  </div>
               )}
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
