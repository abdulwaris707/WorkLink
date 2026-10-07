import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, and, ne, desc } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params;

    const [worker] = await db
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
          phone: schema.users.phone,
          avatarUrl: schema.users.avatarUrl,
          location: schema.users.location,
          createdAt: schema.users.createdAt,
        },
      })
      .from(schema.workerProfiles)
      .innerJoin(schema.users, eq(schema.workerProfiles.userId, schema.users.id))
      .where(eq(schema.workerProfiles.slug, slug))
      .limit(1);

    if (!worker) {
      return NextResponse.json({ error: "Worker profile not found" }, { status: 404 });
    }

    // Active services
    const servicesList = await db
      .select()
      .from(schema.services)
      .where(
        and(
          eq(schema.services.workerProfileId, worker.id),
          eq(schema.services.isActive, true)
        )
      );

    // Availability
    const availabilityList = await db
      .select()
      .from(schema.availability)
      .where(eq(schema.availability.workerProfileId, worker.id));

    // Reviews for this worker
    const rawReviews = await db
      .select({
        id: schema.reviews.id,
        rating: schema.reviews.rating,
        comment: schema.reviews.comment,
        workerResponse: schema.reviews.workerResponse,
        isVerified: schema.reviews.isVerified,
        createdAt: schema.reviews.createdAt,
        client: {
          id: schema.users.id,
          name: schema.users.name,
          avatarUrl: schema.users.avatarUrl,
        },
        booking: {
          serviceId: schema.bookings.serviceId,
        },
      })
      .from(schema.reviews)
      .innerJoin(schema.users, eq(schema.reviews.clientId, schema.users.id))
      .innerJoin(schema.bookings, eq(schema.reviews.bookingId, schema.bookings.id))
      .where(eq(schema.reviews.workerId, worker.userId))
      .orderBy(desc(schema.reviews.createdAt));

    // Similar workers in same category
    const similarWorkers = await db
      .select({
        id: schema.workerProfiles.id,
        slug: schema.workerProfiles.slug,
        category: schema.workerProfiles.category,
        startingPrice: schema.workerProfiles.startingPrice,
        user: {
          id: schema.users.id,
          name: schema.users.name,
          avatarUrl: schema.users.avatarUrl,
        },
      })
      .from(schema.workerProfiles)
      .innerJoin(schema.users, eq(schema.workerProfiles.userId, schema.users.id))
      .where(
        and(
          eq(schema.workerProfiles.category, worker.category),
          ne(schema.workerProfiles.id, worker.id),
          eq(schema.workerProfiles.isPublished, true)
        )
      )
      .limit(3);

    return NextResponse.json({
      worker: {
        ...worker,
        services: servicesList,
        availability: availabilityList,
      },
      reviews: rawReviews,
      similarWorkers,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch worker details" }, { status: 500 });
  }
}
