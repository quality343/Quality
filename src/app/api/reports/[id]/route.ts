import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guards";
import { getReportForUser } from "@/server/services/clinical";
import { recordAuditEventSafe } from "@/lib/audit";
import { NotFoundError, ForbiddenError } from "@/lib/service-errors";

type ReportContent = {
  generatedAt?: string;
  patient?: { mrn?: string };
  history?: { complaints?: string | null; history?: string | null; referredBy?: string | null };
  tests?: { testType: string; payload: unknown }[];
  review?: { text?: string | null; reviewer?: string | null; reviewedAt?: string | null };
};

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const TEST_LABEL: Record<string, string> = {
  PTA: "Pure Tone Audiometry",
  SPEECH: "Speech Audiometry",
  TYMPANOMETRY: "Tympanometry",
  ABR: "ABR / BERA",
  OAE: "OAE",
  VESTIBULAR: "Vestibular",
  TINNITUS: "Tinnitus",
  SPECIALIZED: "Specialized",
};

/** Printable HTML view of a report (browser print → PDF). */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  const { id } = await params;

  try {
    const report = await getReportForUser(user, id);
    await recordAuditEventSafe({
      actorId: user.id,
      action: "REPORT_VIEWED",
      entityType: "Report",
      entityId: report.id,
    });

    const content = report.content as ReportContent;
    const isStaff = user.role !== "PATIENT";

    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${esc(report.title)}</title>
<style>
  body { font-family: system-ui, 'Segoe UI', sans-serif; color: #111827; margin: 40px auto; max-width: 720px; line-height: 1.55; }
  h1 { font-size: 22px; margin: 0; color: #004898; }
  h2 { font-size: 15px; margin: 24px 0 8px; color: #004898; text-transform: uppercase; letter-spacing: .04em; }
  .meta { color: #6b7280; font-size: 13px; margin-top: 4px; }
  .rule { border: 0; border-top: 2px solid #d01028; margin: 16px 0 24px; }
  dl { display: grid; grid-template-columns: 160px 1fr; gap: 4px 16px; font-size: 14px; }
  dt { font-weight: 600; }
  dd { margin: 0; color: #374151; }
  pre { background: #f3f4f6; padding: 12px; border-radius: 8px; font-size: 12px; overflow-x: auto; }
  footer { margin-top: 40px; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 12px; }
  @media print { body { margin: 0 24px; } }
</style>
</head>
<body>
<h1>QUALITY Hearing Care</h1>
<p class="meta">JOY OF HEARING</p>
<hr class="rule">
<h1>${esc(report.title)}</h1>
<p class="meta">Status: ${report.status} · Generated ${new Date(report.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>

<h2>Patient</h2>
<dl>
  <dt>MRN</dt><dd>${esc(content.patient?.mrn ?? "—")}</dd>
  <dt>Referred by</dt><dd>${esc(content.history?.referredBy ?? "—")}</dd>
</dl>

<h2>Case history</h2>
<dl>
  <dt>Complaints</dt><dd>${esc(content.history?.complaints ?? "—")}</dd>
  <dt>History</dt><dd>${esc(content.history?.history ?? "—")}</dd>
</dl>

<h2>Recorded tests</h2>
${(content.tests ?? []).map((t) => `<h3 style="font-size:14px;margin:14px 0 4px;">${esc(TEST_LABEL[t.testType] ?? t.testType)}</h3><pre>${esc(JSON.stringify(t.payload, null, 2))}</pre>`).join("") || "<p class='meta'>No tests recorded.</p>"}

<h2>Audiologist review</h2>
<p>${esc(content.review?.text ?? "—")}</p>
<p class="meta">${esc(content.review?.reviewer ?? "")}${content.review?.reviewedAt ? ` · ${new Date(content.review.reviewedAt).toLocaleDateString("en-IN")}` : ""}</p>

<footer>
  This report was generated from data recorded by QUALITY Hearing Care professionals.
  ${isStaff ? "Staff view — for clinical use." : "Please discuss your results with your audiologist; this document does not by itself constitute medical advice."}
</footer>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    if (e instanceof NotFoundError || e instanceof ForbiddenError) {
      return NextResponse.json({ error: "Not available" }, { status: 404 });
    }
    console.error("[report-view]", e);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
