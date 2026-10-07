import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const location = searchParams.get("location") || "";
    const minPrice = searchParams.get("minPrice") ? parseFloat(searchParams.get("minPrice")!) : undefined;
    const maxPrice = searchParams.get("maxPrice") ? parseFloat(searchParams.get("maxPrice")!) : undefined;
    const minRating = searchParams.get("minRating") ? parseFloat(searchParams.get("minRating")!) : undefined;
    const verifiedOnly = searchParams.get("verified") === "true";
    const sort = searchParams.get("sort") || "recommended";

    const where: any = {
      isPublished: true,
      user: {
        role: "WORKER",
      },
    };

    if (category && category !== "All") {
      where.category = { equals: category, mode: "insensitive" };
    }

    if (verifiedOnly) {
      where.isVerified = true;
    }

    if (minRating) {
      where.rating = { gte: minRating };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.startingPrice = {};
      if (minPrice !== undefined) where.startingPrice.gte = minPrice;
      if (maxPrice !== undefined) where.startingPrice.lte = maxPrice;
    }

    if (location) {
      where.OR = [
        { serviceArea: { contains: location, mode: "insensitive" } },
        { user: { location: { contains: location, mode: "insensitive" } } },
      ];
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { user: { name: { contains: search, mode: "insensitive" } } },
            { bio: { contains: search, mode: "insensitive" } },
            { category: { contains: search, mode: "insensitive" } },
            { skills: { hasSome: [search] } },
            { services: { some: { title: { contains: search, mode: "insensitive" } } } },
          ],
        },
      ];
    }

    let orderBy: any = {};
    if (sort === "highest_rated") {
      orderBy = { rating: "desc" };
    } else if (sort === "lowest_price") {
      orderBy = { startingPrice: "asc" };
    } else if (sort === "newest") {
      orderBy = { createdAt: "desc" };
    } else {
      // Recommended: high rating & review count
      orderBy = [{ rating: "desc" }, { reviewCount: "desc" }];
    }

    const workers = await prisma.workerProfile.findMany({
      where,
      orderBy,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            location: true,
          },
        },
        services: {
          where: { isActive: true },
          select: {
            id: true,
            title: true,
            price: true,
            durationMinutes: true,
            category: true,
          },
        },
      },
    });

    return NextResponse.json({ workers });
  } catch (error: any) {
    console.error("Workers fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch workers" }, { status: 500 });
  }
}
