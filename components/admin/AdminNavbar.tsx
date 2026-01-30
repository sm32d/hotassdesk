'use client';

import { useState } from 'react';
import Link from 'next/link';
import { handleSignOut } from '@/app/actions/auth';

type AdminNavbarProps = {
  user: {
    name?: string | null;
    email?: string | null;
  };
};

export default function AdminNavbar({ user }: AdminNavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-slate-800 text-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 lg:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              <Link href="/admin" className="text-xl font-bold">HotDesk Admin</Link>
            </div>
            {/* Desktop Menu */}
            <div className="hidden lg:ml-6 lg:flex lg:space-x-8">
              <Link href="/admin" className="inline-flex items-center px-1 pt-1 text-sm font-medium hover:text-gray-300">
                Dashboard
              </Link>
              <Link href="/admin/floor-plan" className="inline-flex items-center px-1 pt-1 text-sm font-medium hover:text-gray-300">
                Floor Plan
              </Link>
              <Link href="/admin/bookings" className="inline-flex items-center px-1 pt-1 text-sm font-medium hover:text-gray-300">
                Bookings
              </Link>
              <Link href="/admin/users" className="inline-flex items-center px-1 pt-1 text-sm font-medium hover:text-gray-300">
                Users
              </Link>
              <Link href="/dashboard" className="inline-flex items-center px-1 pt-1 text-sm font-medium hover:text-gray-300">
                Employee View
              </Link>
            </div>
          </div>
          
          <div className="flex items-center">
            {/* Mobile menu button */}
            <div className="flex items-center lg:hidden">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                aria-controls="mobile-menu"
                aria-expanded={isMobileMenuOpen}
              >
                <span className="sr-only">Open main menu</span>
                {/* Icon when menu is closed */}
                {!isMobileMenuOpen ? (
                  <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                  </svg>
                ) : (
                  /* Icon when menu is open */
                  <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            </div>
            
            <div className="hidden lg:flex lg:items-center">
              <span className="text-sm mr-4">{user.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      {isMobileMenuOpen && (
        <div className="lg:hidden" id="mobile-menu">
          <div className="space-y-1 px-2 pb-3 pt-2">
            <Link 
              href="/admin" 
              className="block rounded-md px-3 py-2 text-base font-medium text-white hover:bg-gray-700 hover:text-white"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link 
              href="/admin/floor-plan" 
              className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Floor Plan
            </Link>
            <Link 
              href="/admin/bookings" 
              className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Bookings
            </Link>
            <Link 
              href="/admin/users" 
              className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Users
            </Link>
            <Link 
              href="/dashboard" 
              className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Employee View
            </Link>
          </div>
          <div className="border-t border-gray-700 pb-3 pt-4">
            <div className="flex items-center px-5">
              <div className="ml-3">
                <div className="text-base font-medium leading-none text-white">{user.name}</div>
                <div className="text-sm font-medium leading-none text-gray-400 mt-1">{user.email}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
