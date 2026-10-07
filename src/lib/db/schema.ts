import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  doublePrecision,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const roleEnum = pgEnum("role", ["CLIENT", "WORKER", "ADMIN"]);

export const bookingStatusEnum = pgEnum("booking_status", [
  "PENDING",
  "ACCEPTED",
  "DECLINED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
]);

export const verificationStatusEnum = pgEnum("verification_status", [
  "not_started",
  "submitted",
  "under_review",
  "approved",
  "rejected",
  "needs_resubmission",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "BOOKING_REQUEST",
  "BOOKING_ACCEPTED",
  "BOOKING_DECLINED",
  "BOOKING_COMPLETED",
  "NEW_MESSAGE",
  "PAYMENT_UPDATE",
  "REVIEW_RECEIVED",
  "REMINDER",
  "VERIFICATION_UPDATE",
  "BOOKING_RESCHEDULED",
  "BOOKING_CANCELLED",
  "BOOKING_IN_PROGRESS",
]);

// 1. Users table
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    role: roleEnum("role").default("CLIENT").notNull(),
    phone: varchar("phone", { length: 50 }),
    location: varchar("location", { length: 255 }),
    avatarUrl: text("avatar_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: index("users_email_idx").on(table.email),
    roleIdx: index("users_role_idx").on(table.role),
  })
);

// 2. Client profiles table
export const clientProfiles = pgTable(
  "client_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    phone: varchar("phone", { length: 50 }),
    location: varchar("location", { length: 255 }),
    avatarUrl: text("avatar_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("client_profiles_user_id_idx").on(table.userId),
  })
);

// 3. Worker profiles table
export const workerProfiles = pgTable(
  "worker_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    bio: text("bio"),
    category: varchar("category", { length: 100 }).notNull(),
    skills: jsonb("skills").$type<string[]>().default([]).notNull(),
    hourlyRate: doublePrecision("hourly_rate").default(45).notNull(),
    startingPrice: doublePrecision("starting_price").default(50).notNull(),
    experienceYears: integer("experience_years").default(3).notNull(),
    serviceArea: varchar("service_area", { length: 255 }).default("Metro Area").notNull(),
    responseTime: varchar("response_time", { length: 100 }).default("Within 1 hour").notNull(),
    isAvailable: boolean("is_available").default(true).notNull(),
    isVerified: boolean("is_verified").default(false).notNull(),
    verificationStatus: verificationStatusEnum("verification_status").default("not_started").notNull(),
    cnicMasked: varchar("cnic_masked", { length: 30 }),
    cnicFrontKey: text("cnic_front_key"),
    cnicBackKey: text("cnic_back_key"),
    rejectionReason: text("rejection_reason"),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    verifiedBy: uuid("verified_by").references(() => users.id, { onDelete: "set null" }),
    rating: doublePrecision("rating").default(5.0).notNull(),
    reviewCount: integer("review_count").default(0).notNull(),
    portfolioImages: jsonb("portfolio_images").$type<string[]>().default([]).notNull(),
    isPublished: boolean("is_published").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("worker_profiles_user_id_idx").on(table.userId),
    slugIdx: uniqueIndex("worker_profiles_slug_idx").on(table.slug),
    categoryIdx: index("worker_profiles_category_idx").on(table.category),
    publishedIdx: index("worker_profiles_published_idx").on(table.isPublished),
    verificationIdx: index("worker_profiles_verification_idx").on(table.verificationStatus),
    ratingIdx: index("worker_profiles_rating_idx").on(table.rating),
  })
);

// 3.5. Verification activity audit trail
export const verificationActivity = pgTable(
  "verification_activity",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workerProfileId: uuid("worker_profile_id")
      .notNull()
      .references(() => workerProfiles.id, { onDelete: "cascade" }),
    actorId: uuid("actor_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    action: varchar("action", { length: 50 }).notNull(), // SUBMITTED, APPROVED, REJECTED, RESUBMISSION_REQUESTED
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    workerProfileIdIdx: index("verification_activity_worker_id_idx").on(table.workerProfileId),
  })
);

// 4. Services table
export const services = pgTable(
  "services",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workerProfileId: uuid("worker_profile_id")
      .notNull()
      .references(() => workerProfiles.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),
    category: varchar("category", { length: 100 }).notNull(),
    durationMinutes: integer("duration_minutes").default(60).notNull(),
    price: doublePrecision("price").notNull(),
    serviceArea: varchar("service_area", { length: 255 }),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    workerProfileIdIdx: index("services_worker_profile_id_idx").on(table.workerProfileId),
    categoryIdx: index("services_category_idx").on(table.category),
  })
);

// 5. Availability table
export const availability = pgTable(
  "availability",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workerProfileId: uuid("worker_profile_id")
      .notNull()
      .references(() => workerProfiles.id, { onDelete: "cascade" }),
    dayOfWeek: integer("day_of_week"), // 0 = Sunday, 1 = Monday, etc.
    startTime: varchar("start_time", { length: 20 }).default("09:00").notNull(),
    endTime: varchar("end_time", { length: 20 }).default("17:00").notNull(),
    isBlocked: boolean("is_blocked").default(false).notNull(),
    blockedDate: timestamp("blocked_date", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    workerProfileIdIdx: index("availability_worker_profile_id_idx").on(table.workerProfileId),
  })
);

// 6. Bookings table
export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    workerId: uuid("worker_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "cascade" }),
    bookingDate: timestamp("booking_date", { withTimezone: true }).notNull(),
    timeSlot: varchar("time_slot", { length: 100 }).notNull(),
    requestDetails: text("request_details").notNull(),
    quotedPrice: doublePrecision("quoted_price").notNull(),
    status: bookingStatusEnum("status").default("PENDING").notNull(),
    paymentStatus: paymentStatusEnum("payment_status").default("PENDING").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    clientIdIdx: index("bookings_client_id_idx").on(table.clientId),
    workerIdIdx: index("bookings_worker_id_idx").on(table.workerId),
    bookingDateIdx: index("bookings_date_idx").on(table.bookingDate),
    statusIdx: index("bookings_status_idx").on(table.status),
  })
);

// 7. Booking activity audit trail
export const bookingActivity = pgTable(
  "booking_activity",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    actorId: uuid("actor_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    action: varchar("action", { length: 100 }).notNull(),
    details: text("details"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    bookingIdIdx: index("booking_activity_booking_id_idx").on(table.bookingId),
  })
);

// 8. Conversations table
export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    workerId: uuid("worker_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    bookingId: uuid("booking_id").references(() => bookings.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    clientIdIdx: index("conversations_client_id_idx").on(table.clientId),
    workerIdIdx: index("conversations_worker_id_idx").on(table.workerId),
    clientWorkerUnique: uniqueIndex("conversations_client_worker_unique").on(
      table.clientId,
      table.workerId
    ),
  })
);

// 9. Messages table
export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    isRead: boolean("is_read").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    conversationIdIdx: index("messages_conversation_id_idx").on(table.conversationId),
    createdAtIdx: index("messages_created_at_idx").on(table.createdAt),
  })
);

// 10. Payments table
export const payments = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookingId: uuid("booking_id")
      .notNull()
      .unique()
      .references(() => bookings.id, { onDelete: "cascade" }),
    clientId: uuid("client_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    workerId: uuid("worker_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    amount: doublePrecision("amount").notNull(),
    currency: varchar("currency", { length: 10 }).default("USD").notNull(),
    provider: varchar("provider", { length: 50 }).default("stripe_test").notNull(),
    providerPaymentId: varchar("provider_payment_id", { length: 255 }),
    status: paymentStatusEnum("status").default("PENDING").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    bookingIdIdx: uniqueIndex("payments_booking_id_idx").on(table.bookingId),
    clientIdIdx: index("payments_client_id_idx").on(table.clientId),
    workerIdIdx: index("payments_worker_id_idx").on(table.workerId),
  })
);

// 11. Reviews table
export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookingId: uuid("booking_id")
      .notNull()
      .unique()
      .references(() => bookings.id, { onDelete: "cascade" }),
    clientId: uuid("client_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    workerId: uuid("worker_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    comment: text("comment").notNull(),
    workerResponse: text("worker_response"),
    isVerified: boolean("is_verified").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    bookingIdIdx: uniqueIndex("reviews_booking_id_idx").on(table.bookingId),
    workerIdIdx: index("reviews_worker_id_idx").on(table.workerId),
    ratingIdx: index("reviews_rating_idx").on(table.rating),
  })
);

// 12. Notifications table
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),
    type: notificationTypeEnum("type").notNull(),
    link: varchar("link", { length: 255 }),
    isRead: boolean("is_read").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("notifications_user_id_idx").on(table.userId),
    isReadIdx: index("notifications_is_read_idx").on(table.isRead),
  })
);

// Drizzle Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  clientProfile: one(clientProfiles, {
    fields: [users.id],
    references: [clientProfiles.userId],
  }),
  workerProfile: one(workerProfiles, {
    fields: [users.id],
    references: [workerProfiles.userId],
  }),
  clientBookings: many(bookings, { relationName: "clientBookings" }),
  workerBookings: many(bookings, { relationName: "workerBookings" }),
  sentMessages: many(messages),
  clientConversations: many(conversations, { relationName: "clientConversations" }),
  workerConversations: many(conversations, { relationName: "workerConversations" }),
  clientPayments: many(payments, { relationName: "clientPayments" }),
  workerPayments: many(payments, { relationName: "workerPayments" }),
  clientReviews: many(reviews, { relationName: "clientReviews" }),
  workerReviews: many(reviews, { relationName: "workerReviews" }),
  notifications: many(notifications),
}));

export const clientProfilesRelations = relations(clientProfiles, ({ one }) => ({
  user: one(users, {
    fields: [clientProfiles.userId],
    references: [users.id],
  }),
}));

export const workerProfilesRelations = relations(workerProfiles, ({ one, many }) => ({
  user: one(users, {
    fields: [workerProfiles.userId],
    references: [users.id],
  }),
  services: many(services),
  availability: many(availability),
  verificationActivities: many(verificationActivity),
}));

export const verificationActivityRelations = relations(verificationActivity, ({ one }) => ({
  workerProfile: one(workerProfiles, {
    fields: [verificationActivity.workerProfileId],
    references: [workerProfiles.id],
  }),
  actor: one(users, {
    fields: [verificationActivity.actorId],
    references: [users.id],
  }),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  workerProfile: one(workerProfiles, {
    fields: [services.workerProfileId],
    references: [workerProfiles.id],
  }),
  bookings: many(bookings),
}));

export const availabilityRelations = relations(availability, ({ one }) => ({
  workerProfile: one(workerProfiles, {
    fields: [availability.workerProfileId],
    references: [workerProfiles.id],
  }),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  client: one(users, {
    fields: [bookings.clientId],
    references: [users.id],
    relationName: "clientBookings",
  }),
  worker: one(users, {
    fields: [bookings.workerId],
    references: [users.id],
    relationName: "workerBookings",
  }),
  service: one(services, {
    fields: [bookings.serviceId],
    references: [services.id],
  }),
  payment: one(payments, {
    fields: [bookings.id],
    references: [payments.bookingId],
  }),
  review: one(reviews, {
    fields: [bookings.id],
    references: [reviews.bookingId],
  }),
  conversation: one(conversations, {
    fields: [bookings.id],
    references: [conversations.bookingId],
  }),
  activities: many(bookingActivity),
}));

export const bookingActivityRelations = relations(bookingActivity, ({ one }) => ({
  booking: one(bookings, {
    fields: [bookingActivity.bookingId],
    references: [bookings.id],
  }),
  actor: one(users, {
    fields: [bookingActivity.actorId],
    references: [users.id],
  }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  client: one(users, {
    fields: [conversations.clientId],
    references: [users.id],
    relationName: "clientConversations",
  }),
  worker: one(users, {
    fields: [conversations.workerId],
    references: [users.id],
    relationName: "workerConversations",
  }),
  booking: one(bookings, {
    fields: [conversations.bookingId],
    references: [bookings.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  booking: one(bookings, {
    fields: [payments.bookingId],
    references: [bookings.id],
  }),
  client: one(users, {
    fields: [payments.clientId],
    references: [users.id],
    relationName: "clientPayments",
  }),
  worker: one(users, {
    fields: [payments.workerId],
    references: [users.id],
    relationName: "workerPayments",
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  booking: one(bookings, {
    fields: [reviews.bookingId],
    references: [bookings.id],
  }),
  client: one(users, {
    fields: [reviews.clientId],
    references: [users.id],
    relationName: "clientReviews",
  }),
  worker: one(users, {
    fields: [reviews.workerId],
    references: [users.id],
    relationName: "workerReviews",
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));
