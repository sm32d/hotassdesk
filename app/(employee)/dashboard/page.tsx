import { auth } from '@/lib/auth';
import Link from 'next/link';

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {session?.user?.name}
        </h1>
        <p className="mt-2 text-gray-600">
          Manage your desk bookings and view office availability.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Quick Action Card */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-medium text-gray-900">Quick Book</h2>
          <p className="mt-2 text-sm text-gray-500">
            Need a desk for today or tomorrow?
          </p>
          <div className="mt-4">
            <Link
              href="/book"
              className="inline-flex w-full justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
            >
              Book Now
            </Link>
          </div>
        </div>

        {/* Stats Card */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-medium text-gray-900">Upcoming Bookings</h2>
          <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
          <p className="text-sm text-gray-500">bookings this week</p>
          <div className="mt-4">
            <Link
              href="/my-bookings"
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              View all bookings &rarr;
            </Link>
          </div>
        </div>

        {/* Floor Plan Card */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-medium text-gray-900">Office Map</h2>
          <p className="mt-2 text-sm text-gray-500">
            View the current floor plan and seat locations.
          </p>
          <div className="mt-4">
            <Link
              href="/floor-plan"
              className="inline-flex w-full justify-center rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              View Map
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
