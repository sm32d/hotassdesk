'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Modal from '../ui/Modal';

interface Seat {
  id: string;
  seatCode: string;
  type: 'SOLO' | 'TEAM_CLUSTER';
  x: number | null;
  y: number | null;
  hasUpcomingBookings?: boolean;
  isBlocked: boolean;
  blockedReason?: string | null;
}

interface FloorPlan {
  id: string;
  imageUrl: string;
  defaultZoom: number;
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSeatPosition, setNewSeatPosition] = useState<{ x: number; y: number } | null>(null);
  const [newSeatData, setNewSeatData] = useState({ seatCode: '', type: 'SOLO' as const });
  const [showInstructions, setShowInstructions] = useState(true);
  const [zoom, setZoom] = useState(activeFloorPlan?.defaultZoom || 1);
  const [imgDimensions, setImgDimensions] = useState<{ width: number; height: number } | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Modal States
  const [deleteSeatId, setDeleteSeatId] = useState<string | null>(null);
  const [blockSeatId, setBlockSeatId] = useState<string | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [alertState, setAlertState] = useState<{ isOpen: boolean; title: string; message: string }>({
    isOpen: false,
    title: '',
    message: ''
  });

  useEffect(() => {
    if (activeFloorPlan) {
      setFloorPlan(activeFloorPlan);
    }
  }, [activeFloorPlan]);

  useEffect(() => {
    // Only update zoom when defaultZoom changes (e.g. initial load or "Set Def")
    // We do NOT reset imgDimensions here to avoid race conditions with onLoad
    if (floorPlan?.defaultZoom) {
      setZoom(floorPlan.defaultZoom);
    }
  }, [floorPlan?.defaultZoom]);

  const showAlert = (title: string, message: string) => {
    setAlertState({ isOpen: true, title, message });
  };

  const closeAlert = () => {
    setAlertState(prev => ({ ...prev, isOpen: false }));
  };

  // Filter and sort seats
  const sortSeats = (a: Seat, b: Seat) => 
    a.seatCode.localeCompare(b.seatCode, undefined, { numeric: true, sensitivity: 'base' });

  const placedSeats = seats
    .filter(s => s.x !== null && s.y !== null)
    .sort(sortSeats);
    
  const unplacedSeats = seats
    .filter(s => s.x === null || s.y === null)
    .sort(sortSeats);

  const generateSeatCode = () => {
    // Simple heuristic: find max number in "S-X" or just "X" and increment
    let maxNum = 0;
    seats.forEach(s => {
      const match = s.seatCode.match(/(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    return `S-${maxNum + 1}`;
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (selectedSeatId) {
      // Update existing seat position
      setSeats(prev => prev.map(seat => 
        seat.id === selectedSeatId 
          ? { ...seat, x, y } 
          : seat
      ));
      setSelectedSeatId(null);
    } else {
      // Start creation flow
      setNewSeatPosition({ x, y });
      setNewSeatData({ seatCode: generateSeatCode(), type: 'SOLO' });
      setShowCreateModal(true);
    }
  };

  const handleCreateSeat = async () => {
    if (!newSeatPosition) return;
    
    try {
      const res = await fetch('/api/seats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seatCode: newSeatData.seatCode,
          type: newSeatData.type,
          x: newSeatPosition.x,
          y: newSeatPosition.y,
          isBlocked: false
        })
      });

      if (!res.ok) throw new Error('Failed to create seat');
      
      const createdSeat = await res.json();
      setSeats(prev => [...prev, createdSeat]);
      setShowCreateModal(false);
      setNewSeatPosition(null);
    } catch (error) {
      showAlert('Error', 'Error creating seat');
    }
  };

  const confirmDeleteSeat = (id: string) => {
    setDeleteSeatId(id);
  };

  const executeDeleteSeat = async () => {
    if (!deleteSeatId) return;
    
    try {
      const res = await fetch(`/api/seats/${deleteSeatId}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete seat');
      }
      
      setSeats(prev => prev.filter(s => s.id !== deleteSeatId));
      if (selectedSeatId === deleteSeatId) setSelectedSeatId(null);
      setDeleteSeatId(null);
    } catch (error: any) {
      showAlert('Error', error.message);
    }
  };

  const confirmBlockSeat = (seat: Seat) => {
    setBlockSeatId(seat.id);
    setBlockReason(seat.blockedReason || '');
  };

  const executeBlockSeat = async () => {
    if (!blockSeatId) return;

    try {
      const res = await fetch(`/api/seats/${blockSeatId}/block`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBlocked: true, blockedReason: blockReason })
      });

      if (!res.ok) throw new Error('Failed to block seat');

      setSeats(prev => prev.map(s => 
        s.id === blockSeatId 
          ? { ...s, isBlocked: true, blockedReason: blockReason } 
          : s
      ));
      setBlockSeatId(null);
      setBlockReason('');
    } catch (error) {
      showAlert('Error', 'Error blocking seat');
    }
  };

  const executeUnblockSeat = async (seatId: string) => {
    try {
      const res = await fetch(`/api/seats/${seatId}/block`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBlocked: false, blockedReason: null })
      });

      if (!res.ok) throw new Error('Failed to unblock seat');

      setSeats(prev => prev.map(s => 
        s.id === seatId 
          ? { ...s, isBlocked: false, blockedReason: null } 
          : s
      ));
    } catch (error) {
      showAlert('Error', 'Error unblocking seat');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    // Validate: Force placement of seats with upcoming bookings
    const unplacedBookedSeats = unplacedSeats.filter(s => s.hasUpcomingBookings);
    if (unplacedBookedSeats.length > 0) {
      showAlert('Cannot Save', `The following seats have upcoming bookings and must be placed on the map: ${unplacedBookedSeats.map(s => s.seatCode).join(', ')}`);
      setIsSaving(false);
      return;
    }

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
      showAlert('Success', 'Floor plan layout saved successfully!');
    } catch (error) {
      showAlert('Error', 'Error saving layout');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    
    if (floorPlan) {
      setPendingFile(file);
      // Reset input value to allow re-selection if cancelled
      e.target.value = ''; 
    } else {
      executeFileUpload(file);
    }
  };

  const executeFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('resetSeats', 'true');

    try {
      const res = await fetch('/api/floorplans', {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) throw new Error('Upload failed');
      
      const newPlan = await res.json();
      setFloorPlan(newPlan);
      setImgDimensions(null); // Reset dimensions for new image
      // Reset local seat positions to match server-side reset
      setSeats(prev => prev.map(s => ({ ...s, x: null, y: null })));
      setPendingFile(null);
    } catch (error) {
      showAlert('Error', 'Error uploading floor plan');
    }
  };

  const handleSetDefaultZoom = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!floorPlan) return;
    
    try {
      const res = await fetch('/api/floorplans/active', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defaultZoom: zoom })
      });

      if (!res.ok) throw new Error('Failed to update default zoom');
      
      const updated = await res.json();
      setFloorPlan(prev => prev ? { ...prev, defaultZoom: updated.defaultZoom } : null);
      showAlert('Success', `Default zoom set to ${Math.round(zoom * 100)}%`);
    } catch (error) {
      showAlert('Error', 'Failed to set default zoom');
    }
  };

  const handleUnassign = (id: string) => {
    setSeats(prev => prev.map(seat => 
      seat.id === id 
        ? { ...seat, x: null, y: null } 
        : seat
    ));
  };

  const isZoomChanged = floorPlan ? Math.abs(zoom - floorPlan.defaultZoom) > 0.001 : false;

  return (
    <div className="flex h-full gap-6">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 flex flex-col bg-white border rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="font-semibold text-gray-900">Seats</h2>
          <div className="text-xs text-gray-500 mt-1">
            {unplacedSeats.length} unplaced, {placedSeats.length} placed
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          {/* Unplaced Seats */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">Unplaced ({unplacedSeats.length})</h3>
            <div className="space-y-2">
              {unplacedSeats.map(seat => (
                <div
                  key={seat.id}
                  className={`flex items-center justify-between p-3 rounded-md text-sm border transition-colors ${
                    selectedSeatId === seat.id
                      ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500'
                      : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedSeatId(seat.id)}
                >
                  <div className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-gray-900">{seat.seatCode}</div>
                      {seat.hasUpcomingBookings && (
                        <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-medium border border-amber-200">
                          Booked
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">{seat.type}</div>
                    {seat.isBlocked && (
                      <div className="text-xs text-red-600 font-medium">Blocked: {seat.blockedReason}</div>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (seat.isBlocked) {
                        executeUnblockSeat(seat.id);
                      } else {
                        confirmBlockSeat(seat);
                      }
                    }}
                    className={`ml-2 p-1 rounded ${seat.isBlocked ? 'text-red-600 hover:text-red-800' : 'text-gray-400 hover:text-orange-600'}`}
                    title={seat.isBlocked ? "Unblock seat" : "Block seat"}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      confirmDeleteSeat(seat.id);
                    }}
                    className="ml-2 p-1 text-gray-400 hover:text-red-600 rounded"
                    title="Delete seat"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
              {unplacedSeats.length === 0 && (
                <div className="text-center py-4 text-gray-400 text-xs italic">
                  No unplaced seats
                </div>
              )}
            </div>
          </div>

          {/* Placed Seats */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">Placed ({placedSeats.length})</h3>
            <div className="space-y-2">
              {placedSeats.map(seat => (
                <div
                  key={seat.id}
                  className={`flex items-center justify-between p-3 rounded-md text-sm border transition-colors ${
                    selectedSeatId === seat.id
                      ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500'
                      : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedSeatId(seat.id)}
                >
                  <div className="flex-1 cursor-pointer">
                    <div className="font-medium text-gray-900">{seat.seatCode}</div>
                    <div className="text-xs text-gray-500">{seat.type}</div>
                    {seat.isBlocked && (
                      <div className="text-xs text-red-600 font-medium">Blocked</div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                      e.stopPropagation();
                      if (seat.isBlocked) {
                        executeUnblockSeat(seat.id);
                      } else {
                        confirmBlockSeat(seat);
                      }
                    }}
                    className={`p-1 rounded ${seat.isBlocked ? 'text-red-600 hover:text-red-800' : 'text-gray-400 hover:text-orange-600'}`}
                    title={seat.isBlocked ? "Unblock seat" : "Block seat"}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnassign(seat.id);
                      }}
                      className="p-1 text-gray-400 hover:text-orange-600 rounded"
                      title="Unassign from map"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmDeleteSeat(seat.id);
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 rounded"
                      title="Delete seat"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
              {placedSeats.length === 0 && (
                <div className="text-center py-4 text-gray-400 text-xs italic">
                  No placed seats
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t bg-gray-50 space-y-2">
           {floorPlan && (
             <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  title="Update Floor Plan Image"
                />
                <button className="w-full py-2 px-4 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md font-medium text-sm">
                  Update Floor Plan
                </button>
             </div>
           )}
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
      <div className="flex-1 bg-white border rounded-lg shadow-sm overflow-hidden flex flex-col relative">
        {/* Instructions Card */}
        {showInstructions && (
          <div className="absolute top-4 left-4 z-20 bg-white/90 backdrop-blur shadow-lg rounded-lg border border-gray-200 p-4 max-w-sm">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-gray-900">How to Manage Seats</h3>
              <button 
                onClick={() => setShowInstructions(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
              <li><strong>Create Seat:</strong> Click anywhere on the map to add a new seat.</li>
              <li><strong>Move Seat:</strong> Click an existing seat to select it, then click a new location.</li>
              <li><strong>Delete Seat:</strong> Use the trash icon in the sidebar list.</li>
              <li><strong>Unassign:</strong> Use the remove icon in the sidebar to take a seat off the map without deleting it.</li>
            </ul>
          </div>
        )}

        {/* Creation Modal */}
        {showCreateModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-lg shadow-xl w-80 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Seat</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Seat Code</label>
                  <input
                    type="text"
                    value={newSeatData.seatCode}
                    onChange={e => setNewSeatData({ ...newSeatData, seatCode: e.target.value })}
                    className="text-gray-700 w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={newSeatData.type}
                    onChange={e => setNewSeatData({ ...newSeatData, type: e.target.value as any })}
                    className="text-gray-700 w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="SOLO">Solo Desk</option>
                    <option value="TEAM_CLUSTER">Team Cluster</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewSeatPosition(null);
                    }}
                    className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateSeat}
                    disabled={!newSeatData.seatCode}
                    className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    Create Seat
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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
             {/* Zoom Controls */}
             <div className="sticky top-4 left-4 z-10 inline-flex flex-col gap-2 bg-white/90 backdrop-blur shadow-sm border border-gray-200 p-1 rounded-md">
               <button 
                 onClick={(e) => { e.stopPropagation(); setZoom(z => Math.min(3, z + 0.1)); }}
                 className="p-1 hover:bg-gray-100 rounded text-gray-700"
                 title="Zoom In"
               >
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                 </svg>
               </button>
               <button 
                 onClick={(e) => { e.stopPropagation(); setZoom(z => Math.max(0.2, z - 0.1)); }}
                 className="p-1 hover:bg-gray-100 rounded text-gray-700"
                 title="Zoom Out"
               >
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                   </svg>
               </button>
               <div className="text-xs font-medium text-gray-600 text-center py-1 border-t border-gray-100">
                {Math.round(zoom * 100)}%
              </div>
              {isZoomChanged && (
                <button
                  onClick={handleSetDefaultZoom}
                  className="p-1 hover:bg-blue-50 rounded text-blue-600 border-t border-gray-100 text-xs font-medium"
                  title="Set as Default Zoom"
                >
                  Set Def
                </button>
              )}
            </div>

             <div className="relative inline-block" onClick={handleImageClick}>
               <img
                ref={imageRef}
                src={floorPlan.imageUrl}
                alt="Floor Plan"
                className="max-w-none cursor-crosshair transition-all duration-200 ease-in-out"
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
               
               {/* Render Placed Seats */}
               {placedSeats.map(seat => (
                 <div
                   key={seat.id}
                   className={`absolute w-8 h-8 -ml-4 -mt-4 flex items-center justify-center rounded-full text-xs font-bold shadow-md cursor-pointer border-2 transition-transform hover:scale-110 ${
                     seat.isBlocked 
                       ? 'bg-gray-200 border-gray-500 text-gray-500'
                       : seat.type === 'SOLO' 
                         ? 'bg-green-100 border-green-500 text-green-800' 
                         : 'bg-blue-100 border-blue-500 text-blue-800'
                   }`}
                   style={{ left: `${seat.x}%`, top: `${seat.y}%` }}
                   onClick={(e) => {
                     e.stopPropagation();
                     setSelectedSeatId(seat.id);
                   }}
                   title={`${seat.seatCode} (${seat.type}) ${seat.isBlocked ? `- Blocked: ${seat.blockedReason}` : '- Click to select'}`}
                 >
                   {seat.isBlocked ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                   ) : (
                     seat.seatCode
                   )}
                 </div>
               ))}
               
               {/* Selection Indicator Cursor */}
               {selectedSeatId && (
                  <div className="absolute top-4 right-4 bg-black/75 text-white px-4 py-2 rounded-full text-sm font-medium pointer-events-none z-10">
                    {seats.find(s => s.id === selectedSeatId)?.x !== null 
                      ? `Click map to move ${seats.find(s => s.id === selectedSeatId)?.seatCode}`
                      : `Click map to place ${seats.find(s => s.id === selectedSeatId)?.seatCode}`
                    }
                  </div>
               )}
             </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Seat"
        footer={
          <>
            <button
              onClick={handleCreateSeat}
              className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:w-auto"
            >
              Create Seat
            </button>
            <button
              onClick={() => setShowCreateModal(false)}
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
            >
              Cancel
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="seatCode" className="block text-sm font-medium text-gray-700">Seat Code</label>
            <input
              type="text"
              id="seatCode"
              value={newSeatData.seatCode}
              onChange={(e) => setNewSeatData({ ...newSeatData, seatCode: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
              placeholder="e.g. S-1"
            />
          </div>
          <div>
            <label htmlFor="seatType" className="block text-sm font-medium text-gray-700">Type</label>
            <select
              id="seatType"
              value={newSeatData.type}
              onChange={(e) => setNewSeatData({ ...newSeatData, type: e.target.value as any })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
            >
              <option value="SOLO">Solo Desk</option>
              <option value="TEAM_CLUSTER">Team Cluster</option>
            </select>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!blockSeatId}
        onClose={() => {
          setBlockSeatId(null);
          setBlockReason('');
        }}
        title="Block Seat"
        footer={
          <>
            <button
              onClick={executeBlockSeat}
              disabled={!blockReason.trim()}
              className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50 sm:w-auto"
            >
              Block Seat
            </button>
            <button
              onClick={() => {
                setBlockSeatId(null);
                setBlockReason('');
              }}
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
            >
              Cancel
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Blocking this seat will make it unavailable for booking. Please provide a reason.
          </p>
          <div>
            <label htmlFor="blockReason" className="block text-sm font-medium text-gray-700">Reason</label>
            <textarea
              id="blockReason"
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
              placeholder="e.g. Broken chair, Reserved for maintenance"
              rows={3}
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!deleteSeatId}
        onClose={() => setDeleteSeatId(null)}
        title="Delete Seat"
        footer={
          <>
            <button
              onClick={executeDeleteSeat}
              className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:w-auto"
            >
              Delete
            </button>
            <button
              onClick={() => setDeleteSeatId(null)}
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
            >
              Cancel
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-500">
          Are you sure you want to delete this seat? This action cannot be undone.
        </p>
      </Modal>

      <Modal
        isOpen={!!pendingFile}
        onClose={() => setPendingFile(null)}
        title="Update Floor Plan?"
        footer={
          <>
            <button
              onClick={() => pendingFile && executeFileUpload(pendingFile)}
              className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:w-auto"
            >
              Update & Reset Seats
            </button>
            <button
              onClick={() => setPendingFile(null)}
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
            >
              Cancel
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-500">
          Uploading a new floor plan will reset all seat positions. Are you sure you want to continue?
        </p>
      </Modal>

      <Modal
        isOpen={alertState.isOpen}
        onClose={closeAlert}
        title={alertState.title}
        footer={
          <button
            onClick={closeAlert}
            className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:w-auto"
          >
            OK
          </button>
        }
      >
        <p className="text-sm text-gray-500">
          {alertState.message}
        </p>
      </Modal>
    </div>
  );
}
