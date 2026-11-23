import { achievementStats } from "@/lib/achievement-stats";

export const dynamic = "force-static";

export function GET() {
  return Response.json({
    data: achievementStats,
    mocked: true,
  });
}
