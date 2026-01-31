import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import EmployeeNavbar from '@/components/employee/EmployeeNavbar';

export default async function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  if (!session.user.isActive) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <EmployeeNavbar user={session.user} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
