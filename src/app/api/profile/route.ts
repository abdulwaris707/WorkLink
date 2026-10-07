import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { updateProfileSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const fullProfile = await db.query.users.findFirst({
      where: eq(schema.users.id, user.id),
      with: {
        workerProfile: {
          with: {
            services: true,
            availability: true,
          },
        },
        clientProfile: true,
      },
    });

    return NextResponse.json({ profile: fullProfile });
  } catch (error: any) {
    console.error("Fetch profile error:", error);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid profile data", details: parsed.error.format() }, { status: 400 });
    }

    const {
      name,
      phone,
      location,
      avatarUrl,
      bio,
      category,
      skills,
      hourlyRate,
      startingPrice,
      experienceYears,
      serviceArea,
      responseTime,
      isAvailable,
      portfolioImages,
    } = parsed.data;

    // Update base user
    const userUpdateData: Partial<typeof schema.users.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (name) userUpdateData.name = name.trim();
    if (phone !== undefined) userUpdateData.phone = phone;
    if (location !== undefined) userUpdateData.location = location;
    if (avatarUrl !== undefined) userUpdateData.avatarUrl = avatarUrl;

    const [updatedUser] = await db
      .update(schema.users)
      .set(userUpdateData)
      .where(eq(schema.users.id, user.id))
      .returning();

    // If worker, upsert worker profile
    if (user.role === "WORKER") {
      const existingWorker = await db.query.workerProfiles.findFirst({
        where: eq(schema.workerProfiles.userId, user.id),
      });

      const effectiveBio = bio ?? existingWorker?.bio ?? "";
      const effectiveCategory = category ?? existingWorker?.category ?? "Home Services";
      const effectiveSkills = skills ?? existingWorker?.skills ?? [];
      const effectiveStartingPrice = startingPrice ?? existingWorker?.startingPrice ?? 50;

      // Rule: Worker only becomes visible in public directory when profile is complete
      const isProfileComplete = 
        Boolean(effectiveBio && effectiveBio.trim().length >= 10) &&
        Boolean(effectiveCategory) &&
        Boolean(effectiveSkills && effectiveSkills.length > 0) &&
        Boolean(effectiveStartingPrice > 0);

      if (existingWorker) {
        const workerUpdateData: Partial<typeof schema.workerProfiles.$inferInsert> = {
          updatedAt: new Date(),
          isPublished: isProfileComplete,
        };
        if (bio !== undefined) workerUpdateData.bio = bio;
        if (category !== undefined) workerUpdateData.category = category;
        if (skills !== undefined) workerUpdateData.skills = skills;
        if (hourlyRate !== undefined) workerUpdateData.hourlyRate = hourlyRate;
        if (startingPrice !== undefined) workerUpdateData.startingPrice = startingPrice;
        if (experienceYears !== undefined) workerUpdateData.experienceYears = experienceYears;
        if (serviceArea !== undefined) workerUpdateData.serviceArea = serviceArea;
        if (responseTime !== undefined) workerUpdateData.responseTime = responseTime;
        if (isAvailable !== undefined) workerUpdateData.isAvailable = isAvailable;
        if (portfolioImages !== undefined) workerUpdateData.portfolioImages = portfolioImages;

        await db
          .update(schema.workerProfiles)
          .set(workerUpdateData)
          .where(eq(schema.workerProfiles.id, existingWorker.id));
      } else {
        const baseSlug = (user.name || "worker").toLowerCase().replace(/[^a-z0-9]/g, "-");
        const uniqueSlug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;

        await db.insert(schema.workerProfiles).values({
          userId: user.id,
          slug: uniqueSlug,
          category: effectiveCategory,
          skills: effectiveSkills,
          hourlyRate: hourlyRate ?? 50,
          startingPrice: effectiveStartingPrice,
          experienceYears: experienceYears ?? 1,
          serviceArea: serviceArea ?? "Metro Area",
          bio: effectiveBio,
          isPublished: isProfileComplete,
        });
      }
    }

    // If client, upsert client profile
    if (user.role === "CLIENT") {
      const existingClient = await db.query.clientProfiles.findFirst({
        where: eq(schema.clientProfiles.userId, user.id),
      });

      if (existingClient) {
        await db
          .update(schema.clientProfiles)
          .set({
            phone: phone !== undefined ? phone : existingClient.phone,
            location: location !== undefined ? location : existingClient.location,
            avatarUrl: avatarUrl !== undefined ? avatarUrl : existingClient.avatarUrl,
            updatedAt: new Date(),
          })
          .where(eq(schema.clientProfiles.id, existingClient.id));
      } else {
        await db.insert(schema.clientProfiles).values({
          userId: user.id,
          phone: phone || null,
          location: location || null,
          avatarUrl: avatarUrl || null,
        });
      }
    }

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error("Update profile error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
