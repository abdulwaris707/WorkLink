import "server-only";
import { db, schema } from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";

export interface RecommendationQuery {
  workDescription: string;
  category?: string;
  location?: string;
  maxBudget?: number;
  preferredDate?: string;
  urgency?: "NORMAL" | "HIGH" | "EMERGENCY";
}

export interface RecommendedWorkerResult {
  worker: {
    id: string;
    slug: string;
    name: string;
    avatarUrl: string | null;
    category: string;
    skills: string[];
    bio: string | null;
    serviceArea: string;
    startingPrice: number;
    hourlyRate: number;
    rating: number;
    reviewCount: number;
    isVerified: boolean;
    services: Array<{
      id: string;
      title: string;
      price: number;
      durationMinutes: number;
    }>;
  };
  matchScore: number;
  matchReasons: string[];
}

/**
 * Isolated server-side rule-based recommendation engine.
 * 
 * TODO [Future AI Enhancement]:
 * When an AI API key (e.g. Gemini / OpenAI / Cohere) is configured, this service
 * can be upgraded to compute cosine similarity against pgvector embeddings of
 * workDescription vs workerProfile embeddings, without altering the frontend contract.
 * Note: Never transmit user personal identifiable information (PII) to an external
 * AI service without explicit user consent.
 */
export async function getSmartRecommendations(
  query: RecommendationQuery
): Promise<RecommendedWorkerResult[]> {
  const { workDescription, category, location, maxBudget, urgency } = query;

  // Query only approved, verified, and published active workers from Neon DB
  const workers = await db.query.workerProfiles.findMany({
    where: and(
      eq(schema.workerProfiles.isPublished, true),
      eq(schema.workerProfiles.isVerified, true),
      eq(schema.workerProfiles.verificationStatus, "approved")
    ),
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          avatarUrl: true,
          location: true,
        },
      },
      services: {
        where: eq(schema.services.isActive, true),
        columns: {
          id: true,
          title: true,
          price: true,
          durationMinutes: true,
        },
      },
    },
  });

  const searchTokens = (workDescription || "")
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2);

  const results: RecommendedWorkerResult[] = [];

  for (const wp of workers) {
    let score = 20; // baseline for verified pro
    const reasons: string[] = ["Identity Verified Professional"];

    // 1. Category match (up to 25 pts)
    if (category && category !== "All") {
      if (wp.category.toLowerCase().includes(category.toLowerCase())) {
        score += 25;
        reasons.push(`Specializes in ${wp.category}`);
      }
    } else {
      score += 10;
    }

    // 2. Keyword relevancy in skills & bio (up to 20 pts)
    const allWorkerText = `${wp.bio || ""} ${(wp.skills || []).join(" ")} ${wp.services.map((s) => s.title).join(" ")}`.toLowerCase();
    const matchingTokens = searchTokens.filter((token) => allWorkerText.includes(token));
    if (matchingTokens.length > 0) {
      const keywordScore = Math.min(20, matchingTokens.length * 7);
      score += keywordScore;
      reasons.push(`Matches your job description keywords (${matchingTokens.slice(0, 2).join(", ")})`);
    }

    // 3. Location match (up to 20 pts)
    if (location && location.trim()) {
      const locTerm = location.trim().toLowerCase();
      const areaMatch =
        (wp.serviceArea && wp.serviceArea.toLowerCase().includes(locTerm)) ||
        (wp.user.location && wp.user.location.toLowerCase().includes(locTerm));
      if (areaMatch) {
        score += 20;
        reasons.push(`Covers your service area (${location})`);
      }
    }

    // 4. Budget fit (up to 15 pts)
    if (maxBudget && maxBudget > 0) {
      if (wp.startingPrice <= maxBudget) {
        score += 15;
        reasons.push(`Within your budget ($${wp.startingPrice} starting price)`);
      } else if (wp.startingPrice <= maxBudget * 1.2) {
        score += 8;
        reasons.push("Close to your budget range");
      }
    } else {
      score += 10;
    }

    // 5. Reputation & Ratings (up to 10 pts)
    if (wp.rating >= 4.8) {
      score += 10;
      reasons.push(`Top Rated (${wp.rating.toFixed(1)} ★ with ${wp.reviewCount} verified reviews)`);
    } else if (wp.rating >= 4.0) {
      score += 5;
    }

    // 6. Urgency response time boost
    if (urgency === "EMERGENCY" && wp.responseTime.toLowerCase().includes("30 min")) {
      score += 5;
      reasons.push("Emergency response ready (< 30 min)");
    }

    // Cap at 99% match
    const finalScore = Math.min(99, Math.max(35, Math.round(score)));

    results.push({
      worker: {
        id: wp.userId,
        slug: wp.slug,
        name: wp.user.name,
        avatarUrl: wp.user.avatarUrl,
        category: wp.category,
        skills: wp.skills,
        bio: wp.bio,
        serviceArea: wp.serviceArea,
        startingPrice: wp.startingPrice,
        hourlyRate: wp.hourlyRate,
        rating: wp.rating,
        reviewCount: wp.reviewCount,
        isVerified: wp.isVerified,
        services: wp.services,
      },
      matchScore: finalScore,
      matchReasons: reasons,
    });
  }

  // Sort by highest match score
  results.sort((a, b) => b.matchScore - a.matchScore);

  return results;
}
