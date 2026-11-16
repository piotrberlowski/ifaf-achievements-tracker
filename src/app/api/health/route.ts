import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

export async function GET() {
  if (!process.env.IFAF_AT_POSTGRES_PRISMA_URL) {
    return NextResponse.json(
      { ok: false, error: "Database URL is not set" },
      { status: 503 },
    );
  }

  await getPrisma().$queryRaw`SELECT 1`;
  return NextResponse.json({ ok: true });
}
