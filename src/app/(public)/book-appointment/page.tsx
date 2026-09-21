import { Container, Icon, type IconName } from "@/components/ui";
import { PageHero } from "@/components/layout/PageHero";
import { PHOTOS } from "@/lib/images";
import { CLIENT } from "@/lib/client-info";
import { listBookingBranches } from "./data";
import { BookingWizard } from "./BookingWizard";

export const metadata = {
  title: "Book an Appointment — QUALITY Hearing Care, Hyderabad",
  description:
    "Book a hearing-care appointment at QUALITY Hearing Care, Kukatpally, Hyderabad — clinic visit or home consultation, in under a minute. No account needed.",
  alternates: { canonical: "/book-appointment" },
};

type SearchParams = Promise<{ branch?: string; service?: string; type?: string }>;

const ASSURANCES: { icon: IconName; title: string; text: string }[] = [
  { icon: "clock", title: "About a minute", text: "Three short steps, no account needed" },
  { icon: "shield", title: "Instant confirmation", text: "A booking reference you can use any time" },
  { icon: "home", title: "Clinic or home", text: "Choose whichever suits you" },
];

/**
 * Public guest booking wizard. Preselects arrive as URL params (from service /
 * branch CTAs) and are validated server-side before being honoured — a bogus
 * id simply degrades to "choose from the list".
 */
export default async function BookAppointmentPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const branches = await listBookingBranches();

  // URL params are never trusted: type must be one of the two supported
  // values; branch must be an active, online-bookable branch; service must be
  // genuinely offered there. Anything else degrades to the neutral start.
  const initialType =
    params.type === "HOME_CONSULTATION" || params.type === "CLINIC_VISIT"
      ? params.type
      : null;
  const requestedBranch = branches.find((b) => b.id === params.branch) ?? null;
  let initialServiceId: string | null = null;
  if (requestedBranch && params.service) {
    const { preselectValid } = await import("./data").then((m) =>
      m.listBranchServiceOptions(requestedBranch.id, params.service),
    );
    if (preselectValid) initialServiceId = params.service;
  }
  const homeEnabled = branches.some((b) => b.homeConsultationsEnabled);

  if (branches.length === 0) {
    return (
      <PageHero
        photo={PHOTOS.familySofa}
        eyebrow="Appointments"
        align="center"
        title="Online booking is temporarily unavailable"
        description={
          <>
            Please call us on{" "}
            <a href={CLIENT.phoneHref} className="font-semibold text-white underline-offset-4 hover:underline">
              {CLIENT.phone}
            </a>{" "}
            and our team will book your appointment directly.
          </>
        }
      />
    );
  }

  return (
    <>
      <PageHero
        photo={PHOTOS.familySofa}
        eyebrow="Appointments"
        title={
          <>
            Book your <span className="text-gradient-light">visit</span>
          </>
        }
        description="No account needed. Choose a clinic visit or a home consultation, pick a time that suits you, and you'll get a confirmation number you can use to view or cancel your booking."
        actions={
          <ul className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {ASSURANCES.map((item) => (
              <li
                key={item.title}
                className="flex items-center gap-3 rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-3 backdrop-blur-md"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                  <Icon name={item.icon} className="h-4 w-4 text-white" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-white">
                    {item.title}
                  </span>
                  <span className="block text-xs text-brand-100/70">{item.text}</span>
                </span>
              </li>
            ))}
          </ul>
        }
      />

      <section className="bg-surface-muted">
        <Container className="py-10 sm:py-14">
          <BookingWizard
            branches={branches}
            initialType={initialType}
            initialBranchId={requestedBranch?.id ?? null}
            initialServiceId={initialServiceId}
            homeEnabled={homeEnabled}
          />
        </Container>
      </section>
    </>
  );
}
