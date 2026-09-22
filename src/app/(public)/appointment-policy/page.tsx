import type { Metadata } from "next";
import { LegalList, LegalNote, LegalPage, type LegalSection } from "@/components/legal/LegalPage";
import { CLIENT } from "@/lib/client-info";

export const metadata: Metadata = {
  // `absolute` — matches the brief exactly, avoiding the root template's
  // second brand stamp.
  title: { absolute: "Appointment Policy | Quality Hearing Care" },
  description:
    "How booking, confirming, rescheduling and cancelling an appointment works at Quality Hearing Care, Kukatpally, Hyderabad — for clinic visits and home consultations.",
  alternates: { canonical: "/appointment-policy" },
};

/**
 * No cancellation fee, notice period, advance payment or service radius is
 * stated here — the clinic has not supplied those. Where an exact policy is
 * unknown, the reader is pointed to the clinic instead.
 */
const SECTIONS: LegalSection[] = [
  {
    id: "how-to-book",
    title: "How to Book",
    content: (
      <>
        <p>
          You can book online, or by calling the clinic. Booking online takes a
          few steps and does not need an account:
        </p>
        <LegalList
          items={[
            "Choose an appointment type — Clinic Visit or Home Consultation.",
            "Choose the service you are interested in (a hearing test, hearing-aid consultation, or another service the clinic offers).",
            "Choose an available date and time.",
            "Enter your details — name, mobile number, and email where asked. For a home consultation, also the address and locality for the visit.",
            "Check the summary and confirm.",
          ]}
        />
        <p>
          Once confirmed, you will see an appointment number on screen. Write it
          down or take a screenshot — it is the quickest way for us to find your
          booking when you contact us.
        </p>
      </>
    ),
  },
  {
    id: "clinic-visit-appointments",
    title: "Clinic Visit Appointments",
    content: (
      <>
        <p>
          A clinic visit takes place at our clinic at{" "}
          <a
            href={CLIENT.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open Quality Hearing Care location in Google Maps (opens in a new tab)"
            className="font-semibold text-brand-700 underline-offset-4 hover:underline"
          >
            {CLIENT.addressOneLine}
          </a>
          .
        </p>
        <p>
          Please allow a little extra time before your appointment to check in.
          If you have previous hearing reports, prescriptions or an existing
          hearing aid, bringing them helps the consultation.
        </p>
      </>
    ),
  },
  {
    id: "home-consultation-appointments",
    title: "Home Consultation Appointments",
    content: (
      <>
        <p>
          Home consultation is available. When you choose this option, tell us
          the address and locality where the visit is needed, and add any
          instructions that would help — for example parking, floor or lift
          access.
        </p>
        <p>
          Home visit requests are reviewed and confirmed by our team rather than
          being finalised automatically, because the visit depends on
          availability and on the location. After you submit a request, our team
          will contact you to confirm.
        </p>
        <p>
          Your address is used only to arrange and carry out the visit, and is
          visible only to the clinic team handling it.
        </p>
        <LegalNote>
          <p className="text-sm leading-relaxed text-ink-600">
            We do not publish a fixed service radius or promise same-day home
            visits. Please contact {CLIENT.name} to check whether a home visit
            can be arranged for your location and the earliest suitable time.
          </p>
        </LegalNote>
      </>
    ),
  },
  {
    id: "appointment-confirmation",
    title: "Appointment Confirmation",
    content: (
      <>
        <p>
          Your appointment time is held against your appointment number as soon
          as the booking is accepted by the website.
        </p>
        <p>
          Our team may call you to confirm details or to check something about
          your appointment. If we cannot reach you on the number you gave, or if
          a detail cannot be confirmed, we may need to reschedule.
        </p>
        <p>
          A booking confirmation is not a diagnosis and does not replace an
          assessment by a qualified professional at your appointment.
        </p>
      </>
    ),
  },
  {
    id: "arriving-for-appointments",
    title: "Arriving for Appointments",
    content: (
      <LegalList
        items={[
          "Please arrive a few minutes before your appointment time so the schedule stays on track for everyone.",
          "If you are delayed, call us so we can tell you whether the time can still be held.",
          "If you arrive much later than your time, we may need to offer you a later slot or another date.",
          "For a home visit, please make sure someone is available at the address at the confirmed time.",
        ]}
      />
    ),
  },
  {
    id: "rescheduling",
    title: "Rescheduling",
    content: (
      <>
        <p>
          If you need a different time, contact the clinic as early as you can
          and we will help you move the appointment, subject to availability.
        </p>
        <p>
          You can check the details of a booking you have made using our{" "}
          <a
            href="/booking-lookup"
            className="font-semibold text-brand-700 underline-offset-4 hover:underline"
          >
            booking lookup
          </a>{" "}
          page, using your appointment number and the contact details you booked
          with.
        </p>
        <LegalNote>
          <p className="text-sm leading-relaxed text-ink-600">
            Please contact {CLIENT.name} for the applicable appointment or
            cancellation details, including any notice period that applies.
          </p>
        </LegalNote>
      </>
    ),
  },
  {
    id: "cancellation",
    title: "Cancellation",
    content: (
      <>
        <p>
          If you no longer need your appointment, please let us know so the time
          can be offered to another patient. Call or email the clinic with your
          appointment number and we will cancel it for you.
        </p>
        <p>
          We may cancel or decline a booking where the details given are
          inaccurate, where the request cannot be safely accommodated, or where
          a booking appears to be automated or abusive.
        </p>
        <LegalNote>
          <p className="text-sm leading-relaxed text-ink-600">
            The clinic has not published a cancellation fee, refund policy or
            advance payment requirement for appointments booked through this
            website. Please contact the clinic for the applicable details before
            cancelling if you have any question about charges.
          </p>
        </LegalNote>
      </>
    ),
  },
  {
    id: "contacting-the-clinic",
    title: "Contacting the Clinic",
    content: (
      <>
        <p>
          For anything to do with an appointment, the fastest route is a phone
          call. Have your appointment number ready if you can.
        </p>
        <LegalList
          items={[
            <>
              Phone:{" "}
              <a
                href={CLIENT.phoneHref}
                aria-label="Call Quality Hearing Care"
                className="font-semibold text-brand-700 underline-offset-4 hover:underline"
              >
                {CLIENT.phone}
              </a>
            </>,
            <>
              Email:{" "}
              <a
                href={`mailto:${CLIENT.email}`}
                aria-label="Email Quality Hearing Care"
                className="font-semibold text-brand-700 underline-offset-4 hover:underline"
              >
                {CLIENT.email}
              </a>
            </>,
          ]}
        />
        <p>
          You can also send a message through our{" "}
          <a
            href="/contact"
            className="font-semibold text-brand-700 underline-offset-4 hover:underline"
          >
            contact page
          </a>{" "}
          and our team will get back to you.
        </p>
      </>
    ),
  },
  {
    id: "if-we-need-to-change-your-appointment",
    title: "If the Clinic Needs to Change an Appointment",
    content: (
      <>
        <p>
          Occasionally we have to change an appointment — for example if a
          clinician is unavailable, if equipment needs attention, if a home
          visit cannot be arranged for the location, or for reasons outside our
          control.
        </p>
        <p>
          If that happens, we will contact you on the number you provided to
          explain and to offer the nearest suitable alternative time. You are
          under no obligation to accept an alternative that does not work for
          you.
        </p>
      </>
    ),
  },
];

export default function AppointmentPolicyPage() {
  return (
    <LegalPage
      eyebrow="Policies"
      title="Appointment Policy"
      description="How booking works at our Hyderabad clinic, what to expect for clinic visits and home consultations, and how to change an appointment."
      lastUpdated="22 September 2026"
      sections={SECTIONS}
    />
  );
}
