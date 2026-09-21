import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/server/db/prisma";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = { title: "My Profile" };

export default async function PatientProfilePage() {
  const user = await requireRole("PATIENT");

  const patient = await prisma.patient.findUnique({
    where: { userId: user.id },
    select: { mrn: true, createdAt: true },
  });

  return (
    <>
      <header className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">
          Patient Portal
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
          My Profile
        </h1>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-base font-semibold text-ink-900">Account</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-500">Full name</dt>
              <dd className="font-medium text-ink-900">{user.name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-500">Email</dt>
              <dd className="font-medium text-ink-900">{user.email}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-500">Mobile</dt>
              <dd className="font-medium text-ink-900">{user.phone ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-500">Role</dt>
              <dd className="font-medium text-ink-900">Patient</dd>
            </div>
          </dl>
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-ink-900">Patient record</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-500">Medical record no.</dt>
              <dd className="font-mono text-xs font-medium text-ink-900">
                {patient?.mrn ?? "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-500">Registered on</dt>
              <dd className="font-medium text-ink-900">
                {patient?.createdAt
                  ? new Intl.DateTimeFormat("en-IN", {
                      dateStyle: "medium",
                    }).format(patient.createdAt)
                  : "—"}
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-xs leading-relaxed text-ink-400">
            Clinical details (date of birth, address, hearing history) are collected
            at your first visit and managed by your care team.
          </p>
        </Card>
      </div>
    </>
  );
}
