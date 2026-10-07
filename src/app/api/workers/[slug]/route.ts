import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params;

    const worker = await prisma.workerProfile.findUnique({
      where: { slug },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
            location: true,
            createdAt: true,
          },
        },
        services: {
          where: { isActive: true },
          orderBy: { price: "asc" },
        },
        availability: true,
      },
    });

    if (!worker) {
      return NextResponse.json({ error: "Worker profile not found" }, { status: 404 });
    }

    // Fetch reviews for this worker
    const reviews = await prisma.review.findMany({
      where: { workerId: worker.userId },
      orderBy: { createdAt: "desc" },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        booking: {
          select: {
            service: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    });

    // Similar workers in same category
    const similarWorkers = await prisma.workerProfile.findMany({
      where: {
        category: worker.category,
        id: { not: worker.id },
        isPublished: true,
      },
      take: 3,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json({
      worker,
      reviews,
      similarWorkers,
    });
  } catch (error: any) {
    console.error("Worker detail fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch worker details" }, { status: 500 });
  }
}
