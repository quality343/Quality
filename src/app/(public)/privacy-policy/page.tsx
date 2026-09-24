import type { Metadata } from "next";
import { LegalList, LegalNote, LegalPage, type LegalSection } from "@/components/legal/LegalPage";
import { CLIENT, WHATSAPP } from "@/lib/client-info";

export const metadata: Metadata = {
  // `absolute` — matches the brief exactly, avoiding the root template's
  // second brand stamp.
  title: { absolute: "Privacy Policy | Quality Hearing Care" },
  description:
    "What information Quality Hearing Care collects when you use this website or send us an appointment request, how it is used, and how it is protected.",
  alternates: { canonical: "/privacy-policy" },
};

/**
 * This page describes what the application actually does — nothing more.
 * It deliberately makes no claim of compliance with any particular law or
 * certification, and does not state that information is never shared, because
 * appointment records are processed by the services listed below.
 */
const SECTIONS: LegalSection[] = [
  {
    id: "introduction",
    title: "Introduction",
    content: (
      <>
        <p>
          This policy explains what information {CLIENT.name} collects through
          this website, why we collect it, and how it is handled. It covers
          appointment requests, home consultation requests and messages sent
          through our contact form or WhatsApp.
        </p>
        <p>
          We keep this page in step with how the website actually works. If our
          systems change in a way that affects your information, we will update
          this page.
        </p>
      </>
    ),
  },
  {
    id: "information-we-collect",
    title: "Information We Collect",
    content: (
      <>
        <p>
          We only ask for information we need to arrange and manage your
          appointment or answer your enquiry:
        </p>
        <LegalList
          items={[
            "Details you type into a form — such as your name, mobile number, email address and any message or instructions you provide.",
            "For a home consultation: the address and locality where the visit is needed, and any access instructions you choose to add.",
            "For an appointment request: whether it is for a clinic visit or a home consultation, the service or test you are asking about, and the day and time that suit you.",
          ]}
        />
        <p>
          You only ever need to tell us what the enquiry requires. We do not ask
          for payment card details on this website, and we do not collect health
          records through the public website.
        </p>
      </>
    ),
  },
  {
    id: "appointment-information",
    title: "Appointment Information",
    content: (
      <>
        <p>
          When you send us an appointment or home-consultation request, our team
          records it in the clinic&rsquo;s own appointment system so we can
          confirm a time, reschedule it or complete it. That record is internal
          to the clinic.
        </p>
        <p>
          This website does not publish appointments and does not offer a
          lookup tool — there is no public page where an appointment can be
          opened. If you want to know what we hold about an appointment, contact
          the clinic and our team will help you.
        </p>
      </>
    ),
  },
  {
    id: "contact-information",
    title: "Contact Information",
    content: (
      <>
        <p>
          If you send us a message through the contact form, we store the
          details you provide so our team can read it and respond. Messages are
          kept for clinic administration and are not published anywhere on this
          website.
        </p>
        <p>
          You can always reach us directly instead — message us on WhatsApp on{" "}
          <a
            href={WHATSAPP.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat with Quality Hearing Care on WhatsApp (opens in a new tab)"
            className="font-semibold text-brand-700 underline-offset-4 hover:underline"
          >
            {CLIENT.phone}
          </a>{" "}
          or{" "}
          <a
            href={`mailto:${CLIENT.email}`}
            aria-label="Email Quality Hearing Care"
            className="font-semibold text-brand-700 underline-offset-4 hover:underline"
          >
            {CLIENT.email}
          </a>
          .
        </p>
      </>
    ),
  },
  {
    id: "how-information-is-used",
    title: "How Information Is Used",
    content: (
      <>
        <p>Information you submit is used to:</p>
        <LegalList
          items={[
            "Arrange, confirm and manage your appointment or home visit request.",
            "Contact you about that appointment — for example to confirm a time or ask for clarification.",
            "Respond to an enquiry you have sent us.",
            "Keep the clinic's internal record of appointments.",
            "Keep the website and our appointment records working safely and prevent misuse.",
          ]}
        />
        <p>
          We do not sell your information, and we do not use it for advertising
          unrelated to the clinic.
        </p>
      </>
    ),
  },
  {
    id: "appointment-management",
    title: "Appointment Management",
    content: (
      <>
        <p>
          Appointment details are visible only to authorised clinic staff who
          sign in to a protected area of the website. That area is not part of
          the public website and is not indexed by search engines.
        </p>
        <p>
          Home consultation addresses and instructions are treated as private.
          They are shown to the clinic team who arrange the visit and are never
          displayed on any public page.
        </p>
      </>
    ),
  },
  {
    id: "google-sheets",
    title: "Google Sheets / Third-Party Processing",
    content: (
      <>
        <p>
          Where it is configured, appointment details are also copied into a
          Google Sheet that the clinic uses as an internal appointment
          register. This is a secondary record: our clinic database remains the
          system of record, and the copy exists so the clinic has a simple
          working list of appointments.
        </p>
        <p>
          That means appointment information — including the name, contact
          details, service, appointment date and time, and, for a home
          consultation, the address you provided — may be processed and stored
          using Google&rsquo;s services, under Google&rsquo;s own terms. The
          spreadsheet is not public; access is limited to the clinic account
          that owns it.
        </p>
        <LegalNote>
          <p className="text-sm leading-relaxed text-ink-600">
            If you would prefer your appointment not to be included in the
            clinic&rsquo;s spreadsheet register, tell us when you call or email
            and we will record the appointment without that copy.
          </p>
        </LegalNote>
      </>
    ),
  },
  {
    id: "cookies-and-analytics",
    title: "Cookies and Analytics",
    content: (
      <>
        <p>
          This website does not currently use advertising or analytics tracking
          cookies. Cookies are used only where they are needed for the site to
          function — for example to keep a signed-in clinic staff member signed
          in to the admin area. A visitor browsing the public website does not
          need to sign in, and no account is created when you contact us.
        </p>
        <p>
          If analytics were added later, this policy would be updated to say so
          before that happened.
        </p>
      </>
    ),
  },
  {
    id: "data-security",
    title: "Data Security",
    content: (
      <>
        <p>
          Information you submit is sent over an encrypted connection and stored
          in our clinic database. Clinic accounts use hashed passwords — we do
          not store readable passwords. Access to appointment data requires a
          signed-in clinic account, and the check happens on our server rather
          than in the browser.
        </p>
        <p>
          We also apply safeguards to the public forms, such as server-side
          validation and rate limiting, to reduce automated or abusive
          submissions.
        </p>
        <LegalNote>
          <p className="text-sm leading-relaxed text-ink-600">
            No system can be guaranteed completely secure. If you believe your
            information has been handled incorrectly, please contact the clinic
            straight away.
          </p>
        </LegalNote>
      </>
    ),
  },
  {
    id: "data-retention",
    title: "Data Retention",
    content: (
      <>
        <p>
          Appointment and enquiry records are kept for as long as the clinic
          needs them for appointment management and its own administrative
          records. When they are no longer needed, they are removed.
        </p>
        <p>
          If you would like to know whether we still hold information about you,
          or to ask for it to be removed where that is possible, please contact
          the clinic.
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
          This website relies on third-party providers for hosting, database
          storage and — where configured — the appointment spreadsheet described
          above. Those providers process information on the clinic&rsquo;s
          behalf.
        </p>
        <p>
          Links on this website may take you to services we do not operate, such
          as Google Maps for directions. Once you follow such a link, that
          service&rsquo;s own privacy policy applies.
        </p>
      </>
    ),
  },
  {
    id: "your-choices",
    title: "Your Choices and Contact",
    content: (
      <>
        <p>
          You choose what you tell us. An appointment request only requires the
          details needed to arrange it, and you can call or email the clinic
          instead of using the website if you prefer.
        </p>
        <p>
          To ask about the information we hold, or to raise a concern about how
          it has been handled, contact us using the details at the end of this
          page.
        </p>
      </>
    ),
  },
  {
    id: "changes-to-this-policy",
    title: "Changes to This Privacy Policy",
    content: (
      <p>
        We may update this policy if the clinic&rsquo;s services or the systems
        behind this website change. The current version always appears on this
        page, with the date shown at the top.
      </p>
    ),
  },
  {
    id: "contact-information",
    title: "Contact Information",
    content: (
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
          <>
            Address:{" "}
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
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      eyebrow="Policies"
      title="Privacy Policy"
      description="What we collect when you contact us or send an appointment request, how that information is used, and how it is protected."
      lastUpdated="22 September 2026"
      sections={SECTIONS}
    />
  );
}
