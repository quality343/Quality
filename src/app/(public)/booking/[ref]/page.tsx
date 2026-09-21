import Link from "next/link";
import { Container, PageHeader } from "@/components/ui";
import { getGuestBookingByRefAndToken } from "@/server/services/scheduling";
import { ManageBooking } from "./ManageBooking";
import { cancelBooking } from "../../book-appointment/actions";

export const metadata = {
  title: "Your booking",
  robots: { index: false },
};

type Params = Promise<{ ref: string }>;
type Search = Promise<{ token?: string }>;

const STATUS_LABEL: Record<string, string> = {
  BOOKED: "Booked",
  CHECKED_IN: "Checked in",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_SHOW: "No show",
};

/**
 * Guest booking management. Requires BOTH the booking reference and the
 * private manage token — knowing only the reference shows nothing. Token is
 * verified against the stored SHA-256 hash server-side.
 */
export default async function ManageBookingPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Search;
}) {
  const { ref } = await params;
  const { token } = await searchParams;
  const booking = token
    ? await getGuestBookingByRefAndToken(ref.toUpperCase(), token)
    : null;

  if (!booking) {
    return (
      <Container className="py-12">
        <PageHeader
          eyebrow="Appointments"
          title="Booking link not valid"
          description="This link doesn't match any booking. Check the link from your confirmation, or use the booking lookup with your appointment number and mobile number."
        />
        <div className="mt-6">
          <Link
            href="/booking-lookup"
            className="text-brand-700 underline hover:text-brand-800"
          >
            Go to booking lookup →
          </Link>
        </div>
      </Container>
    );
  }

  const when = booking.slot
    ? new Intl.DateTimeFormat("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      }).format(booking.slot.startsAt)
    : null;
  const time = booking.slot
    ? new Intl.DateTimeFormat("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata",
      }).format(booking.slot.startsAt)
    : null;

  const statusKey = String(booking.status);
  const cancellable =
    statusKey === "BOOKED" &&
    !!booking.slot &&
    booking.slot.startsAt > new Date();

  return (
    <Container className="py-12">
      <PageHeader
        eyebrow="Your appointment"
        title={STATUS_LABEL[statusKey] ?? statusKey}
        description={`Appointment ${booking.bookingRef} at QUALITY Hearing Care.`}
      />

      <div className="mx-auto max-w-xl">
        <dl className="rounded-xl border border-border bg-surface p-5 text-sm">
          <div className="flex justify-between gap-4 py-1.5">
            <dt className="text-ink-500">Service</dt>
            <dd className="text-right font-medium text-ink-900">{booking.service.name}</dd>
          </div>
          <div className="flex justify-between gap-4 py-1.5">
            <dt className="text-ink-500">Branch</dt>
            <dd className="text-right font-medium text-ink-900">
              {booking.branch.name}
              {booking.branch.city ? `, ${booking.branch.city}` : ""}
            </dd>
          </div>
          <div className="flex justify-between gap-4 py-1.5">
            <dt className="text-ink-500">Date</dt>
            <dd className="text-right font-medium text-ink-900">{when}</dd>
          </div>
          <div className="flex justify-between gap-4 py-1.5">
            <dt className="text-ink-500">Time</dt>
            <dd className="text-right font-medium text-ink-900">{time} (IST)</dd>
          </div>
          <div className="flex justify-between gap-4 py-1.5">
            <dt className="text-ink-500">Name</dt>
            <dd className="text-right font-medium text-ink-900">
              {booking.patient.name ?? "Guest"}
            </dd>
          </div>
          {booking.branch.phone && (
            <div className="flex justify-between gap-4 py-1.5">
              <dt className="text-ink-500">Clinic phone</dt>
              <dd className="text-right font-medium text-ink-900">{booking.branch.phone}</dd>
            </div>
          )}
        </dl>

        {cancellable ? (
          <ManageBooking
            ref_={booking.bookingRef ?? ref.toUpperCase()}
            token={token ?? ""}
            cancelAction={cancelBooking}
          />
        ) : (
          <p className="mt-5 rounded-lg border border-border bg-brand-50/50 p-4 text-sm text-ink-600">
            {statusKey === "BOOKED"
              ? "Online cancellation has closed for this appointment time. Please call the clinic to make changes."
              : "This appointment can no longer be changed online. Contact the clinic for any questions."}
          </p>
        )}

        <p className="mt-6 text-sm">
          <Link href="/" className="text-brand-700 underline hover:text-brand-800">
            Return home
          </Link>
        </p>
      </div>
    </Container>
  );
}
