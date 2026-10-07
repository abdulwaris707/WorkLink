import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import bcrypt from "bcryptjs";
import * as schema from "../src/lib/db/schema";
import { eq } from "drizzle-orm";

async function runSeed() {
  if (process.env.NODE_ENV === "production" && !process.env.ALLOW_PROD_SEED) {
    console.error("Safety warning: Seed script should never run automatically in production!");
    process.exit(1);
  }

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL is required to seed database.");
    process.exit(1);
  }

  console.log("Seeding WorkLink database via Neon Drizzle...");
  const sql = neon(dbUrl);
  const db = drizzle(sql, { schema });

  // Clear existing records safely
  await db.delete(schema.notifications);
  await db.delete(schema.reviews);
  await db.delete(schema.payments);
  await db.delete(schema.messages);
  await db.delete(schema.conversations);
  await db.delete(schema.bookingActivity);
  await db.delete(schema.bookings);
  await db.delete(schema.availability);
  await db.delete(schema.services);
  await db.delete(schema.workerProfiles);
  await db.delete(schema.clientProfiles);
  await db.delete(schema.users);

  const passwordHash = await bcrypt.hash("password123", 10);

  // 0. Demo Admin: Moderator
  await db.insert(schema.users).values({
    email: "admin@worklink.com",
    passwordHash,
    name: "Admin Moderator",
    role: "ADMIN",
    phone: "+1 (555) 000-1111",
    location: "Operations HQ",
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80",
  });

  // 1. Demo Client: Jessica Reynolds
  const [clientUser] = await db
    .insert(schema.users)
    .values({
      email: "client@worklink.com",
      passwordHash,
      name: "Jessica Reynolds",
      role: "CLIENT",
      phone: "+1 (555) 234-5678",
      location: "Downtown Seattle, WA",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80",
    })
    .returning();

  await db.insert(schema.clientProfiles).values({
    userId: clientUser.id,
    phone: "+1 (555) 234-5678",
    location: "Downtown Seattle, WA",
    avatarUrl: clientUser.avatarUrl,
  });

  // 2. Demo Worker 1: Marcus Vance (Electrician)
  const [worker1User] = await db
    .insert(schema.users)
    .values({
      email: "marcus@worklink.com",
      passwordHash,
      name: "Marcus Vance",
      role: "WORKER",
      phone: "+1 (555) 890-1234",
      location: "Greater Seattle Area, WA",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
    })
    .returning();

  const [worker1Profile] = await db
    .insert(schema.workerProfiles)
    .values({
      userId: worker1User.id,
      slug: "marcus-vance-electrician",
      bio: "Licensed master electrician with over 9 years of residential and commercial experience. Specializing in EV charger installs, smart home automation, panel upgrades, and certified emergency electrical repairs.",
      category: "Home Services",
      skills: ["EV Charger Install", "Circuit Breakers", "Panel Upgrades", "Smart Lighting", "Wiring Inspections"],
      hourlyRate: 75,
      startingPrice: 85,
      experienceYears: 9,
      serviceArea: "Seattle, Bellevue, Kirkland & Redmond",
      responseTime: "Under 30 mins",
      isAvailable: true,
      isVerified: true,
      verificationStatus: "approved",
      cnicMasked: "42101-*******-3",
      rating: 4.95,
      reviewCount: 38,
      portfolioImages: [
        "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1558441719-8b489c63f7d1?w=800&auto=format&fit=crop&q=80",
      ],
      isPublished: true,
    })
    .returning();

  // Services for Marcus
  const [service1, service2] = await db
    .insert(schema.services)
    .values([
      {
        workerProfileId: worker1Profile.id,
        title: "Electrical Diagnostic & Safety Inspection",
        description: "Full inspection of panels, grounding, GFCI outlets, and diagnostics for intermittent outages.",
        category: "Home Services",
        durationMinutes: 60,
        price: 85,
        serviceArea: "Greater Seattle Area",
        isActive: true,
      },
      {
        workerProfileId: worker1Profile.id,
        title: "Level 2 EV Charger Installation",
        description: "Dedicated 240V 50A breaker line installation, conduit running, and mounting of your EV charging station.",
        category: "Home Services",
        durationMinutes: 180,
        price: 320,
        serviceArea: "Greater Seattle Area",
        isActive: true,
      },
    ])
    .returning();

  // Marcus availability
  await db.insert(schema.availability).values([
    { workerProfileId: worker1Profile.id, dayOfWeek: 1, startTime: "08:00", endTime: "18:00", isBlocked: false },
    { workerProfileId: worker1Profile.id, dayOfWeek: 2, startTime: "08:00", endTime: "18:00", isBlocked: false },
    { workerProfileId: worker1Profile.id, dayOfWeek: 3, startTime: "08:00", endTime: "18:00", isBlocked: false },
    { workerProfileId: worker1Profile.id, dayOfWeek: 4, startTime: "08:00", endTime: "18:00", isBlocked: false },
    { workerProfileId: worker1Profile.id, dayOfWeek: 5, startTime: "08:00", endTime: "17:00", isBlocked: false },
  ]);

  // 3. Demo Worker 2: Elena Rostova (Cleaning Pro)
  const [worker2User] = await db
    .insert(schema.users)
    .values({
      email: "elena@worklink.com",
      passwordHash,
      name: "Elena Rostova",
      role: "WORKER",
      phone: "+1 (555) 765-4321",
      location: "Capitol Hill, Seattle",
      avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
    })
    .returning();

  const [worker2Profile] = await db
    .insert(schema.workerProfiles)
    .values({
      userId: worker2User.id,
      slug: "elena-rostova-cleaning",
      bio: "Eco-friendly deep cleaning expert. 6+ years keeping homes and apartments spotless using non-toxic child and pet safe products.",
      category: "Cleaning",
      skills: ["Deep Cleaning", "Move-in/Move-out", "Eco-friendly Supplies", "Kitchen Sanitization"],
      hourlyRate: 50,
      startingPrice: 95,
      experienceYears: 6,
      serviceArea: "Seattle Central & Northside",
      responseTime: "Under 1 hour",
      isAvailable: true,
      isVerified: true,
      verificationStatus: "approved",
      cnicMasked: "35202-*******-8",
      rating: 4.98,
      reviewCount: 52,
      portfolioImages: [
        "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&auto=format&fit=crop&q=80",
      ],
      isPublished: true,
    })
    .returning();

  const [elenaService] = await db
    .insert(schema.services)
    .values({
      workerProfileId: worker2Profile.id,
      title: "Standard Home Refresh (2-3 Bed)",
      description: "Dusting, vacuuming, mopping, bathroom sanitization, and kitchen counter degreasing.",
      category: "Cleaning",
      durationMinutes: 150,
      price: 140,
      serviceArea: "Seattle Central",
      isActive: true,
    })
    .returning();

  await db.insert(schema.availability).values([
    { workerProfileId: worker2Profile.id, dayOfWeek: 1, startTime: "09:00", endTime: "17:00", isBlocked: false },
    { workerProfileId: worker2Profile.id, dayOfWeek: 2, startTime: "09:00", endTime: "17:00", isBlocked: false },
    { workerProfileId: worker2Profile.id, dayOfWeek: 3, startTime: "09:00", endTime: "17:00", isBlocked: false },
  ]);

  // 4. Completed Booking with Payment & Review
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 4);

  const [completedBooking] = await db
    .insert(schema.bookings)
    .values({
      clientId: clientUser.id,
      workerId: worker1User.id,
      serviceId: service1.id,
      bookingDate: pastDate,
      timeSlot: "10:00 AM - 11:00 AM",
      requestDetails: "Kitchen GFCI outlets stopped responding. Need inspection and replacement.",
      quotedPrice: service1.price,
      status: "COMPLETED",
      paymentStatus: "PAID",
      notes: "Replaced faulty 20A GFCI receptacle safely.",
    })
    .returning();

  await db.insert(schema.bookingActivity).values([
    { bookingId: completedBooking.id, actorId: clientUser.id, action: "CREATED", details: "Booking requested" },
    { bookingId: completedBooking.id, actorId: worker1User.id, action: "ACCEPTED", details: "Worker accepted request" },
    { bookingId: completedBooking.id, actorId: worker1User.id, action: "COMPLETED", details: "Worker marked job complete" },
  ]);

  await db.insert(schema.payments).values({
    bookingId: completedBooking.id,
    clientId: clientUser.id,
    workerId: worker1User.id,
    amount: service1.price,
    currency: "USD",
    provider: "stripe_test",
    providerPaymentId: "ch_test_9923841029384",
    status: "PAID",
  });

  await db.insert(schema.reviews).values({
    bookingId: completedBooking.id,
    clientId: clientUser.id,
    workerId: worker1User.id,
    rating: 5,
    comment: "Marcus arrived right on time, diagnosed the faulty GFCI in 10 minutes and had everything working safely. Extremely professional!",
    workerResponse: "Thank you Jessica! Glad we got your kitchen power back safely.",
    isVerified: true,
  });

  // 5. Active Upcoming Booking
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 3);

  const [upcomingBooking] = await db
    .insert(schema.bookings)
    .values({
      clientId: clientUser.id,
      workerId: worker1User.id,
      serviceId: service2.id,
      bookingDate: futureDate,
      timeSlot: "02:00 PM - 05:00 PM",
      requestDetails: "Installing Tesla Wall Connector in our 2-car garage. 200A panel is nearby.",
      quotedPrice: service2.price,
      status: "ACCEPTED",
      paymentStatus: "PENDING",
      notes: "Customer confirmed panel clearance is ready.",
    })
    .returning();

  await db.insert(schema.bookingActivity).values([
    { bookingId: upcomingBooking.id, actorId: clientUser.id, action: "CREATED", details: "Booking requested" },
    { bookingId: upcomingBooking.id, actorId: worker1User.id, action: "ACCEPTED", details: "Worker accepted request" },
  ]);

  // 6. Conversation & Messages
  const [conv] = await db
    .insert(schema.conversations)
    .values({
      clientId: clientUser.id,
      workerId: worker1User.id,
      bookingId: upcomingBooking.id,
    })
    .returning();

  await db.insert(schema.messages).values([
    {
      conversationId: conv.id,
      senderId: clientUser.id,
      content: "Hi Marcus, looking forward to the EV charger install! Do I need to buy anything before you arrive?",
      isRead: true,
    },
    {
      conversationId: conv.id,
      senderId: worker1User.id,
      content: "Hi Jessica! No need to purchase anything. I carry standard 50A dual-pole breakers and heavy-gauge conduit in my truck. See you at 2:00 PM!",
      isRead: true,
    },
  ]);

  // 7. Notifications
  await db.insert(schema.notifications).values([
    {
      userId: clientUser.id,
      title: "Booking Accepted",
      message: `Marcus Vance accepted your EV Charger Installation request for ${futureDate.toLocaleDateString()}.`,
      type: "BOOKING_ACCEPTED",
      link: "/client/bookings",
      isRead: false,
    },
    {
      userId: worker1User.id,
      title: "New Booking Request",
      message: "Jessica Reynolds booked Level 2 EV Charger Installation.",
      type: "BOOKING_REQUEST",
      link: "/worker/bookings",
      isRead: true,
    },
  ]);

  console.log("Seeding finished successfully!");
  console.log("Demo Accounts:");
  console.log("Client: client@worklink.com / password123");
  console.log("Worker 1: marcus@worklink.com / password123");
  console.log("Worker 2: elena@worklink.com / password123");
}

runSeed().catch((e) => {
  console.error("Seeding error:", e);
  process.exit(1);
});
