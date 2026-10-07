import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const fullProfile = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        workerProfile: {
          include: {
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
    } = body;

    // Update base user
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(phone !== undefined && { phone }),
        ...(location !== undefined && { location }),
        ...(avatarUrl !== undefined && { avatarUrl }),
      },
    });

    // If worker, update worker profile
    if (user.role === "WORKER") {
      await prisma.workerProfile.upsert({
        where: { userId: user.id },
        update: {
          ...(bio !== undefined && { bio }),
          ...(category && { category }),
          ...(skills && Array.isArray(skills) && { skills }),
          ...(hourlyRate !== undefined && { hourlyRate: parseFloat(hourlyRate) }),
          ...(startingPrice !== undefined && { startingPrice: parseFloat(startingPrice) }),
          ...(experienceYears !== undefined && { experienceYears: parseInt(experienceYears) }),
          ...(serviceArea !== undefined && { serviceArea }),
          ...(responseTime !== undefined && { responseTime }),
          ...(isAvailable !== undefined && { isAvailable: Boolean(isAvailable) }),
          ...(portfolioImages && Array.isArray(portfolioImages) && { portfolioImages }),
        },
        create: {
          userId: user.id,
          slug: `${user.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Math.floor(1000 + Math.random() * 9000)}`,
          category: category || "Home Services",
          skills: skills || [],
          hourlyRate: hourlyRate ? parseFloat(hourlyRate) : 50,
          startingPrice: startingPrice ? parseFloat(startingPrice) : 50,
          experienceYears: experienceYears ? parseInt(experienceYears) : 1,
          serviceArea: serviceArea || "Metro Area",
          bio: bio || "",
        },
      });
    }

    // If client, update client profile
    if (user.role === "CLIENT") {
      await prisma.clientProfile.upsert({
        where: { userId: user.id },
        update: {
          ...(phone !== undefined && { phone }),
          ...(location !== undefined && { location }),
          ...(avatarUrl !== undefined && { avatarUrl }),
        },
        create: {
          userId: user.id,
          phone: phone || null,
          location: location || null,
          avatarUrl: avatarUrl || null,
        },
      });
    }

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error("Update profile error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
