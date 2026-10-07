import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, and, gte, lte, ilike, or, desc, asc, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const category = searchParams.get("category") || "";
    const location = searchParams.get("location")?.trim() || "";
    const minPrice = searchParams.get("minPrice") ? parseFloat(searchParams.get("minPrice")!) : undefined;
    const maxPrice = searchParams.get("maxPrice") ? parseFloat(searchParams.get("maxPrice")!) : undefined;
    const minRating = searchParams.get("minRating") ? parseFloat(searchParams.get("minRating")!) : undefined;
    const verifiedOnly = searchParams.get("verified") === "true";
    const sort = searchParams.get("sort") || "recommended";

    const conditions = [
      eq(schema.workerProfiles.isPublished, true),
      eq(schema.users.role, "WORKER"),
    ];

    if (category && category !== "All") {
      conditions.push(ilike(schema.workerProfiles.category, `%${category}%`));
    }

    if (verifiedOnly) {
      conditions.push(eq(schema.workerProfiles.isVerified, true));
    }

    if (minRating) {
      conditions.push(gte(schema.workerProfiles.rating, minRating));
    }

    if (minPrice !== undefined) {
      conditions.push(gte(schema.workerProfiles.startingPrice, minPrice));
    }
    if (maxPrice !== undefined) {
      conditions.push(lte(schema.workerProfiles.startingPrice, maxPrice));
    }

    if (location) {
      conditions.push(
        or(
          ilike(schema.workerProfiles.serviceArea, `%${location}%`),
          ilike(schema.users.location, `%${location}%`)
        )!
      );
    }

    if (search) {
      conditions.push(
        or(
          ilike(schema.users.name, `%${search}%`),
          ilike(schema.workerProfiles.bio, `%${search}%`),
          ilike(schema.workerProfiles.category, `%${search}%`),
          sql`${schema.workerProfiles.skills}::text ILIKE ${`%${search}%`}`
        )!
      );
    }

    let orderByClause: any = desc(schema.workerProfiles.rating);
    if (sort === "highest_rated") {
      orderByClause = desc(schema.workerProfiles.rating);
    } else if (sort === "lowest_price") {
      orderByClause = asc(schema.workerProfiles.startingPrice);
    } else if (sort === "newest") {
      orderByClause = desc(schema.workerProfiles.createdAt);
    }

    const profiles = await db
      .select({
        id: schema.workerProfiles.id,
        userId: schema.workerProfiles.userId,
        slug: schema.workerProfiles.slug,
        bio: schema.workerProfiles.bio,
        category: schema.workerProfiles.category,
        skills: schema.workerProfiles.skills,
        hourlyRate: schema.workerProfiles.hourlyRate,
        startingPrice: schema.workerProfiles.startingPrice,
        experienceYears: schema.workerProfiles.experienceYears,
        serviceArea: schema.workerProfiles.serviceArea,
        responseTime: schema.workerProfiles.responseTime,
        isAvailable: schema.workerProfiles.isAvailable,
        isVerified: schema.workerProfiles.isVerified,
        rating: schema.workerProfiles.rating,
        reviewCount: schema.workerProfiles.reviewCount,
        portfolioImages: schema.workerProfiles.portfolioImages,
        user: {
          id: schema.users.id,
          name: schema.users.name,
          email: schema.users.email,
          avatarUrl: schema.users.avatarUrl,
          location: schema.users.location,
        },
      })
      .from(schema.workerProfiles)
      .innerJoin(schema.users, eq(schema.workerProfiles.userId, schema.users.id))
      .where(and(...conditions))
      .orderBy(orderByClause);

    // Attach active services for each worker profile
    const workersWithServices = await Promise.all(
      profiles.map(async (worker) => {
        const workerServices = await db
          .select({
            id: schema.services.id,
            title: schema.services.title,
            price: schema.services.price,
            durationMinutes: schema.services.durationMinutes,
            category: schema.services.category,
          })
          .from(schema.services)
          .where(
            and(
              eq(schema.services.workerProfileId, worker.id),
              eq(schema.services.isActive, true)
            )
          );

        return {
          ...worker,
          services: workerServices,
        };
      })
    );

    return NextResponse.json({ workers: workersWithServices });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch workers" }, { status: 500 });
  }
}
