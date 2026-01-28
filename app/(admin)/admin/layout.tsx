import { auth } from '@/lib/auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-slate-800 text-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <span className="text-xl font-bold">HotAssDesk Admin</span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link href="/admin" className="inline-flex items-center px-1 pt-1 text-sm font-medium hover:text-gray-300">
                  Dashboard
                </Link>
                <Link href="/admin/floor-plan" className="inline-flex items-center px-1 pt-1 text-sm font-medium hover:text-gray-300">
                  Floor Plan
                </Link>
                <Link href="/dashboard" className="inline-flex items-center px-1 pt-1 text-sm font-medium hover:text-gray-300">
                  Employee View
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-sm mr-4">{session.user.email}</span>
            </div>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
