
import { prisma } from './db';

/**
 * Sends a notification to a user about a booking cancellation.
 * 
 * @param booking The booking that is affected
 * @param reason The reason for the seat block
 */
export async function sendBookingCancellationNotification(booking: any, reason: string) {
  // TODO: Integrate with a real email service provider (e.g., SendGrid, AWS SES, Nodemailer)
  // For now, we will log the notification to the console.
  
  const user = booking.user;
  const seat = booking.seat;
  const bookingDate = new Date(booking.bookingDate).toLocaleDateString();

  console.log(`
    [NOTIFICATION]
    To: ${user.email} (${user.name})
    Subject: Urgent: Your desk booking for ${bookingDate} has been affected
    
    Message:
    Hi ${user.name},
    
    Your booking for seat ${seat.seatCode} on ${bookingDate} is affected because the seat has been blocked by an administrator.
    
    Reason: ${reason}
    
    Please log in to the portal to cancel your current booking and select a new seat.
    
    Regards,
    HotAssDesk Admin
  `);
}
