import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["CLIENT", "WORKER"]).default("CLIENT"),
  phone: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const createBookingSchema = z.object({
  workerId: z.string().uuid("Invalid worker ID"),
  serviceId: z.string().uuid("Invalid service ID"),
  bookingDate: z.string().min(1, "Booking date is required"),
  timeSlot: z.string().min(1, "Time slot is required"),
  requestDetails: z.string().min(5, "Please provide more job details (at least 5 characters)"),
});

export const updateBookingStatusSchema = z.object({
  status: z
    .enum(["PENDING", "ACCEPTED", "DECLINED", "IN_PROGRESS", "COMPLETED", "CANCELLED"])
    .optional(),
  notes: z.string().optional(),
  timeSlot: z.string().optional(),
  bookingDate: z.string().optional(),
});

export const createServiceSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(150),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(2, "Category is required"),
  price: z.coerce.number().positive("Price must be greater than 0"),
  durationMinutes: z.coerce.number().int().min(15).default(60),
  serviceArea: z.string().optional(),
});

export const updateServiceSchema = createServiceSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty").max(2000),
});

export const paymentSchema = z.object({
  bookingId: z.string().uuid("Invalid booking ID"),
  cardNumber: z.string().min(12, "Invalid card number"),
  cardExpiry: z.string().min(4, "Invalid card expiration"),
  cardCvc: z.string().min(3, "Invalid card CVC"),
});

export const createReviewSchema = z.object({
  bookingId: z.string().uuid("Invalid booking ID"),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().min(5, "Comment must be at least 5 characters").max(2000),
});

export const reviewResponseSchema = z.object({
  reviewId: z.string().uuid("Invalid review ID"),
  response: z.string().min(2, "Response must be at least 2 characters").max(1000),
});

export const processPaymentSchema = z.object({
  bookingId: z.string().uuid("Invalid booking ID"),
  cardNumber: z.string().min(12, "Invalid card number"),
  cardExpiry: z.string().optional(),
  cardCvc: z.string().optional(),
});

export const createConversationSchema = z.object({
  targetUserId: z.string().uuid("Invalid target user ID"),
  bookingId: z.string().uuid("Invalid booking ID").optional().nullable(),
  initialMessage: z.string().max(2000).optional(),
});

export const updateAvailabilitySchema = z.object({
  isAvailable: z.boolean().optional(),
  slots: z
    .array(
      z.object({
        dayOfWeek: z.number().int().min(0).max(6).optional().nullable(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        isBlocked: z.boolean().optional(),
        blockedDate: z.string().optional().nullable(),
      })
    )
    .optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  avatarUrl: z.string().url().optional().or(z.literal("")).nullable(),
  bio: z.string().optional(),
  category: z.string().optional(),
  skills: z.array(z.string()).optional(),
  hourlyRate: z.coerce.number().positive().optional(),
  startingPrice: z.coerce.number().positive().optional(),
  experienceYears: z.coerce.number().int().nonnegative().optional(),
  serviceArea: z.string().optional(),
  responseTime: z.string().optional(),
  isAvailable: z.boolean().optional(),
  portfolioImages: z.array(z.string()).optional(),
});
