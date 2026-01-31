import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type BookingDisplayStatus = 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export function getBookingDisplayStatus(
  status: 'ACTIVE' | 'CANCELLED',
  bookingDate: string | Date
): BookingDisplayStatus {
  if (status === 'CANCELLED') {
    return 'CANCELLED';
  }

  const date = new Date(bookingDate);
  const now = new Date();
  
  // Reset time part to compare dates only
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const bookingDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (bookingDay < today) {
    return 'COMPLETED';
  }

  return 'CONFIRMED';
}

export function getBookingStatusColor(status: BookingDisplayStatus): string {
  switch (status) {
    case 'CONFIRMED':
      return 'bg-green-100 text-green-800';
    case 'COMPLETED':
      return 'bg-gray-100 text-gray-800';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
