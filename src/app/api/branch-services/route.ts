import { NextResponse } from "next/server";
import { z } from "zod";
import { hit } from "@/lib/rate-limit";
import { listBranchServiceOptions } from "@/app/(public)/book-appointment/data";

const querySchema = z.object({ branchId: z.string().cuid() });

/**
 * GET /api/branch-services?branchId=…
 * Public read: active services offered at a branch (name/category/duration
 * only — no pricing, no internal fields). Powers step 2 of the booking wizard.
 */
export async function GET(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  if (!hit(`branch-services:${ip}`, 90, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    branchId: url.searchParams.get("branchId") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const { services } = await listBranchServiceOptions(parsed.data.branchId);
  return NextResponse.json({ services });
}
