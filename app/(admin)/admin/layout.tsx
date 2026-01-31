import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminNavbar from '@/components/admin/AdminNavbar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  if (!session.user.isActive) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNavbar user={session.user} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
