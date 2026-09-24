import type { Metadata } from "next";
import { LegalList, LegalNote, LegalPage, type LegalSection } from "@/components/legal/LegalPage";
import { CLIENT, WHATSAPP } from "@/lib/client-info";

export const metadata: Metadata = {
  // `absolute` — matches the brief exactly, avoiding the root template's
  // second brand stamp.
  title: { absolute: "Appointment Policy | Quality Hearing Care" },
  description:
    "How appointments are arranged, confirmed, rescheduled and cancelled at Quality Hearing Care, Kukatpally, Hyderabad — for clinic visits and home consultations.",
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
    title: "How to Arrange an Appointment",
    content: (
      <>
        <p>
          Appointments are arranged directly with the clinic. There is no online
          booking form and no account to create — you contact us, and our team
          confirms a time with you:
        </p>
        <LegalList
          items={[
            "Message us on WhatsApp, call the clinic, or send a message from the contact page.",
            "Tell us what you need — a hearing test, a hearing-aid consultation, another service, or a home consultation.",
            "Tell us when suits you. We check what is available and confirm a time with you.",
            "Give us your name, mobile number and, for a home consultation, the address and locality for the visit.",
          ]}
        />
        <p>
          Home consultation requests are always confirmed by our team rather
          than automatically, because the visit depends on availability and on
          the location. Nothing is fixed until we have spoken with you.
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
          Home consultation is available. When you ask about this option, tell us
          the address and locality where the visit is needed, and add any
          instructions that would help — for example parking, floor or lift
          access.
        </p>
        <p>
          Home visit requests are reviewed and confirmed by our team rather than
          being finalised automatically, because the visit depends on
          availability and on the location. After you send us the details, our
          team will contact you to confirm.
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
          An appointment is confirmed once our team has spoken with you and a
          time has been agreed. Nothing sent through this website holds a slot on
          its own.
        </p>
        <p>
          Our team may call you to confirm details or to check something about
          your appointment. If we cannot reach you on the number you gave, or if
          a detail cannot be confirmed, we may need to arrange a different time.
        </p>
        <p>
          Confirming an appointment is not a diagnosis and does not replace an
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
          Message or call us with the name and mobile number the appointment was
          arranged under, and we will find it for you.
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
          can be offered to another patient. Call, message or email the clinic
          with the name and mobile number it was arranged under, and we will
          cancel it for you.
        </p>
        <p>
          We may cancel or decline an appointment where the details given are
          inaccurate, where the request cannot be safely accommodated, or where
          a request appears to be automated or abusive.
        </p>
        <LegalNote>
          <p className="text-sm leading-relaxed text-ink-600">
            The clinic has not published a cancellation fee, refund policy or
            advance payment requirement. Please contact the clinic for the
            applicable details before cancelling if you have any question about
            charges.
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
          For anything to do with an appointment, the fastest routes are
          WhatsApp and a phone call.
        </p>
        <LegalList
          items={[
            <>
              WhatsApp:{" "}
              <a
                href={WHATSAPP.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat with Quality Hearing Care on WhatsApp (opens in a new tab)"
                className="font-semibold text-brand-700 underline-offset-4 hover:underline"
              >
                {CLIENT.phone}
              </a>
            </>,
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
      description="How appointments are arranged at our Hyderabad clinic, what to expect for clinic visits and home consultations, and how to change an appointment."
      lastUpdated="22 September 2026"
      sections={SECTIONS}
    />
  );
}
