import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/guards";
import { listCatalogue } from "@/server/services/hearingaid";

const querySchema = z.object({
  brandId: z.string().cuid().optional(),
  deviceType: z.enum(["BTE", "RIC", "ITE", "ITC", "CIC", "IIC"]).optional(),
  technologyLevel: z.enum(["PREMIUM", "ADVANCED", "MID", "ESSENTIAL"]).optional(),
  featureKey: z.string().max(40).optional(),
  q: z.string().trim().max(80).optional(),
  maxPriceInr: z.coerce.number().int().optional(),
});

/** GET /api/aid-catalogue — session required; patient responses are active-only and cost-free. */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    brandId: url.searchParams.get("brandId") ?? undefined,
    deviceType: url.searchParams.get("deviceType") ?? undefined,
    technologyLevel: url.searchParams.get("technologyLevel") ?? undefined,
    featureKey: url.searchParams.get("featureKey") ?? undefined,
    q: url.searchParams.get("q") ?? undefined,
    maxPriceInr: url.searchParams.get("maxPriceInr") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }
  const models = await listCatalogue(user, parsed.data);
  return NextResponse.json({ models });
}
