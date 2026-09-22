import type { Metadata } from "next";
import { LegalList, LegalNote, LegalPage, type LegalSection } from "@/components/legal/LegalPage";
import { CLIENT } from "@/lib/client-info";

export const metadata: Metadata = {
  // `absolute` — the brief's wording, and the root layout's template would
  // otherwise append the brand a second time.
  title: { absolute: "Terms & Conditions | Quality Hearing Care" },
  description:
    "The terms that apply when you use the Quality Hearing Care website and book an appointment with our clinic in Kukatpally, Hyderabad.",
  alternates: { canonical: "/terms-and-conditions" },
};

/**
 * Written in plain language for this website only. Nothing here states a fee,
 * notice period, guarantee or medical outcome, because the clinic has not
 * supplied those details — where a policy is unknown, the page points the
 * reader to the clinic instead of inventing one.
 */
const SECTIONS: LegalSection[] = [
  {
    id: "introduction",
    title: "Introduction",
    content: (
      <>
        <p>
          These terms apply to this website and to appointments you request
          through it. They are provided by {CLIENT.name} (&ldquo;we&rdquo;,
          &ldquo;us&rdquo;). By using the website or submitting a booking, you
          agree to them.
        </p>
        <p>
          Please read them together with our{" "}
          <a
            href="/privacy-policy"
            className="font-semibold text-brand-700 underline-offset-4 hover:underline"
          >
            Privacy Policy
          </a>{" "}
          and{" "}
          <a
            href="/appointment-policy"
            className="font-semibold text-brand-700 underline-offset-4 hover:underline"
          >
            Appointment Policy
          </a>
          .
        </p>
      </>
    ),
  },
  {
    id: "appointment-booking",
    title: "Appointment Booking",
    content: (
      <>
        <p>
          You can request an appointment through this website without creating
          an account. You choose the type of appointment (a clinic visit or a
          home consultation), the service you are interested in, and a
          preferred date and time.
        </p>
        <p>
          The details you submit must be accurate and must belong to you, or to
          the person you are booking on behalf of with their permission. If we
          cannot reach you on the number you provide, we may not be able to
          hold the appointment.
        </p>
        <p>
          Availability shown on the website reflects the times currently
          offered by the clinic and can change as other bookings are made.
        </p>
      </>
    ),
  },
  {
    id: "appointment-confirmation",
    title: "Appointment Confirmation",
    content: (
      <>
        <p>
          When you submit a booking, the website shows a confirmation screen
          with an appointment number. That number is how you and our team can
          refer to the booking.
        </p>
        <p>
          A submitted request is not a medical opinion or a diagnosis. Our team
          may contact you to confirm details, ask a question about your
          appointment, or confirm the time.
        </p>
        <LegalNote>
          <p className="text-sm leading-relaxed text-ink-600">
            We do not send automatic SMS or email messages unless a messaging
            service is connected to the clinic&rsquo;s systems. Please keep your
            appointment number, and contact the clinic if you are unsure whether
            an appointment is confirmed.
          </p>
        </LegalNote>
      </>
    ),
  },
  {
    id: "clinic-visits",
    title: "Clinic Visits",
    content: (
      <>
        <p>
          Clinic visits take place at our clinic: {CLIENT.addressOneLine}.
        </p>
        <p>
          Please arrive a little before your appointment time so there is time
          to check in. If you are running late, call us on{" "}
          <a
            href={CLIENT.phoneHref}
            className="font-semibold text-brand-700 underline-offset-4 hover:underline"
          >
            {CLIENT.phone}
          </a>{" "}
          so we can tell you whether the time can still be held.
        </p>
        <p>
          Bringing any previous hearing reports, prescriptions or hearing aids
          with you helps the consultation.
        </p>
      </>
    ),
  },
  {
    id: "home-consultations",
    title: "Home Consultations",
    content: (
      <>
        <p>
          Home consultation is available from the clinic. To arrange a visit,
          choose &ldquo;Home Consultation&rdquo; while booking and provide the
          address and locality where the visit is needed, along with any
          instructions that would help our team (for example, floor or lift
          access).
        </p>
        <p>
          Home visit requests are reviewed by our team and are subject to
          availability and confirmation. Submitting a request does not by itself
          guarantee a visit at the requested time. Our team will contact you to
          confirm.
        </p>
        <p>
          Your address is used only to arrange and carry out the visit. It is
          not published, and it is visible only to the clinic team handling the
          request.
        </p>
      </>
    ),
  },
  {
    id: "rescheduling-and-cancellation",
    title: "Rescheduling and Cancellation",
    content: (
      <>
        <p>
          If your plans change, please contact the clinic as early as you can so
          the time can be offered to someone else. You can also look up a
          booking you have made using your appointment number on our{" "}
          <a
            href="/booking-lookup"
            className="font-semibold text-brand-700 underline-offset-4 hover:underline"
          >
            booking lookup
          </a>{" "}
          page.
        </p>
        <p>
          We may need to reschedule or cancel an appointment — for example if a
          clinician is unavailable, if a home visit cannot be arranged, or for
          reasons outside our control. If that happens, we will contact you
          using the details you provided to offer another time.
        </p>
        <LegalNote>
          <p className="text-sm leading-relaxed text-ink-600">
            Any notice period, cancellation charge or refund arrangement is set
            by the clinic. Please contact {CLIENT.name} for the applicable
            appointment or cancellation details.
          </p>
        </LegalNote>
      </>
    ),
  },
  {
    id: "patient-responsibilities",
    title: "Patient and Visitor Responsibilities",
    content: (
      <>
        <p>When using this website or attending an appointment, please:</p>
        <LegalList
          items={[
            "Provide information that is true, current and your own (or that you are authorised to give).",
            "Use the website for genuine appointment and enquiry purposes only.",
            "Treat our team and other visitors with courtesy.",
            "Follow any reasonable safety or clinic instructions given to you.",
          ]}
        />
        <p>
          We may decline or cancel a booking where information given is
          misleading, where a booking appears to be automated or abusive, or
          where the request cannot be safely accommodated.
        </p>
      </>
    ),
  },
  {
    id: "website-usage",
    title: "Website Usage",
    content: (
      <>
        <p>
          This website and its content are provided for information and
          appointment booking. Please do not attempt to interfere with it,
          access areas that are not intended for public use, copy content for
          another business, or submit automated requests.
        </p>
        <p>
          Text, images, layout and branding on this website belong to{" "}
          {CLIENT.name} or are used with permission, and may not be reproduced
          without our consent.
        </p>
      </>
    ),
  },
  {
    id: "service-information",
    title: "Service Information",
    content: (
      <>
        <p>
          Descriptions of hearing tests, hearing aids and other services on this
          website are general explanations intended to help you understand what
          a service involves. They are not medical advice and are not a
          substitute for an assessment by a qualified professional.
        </p>
        <p>
          Prices are shown only where the clinic has published them. Where a
          price is not shown, please ask the clinic for current charges. Nothing
          on this website promises a particular hearing outcome or result.
        </p>
      </>
    ),
  },
  {
    id: "third-party-services",
    title: "Third-Party Services",
    content: (
      <>
        <p>
          We use reputable third-party services to run the website and manage
          appointments — for example hosting, database and, where configured,
          Google Sheets for internal appointment records. Where a link takes you
          to a service we do not control (such as Google Maps), that
          service&rsquo;s own terms apply.
        </p>
        <p>
          We are not responsible for the content or availability of external
          websites linked from ours.
        </p>
      </>
    ),
  },
  {
    id: "changes-to-these-terms",
    title: "Changes to These Terms",
    content: (
      <p>
        We may update these terms as the clinic&rsquo;s services or our systems
        change. The version published on this page applies from the date shown
        at the top. If you continue to use the website after a change, the
        updated terms apply.
      </p>
    ),
  },
  {
    id: "contact-information",
    title: "Contact Information",
    content: (
      <>
        <p>
          If anything here is unclear, please contact us. We are happy to
          explain how the clinic works before you book.
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
            <>
              Clinic:{" "}
              <a
                href={CLIENT.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open Quality Hearing Care location in Google Maps (opens in a new tab)"
                className="font-semibold text-brand-700 underline-offset-4 hover:underline"
              >
                {CLIENT.addressOneLine}
              </a>
            </>,
          ]}
        />
      </>
    ),
  },
];

export default function TermsAndConditionsPage() {
  return (
    <LegalPage
      eyebrow="Policies"
      title="Terms & Conditions"
      description="How this website and our appointment booking work, and what you can expect from us."
      lastUpdated="22 September 2026"
      sections={SECTIONS}
    />
  );
}
