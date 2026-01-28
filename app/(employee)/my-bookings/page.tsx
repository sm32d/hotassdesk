import MyBookingsList from '@/components/booking/MyBookingsList';

export default function MyBookingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
        <p className="mt-1 text-sm text-gray-500">
          View and manage your upcoming desk bookings.
        </p>
      </div>
      
      <MyBookingsList />
    </div>
  );
}
