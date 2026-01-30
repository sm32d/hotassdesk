'use client';

import { useState } from 'react';
import Link from 'next/link';
import { handleSignOut } from '@/app/actions/auth';

type EmployeeNavbarProps = {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
  };
};

export default function EmployeeNavbar({ user }: EmployeeNavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              <Link href="/" className="text-xl font-bold text-blue-600">HotDesk</Link>
            </div>
            {/* Desktop Menu */}
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              <Link
                href="/dashboard"
                className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
              >
                Dashboard
              </Link>
              <Link
                href="/book"
                className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
              >
                Book a Desk
              </Link>
              <Link
                href="/my-bookings"
                className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
              >
                My Bookings
              </Link>
              {user.role === 'ADMIN' && (
                <Link
                  href="/admin"
                  className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-purple-600 hover:border-purple-300 hover:text-purple-800"
                >
                  Admin Portal
                </Link>
              )}
            </div>
          </div>
          
          <div className="flex items-center">
            {/* Mobile menu button */}
            <div className="flex items-center md:hidden">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
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

            <div className="hidden md:flex md:items-center">
              <span className="mr-4 text-sm text-gray-700">
                {user.name}
              </span>
              <button
                onClick={() => handleSignOut()}
                className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      {isMobileMenuOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="space-y-1 pb-3 pt-2">
            <Link
              href="/dashboard"
              className="block border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              href="/book"
              className="block border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Book a Desk
            </Link>
            <Link
              href="/my-bookings"
              className="block border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              My Bookings
            </Link>
            {user.role === 'ADMIN' && (
              <Link
                href="/admin"
                className="block border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium text-purple-600 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-800"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Admin Portal
              </Link>
            )}
          </div>
          <div className="border-t border-gray-200 pb-3 pt-4">
            <div className="flex items-center px-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
                  {user.name?.charAt(0) || 'U'}
                </div>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800">{user.name}</div>
                <div className="text-sm font-medium text-gray-500">{user.email}</div>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <button
                onClick={() => handleSignOut()}
                className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
