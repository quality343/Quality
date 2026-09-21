import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { CLINIC_OPS_ROLES, requireRole } from "@/lib/auth/guards";
import { prisma } from "@/server/db/prisma";
import { staffBranchId } from "@/server/services/scheduling";
import { listBranches, listServices } from "@/server/services/queries";
import { SlotGenerator } from "./SlotGenerator";

export const metadata = { title: "Availability" };

/**
 * Availability worked at the clinic desk: generate bookable slots for a day,
 * and see what is still open. Availability is always recomputed server-side and
 * a slot can only be taken once (unique slotId on Appointment), so this page
 * never has to be the source of truth for occupancy.
 */
export default async function AvailabilityPage() {
  const user = await requireRole(...CLINIC_OPS_ROLES);
  const branchId = await staffBranchId(user);

  const [branches, services, openSlots] = await Promise.all([
    listBranches(),
    listServices(),
    prisma.appointmentSlot.findMany({
      where: {
        status: "OPEN",
        startsAt: { gte: new Date() },
        ...(branchId ? { branchId } : {}),
      },
      orderBy: { startsAt: "asc" },
      take: 40,
      select: {
        id: true,
        startsAt: true,
        endsAt: true,
        branch: { select: { name: true } },
        service: { select: { name: true } },
      },
    }),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Clinic operations"
        title="Availability"
        description="Create the slots guests can book, and see which times are still open."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card bare>
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-base font-semibold text-ink-900">Open slots</h2>
              <p className="mt-0.5 text-sm text-ink-500">
                Next 40 bookable times from today. Booked times disappear from the
                website automatically.
              </p>
            </div>
            {openSlots.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon="clock"
                  title="No open slots"
                  message="Generate slots on the right so guests have times to book."
                />
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {openSlots.map((slot) => (
                  <li
                    key={slot.id}
                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
                  >
                    <span className="font-medium text-ink-900">
                      {slot.startsAt.toLocaleString("en-IN", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </span>
                    <span className="flex items-center gap-2 text-xs text-ink-500">
                      <span>{slot.service?.name ?? "Any service"}</span>
                      <Badge tone="brand">{slot.branch.name}</Badge>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <SlotGenerator
          branches={branches.map((b) => ({ id: b.id, name: b.name }))}
          services={services.map((s) => ({ id: s.id, name: s.name }))}
        />
      </div>
    </>
  );
}
