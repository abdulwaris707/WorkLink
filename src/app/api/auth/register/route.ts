import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signSession, setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, role, phone, location } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const userRole = role === "WORKER" ? "WORKER" : "CLIENT";

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: userRole,
        phone: phone || null,
        location: location || null,
        ...(userRole === "CLIENT"
          ? {
              clientProfile: {
                create: {
                  phone: phone || null,
                  location: location || null,
                },
              },
            }
          : {
              workerProfile: {
                create: {
                  slug: `${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Math.floor(1000 + Math.random() * 9000)}`,
                  category: "Home Services",
                  skills: ["General Service"],
                  hourlyRate: 50,
                  startingPrice: 50,
                  experienceYears: 1,
                  serviceArea: location || "Metro Area",
                  isAvailable: true,
                  isVerified: false,
                  rating: 5.0,
                  reviewCount: 0,
                  portfolioImages: [],
                },
              },
            }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        location: true,
        avatarUrl: true,
      },
    });

    // Create session
    const token = await signSession(user);
    setSessionCookie(token);

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Failed to create account. Please try again." }, { status: 500 });
  }
}
