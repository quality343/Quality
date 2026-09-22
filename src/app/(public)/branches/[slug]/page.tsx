import { notFound } from "next/navigation";
import Link from "next/link";
import { Button, Card, Container, Icon } from "@/components/ui";
import { CLIENT } from "@/lib/client-info";
import { prisma } from "@/server/db/prisma";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const branch = await prisma.branch.findFirst({
    where: { code: slug.toUpperCase(), isActive: true },
  });
  if (!branch) return { title: "Branch not found" };
  return {
    title: `${branch.name} — QUALITY Hearing Care`,
    description: `Visit QUALITY Hearing Care at ${branch.name}. Call ${CLIENT.phone} or book an appointment online.`,
    alternates: { canonical: `/branches/${slug}` },
  };
}

export default async function BranchDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const branch = await prisma.branch.findFirst({
    where: { code: slug.toUpperCase(), isActive: true },
    include: {
      services: { where: { isActive: true }, include: { service: true } },
    },
  });
  if (!branch) notFound();

  const address = branch.address || CLIENT.addressOneLine;
  const mapsUrl =
    "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(address);

  return (
    <Container className="py-12">
      <div className="mx-auto max-w-2xl">
        <Link href="/branches" className="text-sm font-semibold text-brand-700 hover:text-brand-800">
          ← All branches
        </Link>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
          {branch.name}
        </h1>
        {branch.city && (
          <p className="mt-2 text-ink-500">
            <Icon name="map-pin" className="mr-1.5 inline h-4 w-4" />
            {branch.city}
          </p>
        )}

        <Card className="mt-8">
          <h2 className="text-base font-semibold text-ink-900">Address</h2>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open this clinic's location in Google Maps (opens in a new tab)"
            className="mt-2 block"
          >
            <address className="text-sm not-italic leading-relaxed text-ink-600 underline-offset-4 hover:text-brand-700 hover:underline">
              {address.split(",").map((line, i) => (
                <span key={i} className="block">
                  {line.trim()}
                </span>
              ))}
            </address>
          </a>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Button
              href={mapsUrl}
              variant="secondary"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open this clinic's location in Google Maps (opens in a new tab)"
            >
              <Icon name="map-pin" className="h-4 w-4" />
              Get Directions
            </Button>
            {branch.phone && (
              <Button href={`tel:+91${branch.phone.replace(/\D/g, "")}`} variant="ghost">
                <Icon name="phone" className="h-4 w-4" />
                {branch.phone}
              </Button>
            )}
          </div>
        </Card>

        {branch.homeConsultationsEnabled && (
          <Card className="mt-6 bg-brand-50/60">
            <h2 className="text-base font-semibold text-ink-900">Home Consultation</h2>
            <p className="mt-2 text-sm text-ink-600">
              Available from this location — book online and our team will
              coordinate a suitable visit time with you.
            </p>
            <div className="mt-4">
              <Button href="/book-appointment?type=HOME_CONSULTATION" variant="accent">
                <Icon name="home" className="h-4 w-4" />
                Book Home Consultation
              </Button>
            </div>
          </Card>
        )}

        <Card className="mt-6">
          <h2 className="text-base font-semibold text-ink-900">Services at this branch</h2>
          {branch.services.length === 0 ? (
            <p className="mt-2 text-sm text-ink-500">
              Service list is being updated — please call {CLIENT.phone}.
            </p>
          ) : (
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {branch.services.map(({ service }) => (
                <li key={service.id}>
                  <Link
                    href={`/services/${service.code.toLowerCase()}`}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 text-sm text-ink-700 hover:border-brand-300 hover:text-brand-700"
                  >
                    {service.name}
                    <span className="text-xs text-ink-400">{service.durationMinutes} min</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="mt-8">
          <Button href={`/book-appointment?branch=${branch.id}`} size="lg">
            <Icon name="calendar" className="h-5 w-5" />
            Book at This Clinic
          </Button>
        </div>
      </div>
    </Container>
  );
}
