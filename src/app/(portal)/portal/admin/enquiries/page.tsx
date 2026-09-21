import { CLINIC_OPS_ROLES, requireRole } from "@/lib/auth/guards";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { prisma } from "@/server/db/prisma";
import { EnquiryRow } from "./EnquiryRow";

export const metadata = { title: "Enquiries" };

type SearchParams = Promise<{ status?: string }>;

const STATUS_TONE: Record<string, string> = {
  NEW: "bg-amber-50 text-amber-700",
  IN_PROGRESS: "bg-brand-50 text-brand-700",
  RESOLVED: "bg-emerald-50 text-emerald-700",
};

export default async function AdminEnquiriesPage({ searchParams }: { searchParams: SearchParams }) {
  await requireRole(...CLINIC_OPS_ROLES);
  const sp = await searchParams;

  const enquiries = await prisma.contactEnquiry.findMany({
    where: sp.status ? { status: sp.status as never } : {},
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const counts = {
    all: await prisma.contactEnquiry.count(),
    NEW: await prisma.contactEnquiry.count({ where: { status: "NEW" } }),
    IN_PROGRESS: await prisma.contactEnquiry.count({ where: { status: "IN_PROGRESS" } }),
    RESOLVED: await prisma.contactEnquiry.count({ where: { status: "RESOLVED" } }),
  };

  return (
    <>
      <PageHeader
        eyebrow="Clinic operations"
        title="Enquiries"
        description="Contact-form messages from the website. Respond by phone or email — nothing is auto-sent from the system."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <a
          href="/portal/admin/enquiries"
          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${!sp.status ? "bg-brand-700 text-white" : "border border-border text-ink-600 hover:border-brand-300"}`}
        >
          All ({counts.all})
        </a>
        {(["NEW", "IN_PROGRESS", "RESOLVED"] as const).map((s) => (
          <a
            key={s}
            href={`/portal/admin/enquiries?status=${s}`}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${sp.status === s ? "bg-brand-700 text-white" : "border border-border text-ink-600 hover:border-brand-300"}`}
          >
            {s.replace("_", " ")} ({counts[s]})
          </a>
        ))}
      </div>

      <Card bare>
        {enquiries.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon="bell"
              title="No enquiries yet"
              message="Messages submitted through the website contact form will appear here."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-ink-400">
                  <th className="px-4 py-3 font-semibold">Received</th>
                  <th className="px-4 py-3 font-semibold">From</th>
                  <th className="px-4 py-3 font-semibold">Contact</th>
                  <th className="px-4 py-3 font-semibold">Interest</th>
                  <th className="px-4 py-3 font-semibold">Message</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {enquiries.map((e) => (
                  <EnquiryRow
                    key={e.id}
                    id={e.id}
                    name={e.name}
                    mobile={e.mobile}
                    email={e.email}
                    interest={e.interest}
                    appointmentType={e.appointmentType}
                    message={e.message}
                    status={e.status}
                    createdAt={e.createdAt.toISOString()}
                    statusTone={STATUS_TONE[e.status] ?? "bg-ink-100 text-ink-600"}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
