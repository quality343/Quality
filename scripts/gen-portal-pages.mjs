// One-time codegen for portal placeholder pages. Re-run only if the template changes.
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// area dir → [role, areaTitle, pages: [slug, title, icon, message]]
const PLAN = {
  patient: ["PATIENT", "Patient Portal", [
    ["appointments", "Appointments", "calendar", "Your upcoming appointments will appear here once online booking opens."],
    ["hearing-tests", "Hearing Tests", "ear", "Your hearing test history and results will appear here after your first assessment."],
    ["reports", "Reports", "shield", "Reports and documents from your visits will be available to download here."],
    ["hearing-aids", "Hearing Aids", "check", "Details of your hearing aid, warranty, and service history will appear here."],
    ["therapy", "Therapy", "sparkles", "Your therapy plan and session progress will appear here once therapy starts."],
    ["notifications", "Notifications", "bell", "Appointment reminders and clinic updates will appear here."],
  ]],
  audiologist: ["AUDIOLOGIST", "Audiologist Portal", [
    ["patients", "Patients", "users", "Your patients will be listed here once patient management opens."],
    ["appointments", "Appointments", "calendar", "Today's schedule and upcoming appointments will appear here."],
    ["assessments", "Assessments", "ear", "Start and review hearing assessments here once the clinical module opens."],
    ["audiograms", "Audiograms", "sparkles", "Audiogram management and visualization will be available here."],
    ["reports", "Reports", "shield", "Clinical report generation will be available here."],
    ["hearing-aids", "Hearing Aids", "check", "Hearing-aid recommendations and fittings will be managed here."],
    ["follow-ups", "Follow-ups", "clock", "Your follow-up queue will appear here."],
  ]],
  therapist: ["THERAPIST", "Therapist Portal", [
    ["patients", "Patients", "users", "Your therapy patients will be listed here once patient management opens."],
    ["appointments", "Appointments", "calendar", "Your therapy session schedule will appear here."],
    ["therapy-plans", "Therapy Plans", "shield", "Create and manage therapy plans here once the therapy module opens."],
    ["therapy-sessions", "Therapy Sessions", "sparkles", "Record and review therapy sessions here."],
    ["progress", "Progress", "check", "Goal progress tracking for your patients will appear here."],
    ["follow-ups", "Follow-ups", "clock", "Your follow-up queue will appear here."],
  ]],
  clinic: ["CLINIC_STAFF", "Clinic Portal", [
    ["patients", "Patients", "users", "Branch patient registration and search will open here."],
    ["appointments", "Appointments", "calendar", "The branch appointment calendar and check-in flow will appear here."],
    ["branch", "Branch", "building", "Branch details and settings will be managed here."],
    ["staff", "Staff", "users", "Branch staff directory will appear here."],
  ]],
  admin: ["ADMIN", "Admin Portal", [
    ["users", "Users", "users", "User account management will open here."],
    ["patients", "Patients", "users", "Organization-wide patient administration will open here."],
    ["staff", "Staff", "users", "Staff management across branches will open here."],
    ["branches", "Branches", "building", "Branch management will open here."],
    ["appointments", "Appointments", "calendar", "Organization-wide appointment oversight will appear here."],
    ["services", "Services", "sparkles", "The service catalogue will be managed here."],
    ["reports", "Reports", "shield", "Organization reports will be available here."],
  ]],
  "super-admin": ["SUPER_ADMIN", "Super Admin Portal", [
    ["system-overview", "System Overview", "sparkles", "Platform health and configuration summary will appear here."],
    ["users", "Users", "users", "Full user account administration will open here."],
    ["roles", "Roles", "shield", "Role and permission administration will open here."],
    ["admin-management", "Admin Management", "users", "Administrator accounts will be managed here."],
    ["audit-logs", "Audit Logs", "clock", "The security audit trail viewer will open here."],
    ["system-settings", "System Settings", "shield", "Platform settings will be managed here."],
  ]],
};

const pageTemplate = (role, areaTitle, title, icon, message) => `import { requireRole } from "@/lib/auth/guards";
import { EmptyState } from "@/components/ui/EmptyState";
import { PORTALS } from "@/lib/auth/portal-nav";

export const metadata = { title: "${title}" };

export default async function Page() {
  const user = await requireRole("${role}");
  const { areaTitle } = PORTALS.${role};

  return (
    <>
      <header className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">
          {areaTitle}
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
          ${title}
        </h1>
        <p className="mt-2 text-sm text-ink-500">
          Signed in as {user.name}.
        </p>
      </header>
      <EmptyState icon="${icon}" title="${title}" message="${message}" />
    </>
  );
}
`;

let written = 0;
for (const [area, [role, areaTitle, pages]] of Object.entries(PLAN)) {
  for (const [slug, title, icon, message] of pages) {
    const dir = resolve(root, `src/app/(portal)/portal/${area}/${slug}`);
    mkdirSync(dir, { recursive: true });
    const file = resolve(dir, "page.tsx");
    if (existsSync(file)) continue; // never overwrite hand-built pages
    writeFileSync(file, pageTemplate(role, areaTitle, title, icon, message));
    written++;
  }
}
console.log(`wrote ${written} placeholder pages`);
