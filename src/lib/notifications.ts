/**
 * Notification transport abstraction.
 *
 * Phase scope: there is NO email/SMS provider configured, so nothing is sent
 * and nothing pretends to have been sent. Every public event is delivered
 * in-app (booking confirmation page, admin portal) — which is honest because
 * the visitor is looking at it.
 *
 * TO CONNECT A PROVIDER LATER: implement `sendEmail`/`sendSMS` with your
 * provider SDK (e.g. Resend, SES, Twilio, MSG91), keep the same event
 * signatures, and flip `EMAIL_ENABLED`/`SMS_ENABLED` via env vars. All call
 * sites already route through `notifyBookingEvent`, so no flow changes are
 * needed — only this file.
 */

export type BookingEvent =
  | "BOOKING_CONFIRMED"
  | "BOOKING_REMINDER"
  | "BOOKING_CANCELLED"
  | "BOOKING_RESCHEDULED"
  | "BOOKING_STATUS_CHANGED";

export type NotificationPayload = {
  event: BookingEvent;
  to: { email?: string | null; phone?: string | null; name: string };
  booking: {
    ref: string;
    serviceName: string;
    branchName: string;
    startsAt: Date;
  };
};

const EMAIL_ENABLED = process.env.NOTIFY_EMAIL === "true";
const SMS_ENABLED = process.env.NOTIFY_SMS === "true";

async function sendEmail(payload: NotificationPayload): Promise<boolean> {
  void payload;
  // Provider integration point (Phase: notifications). Intentionally a no-op
  // until a provider is configured — never fabricate a "sent" outcome.
  return false;
}

async function sendSMS(payload: NotificationPayload): Promise<boolean> {
  void payload;
  // Provider integration point (Phase: notifications). Intentionally a no-op.
  return false;
}

/**
 * Fan a booking event out to the configured transports. Returns which
 * channels actually dispatched — call sites surface only what really happened.
 */
export async function notifyBookingEvent(
  payload: NotificationPayload,
): Promise<{ email: boolean; sms: boolean }> {
  const results = { email: false, sms: false };
  if (EMAIL_ENABLED && payload.to.email) {
    try {
      results.email = await sendEmail(payload);
    } catch {
      results.email = false;
    }
  }
  if (SMS_ENABLED && payload.to.phone) {
    try {
      results.sms = await sendSMS(payload);
    } catch {
      results.sms = false;
    }
  }
  return results;
}
