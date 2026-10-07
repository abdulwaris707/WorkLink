import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSmartRecommendations } from "@/lib/recommendations";
import { z } from "zod";

const recommendationRequestSchema = z.object({
  workDescription: z.string().min(3, "Please describe the work needed in at least 3 characters.").max(1000),
  category: z.string().optional(),
  location: z.string().optional(),
  maxBudget: z.coerce.number().positive().optional(),
  preferredDate: z.string().optional(),
  urgency: z.enum(["NORMAL", "HIGH", "EMERGENCY"]).optional().default("NORMAL"),
});

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = recommendationRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid criteria", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const results = await getSmartRecommendations(parsed.data);

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error("Smart recommendations error:", error);
    return NextResponse.json({ error: "Failed to generate recommendations" }, { status: 500 });
  }
}
