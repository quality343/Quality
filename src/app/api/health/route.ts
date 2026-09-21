import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "quality-hearing-care",
    phase: "0-foundation",
    time: new Date().toISOString(),
  });
}
