export type UserRole = "CLIENT" | "WORKER" | "ADMIN";

export type BookingStatus =
  | "PENDING"
  | "ACCEPTED"
  | "DECLINED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export type NotificationType =
  | "BOOKING_REQUEST"
  | "BOOKING_ACCEPTED"
  | "BOOKING_DECLINED"
  | "BOOKING_COMPLETED"
  | "NEW_MESSAGE"
  | "PAYMENT_UPDATE"
  | "REVIEW_RECEIVED"
  | "REMINDER";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string | null;
  location?: string | null;
  avatarUrl?: string | null;
}

export interface WorkerProfileSummary {
  id: string;
  userId: string;
  slug: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  bio?: string | null;
  category: string;
  skills: string[];
  hourlyRate: number;
  startingPrice: number;
  experienceYears: number;
  serviceArea: string;
  responseTime: string;
  isAvailable: boolean;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  portfolioImages: string[];
}
