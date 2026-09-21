import { NextResponse } from "next/server";
import { z } from "zod";
import { listOpenSlots } from "@/server/services/scheduling";
import { hit } from "@/lib/rate-limit";

const querySchema = z.object({
  branchId: z.string().cuid(),
  serviceId: z.string().cuid().optional(),
  /** ISO date (YYYY-MM-DD) to restrict slots to one day (public wizard). */
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

/**
 * GET /api/slots?branchId=…&serviceId=…&date=YYYY-MM-DD
 *
 * PUBLIC (guest-accessible) read endpoint for the booking wizard. Rate-limited
 * and read-only: returns open, future slots only. No PHI, no staff emails,
 * no booking metadata — just id + times, which are already public schedule
 * information. Authoritative availability is re-verified server-side at
 * booking time; this endpoint can never grant a slot by itself.
 */
export async function GET(request: Request) {
  // Coarse per-IP rate limit (no PII stored — key is scope + IP).
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  if (!hit(`slots:${ip}`, 90, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    branchId: url.searchParams.get("branchId") ?? undefined,
    serviceId: url.searchParams.get("serviceId") ?? undefined,
    date: url.searchParams.get("date") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }
  const { branchId, serviceId, date } = parsed.data;

  // Day window in server-local time (IST deployment).
  let daySlots = await listOpenSlots(branchId, serviceId, 400);
  if (date) {
    const [y, m, d] = date.split("-").map(Number);
    const start = new Date(y, m - 1, d);
    const end = new Date(start.getTime() + 86_400_000);
    daySlots = daySlots.filter(
      (s) => s.startsAt >= start && s.startsAt < end,
    );
  }
  daySlots = daySlots.slice(0, 100);

  return NextResponse.json({
    slots: daySlots.map((s) => ({
      id: s.id,
      startsAt: s.startsAt.toISOString(),
      endsAt: s.endsAt.toISOString(),
      staffName: s.staffName,
    })),
  });
}
