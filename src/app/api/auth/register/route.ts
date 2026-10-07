import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { hashPassword, signSession, setSessionCookie } from "@/lib/auth";
import { registerSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const parsed = registerSchema.safeParse(rawBody);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Invalid input";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { name, email, password, role, phone, location } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    const [existingUser] = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.email, normalizedEmail))
      .limit(1);

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email address already exists." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);
    const userRole = role === "WORKER" ? "WORKER" : "CLIENT";

    const [newUser] = await db
      .insert(schema.users)
      .values({
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: userRole,
        phone: phone || null,
        location: location || null,
      })
      .returning({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        role: schema.users.role,
        phone: schema.users.phone,
        location: schema.users.location,
        avatarUrl: schema.users.avatarUrl,
      });

    if (userRole === "CLIENT") {
      await db.insert(schema.clientProfiles).values({
        userId: newUser.id,
        phone: phone || null,
        location: location || null,
      });
    } else {
      const slugBase = name.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 30);
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      await db.insert(schema.workerProfiles).values({
        userId: newUser.id,
        slug: `${slugBase}-${randomSuffix}`,
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
        isPublished: false, // Must be completed before appearing in directory
      });
    }

    const token = await signSession(newUser);
    setSessionCookie(token);

    return NextResponse.json({ success: true, user: newUser });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create account. Please try again later." },
      { status: 500 }
    );
  }
}
