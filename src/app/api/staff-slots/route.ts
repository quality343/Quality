import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/guards";
import { listOpenSlots, staffBranchId } from "@/server/services/scheduling";

const querySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  /** Optional branch filter — ADMIN may pass any; staff are scoped to their own. */
  branchId: z.string().cuid().optional(),
});

/**
 * GET /api/staff-slots?date=YYYY-MM-DD[&branchId=…]
 * Authenticated endpoint for staff rescheduling. CLINIC_STAFF/AUDIOLOGIST/
 * THERAPIST are scoped to their own branch; ADMIN/SUPER_ADMIN may filter by
 * any branch. Returns open future slots for that day only.
 */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role === "PATIENT") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    date: url.searchParams.get("date") ?? undefined,
    branchId: url.searchParams.get("branchId") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const userBranch = await staffBranchId(user);
  const branchId = userBranch ?? parsed.data.branchId;
  if (!branchId) {
    return NextResponse.json({ error: "branchId is required" }, { status: 400 });
  }

  const [y, m, d] = parsed.data.date.split("-").map(Number);
  const start = new Date(y, m - 1, d);
  const end = new Date(start.getTime() + 86_400_000);

  const all = await listOpenSlots(branchId, undefined, 400);
  const daySlots = all
    .filter((s) => s.startsAt >= start && s.startsAt < end)
    .slice(0, 100);

  return NextResponse.json({
    slots: daySlots.map((s) => ({
      id: s.id,
      startsAt: s.startsAt.toISOString(),
      endsAt: s.endsAt.toISOString(),
    })),
  });
}
