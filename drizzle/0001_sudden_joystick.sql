CREATE TYPE "public"."verification_status" AS ENUM('not_started', 'submitted', 'under_review', 'approved', 'rejected', 'needs_resubmission');--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'VERIFICATION_UPDATE';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'BOOKING_RESCHEDULED';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'BOOKING_CANCELLED';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'BOOKING_IN_PROGRESS';--> statement-breakpoint
CREATE TABLE "verification_activity" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"worker_profile_id" uuid NOT NULL,
	"actor_id" uuid NOT NULL,
	"action" varchar(50) NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "worker_profiles" ALTER COLUMN "is_verified" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "worker_profiles" ALTER COLUMN "is_published" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "worker_profiles" ADD COLUMN "verification_status" "verification_status" DEFAULT 'not_started' NOT NULL;--> statement-breakpoint
ALTER TABLE "worker_profiles" ADD COLUMN "cnic_masked" varchar(30);--> statement-breakpoint
ALTER TABLE "worker_profiles" ADD COLUMN "cnic_front_key" text;--> statement-breakpoint
ALTER TABLE "worker_profiles" ADD COLUMN "cnic_back_key" text;--> statement-breakpoint
ALTER TABLE "worker_profiles" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "worker_profiles" ADD COLUMN "verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "worker_profiles" ADD COLUMN "verified_by" uuid;--> statement-breakpoint
ALTER TABLE "verification_activity" ADD CONSTRAINT "verification_activity_worker_profile_id_worker_profiles_id_fk" FOREIGN KEY ("worker_profile_id") REFERENCES "public"."worker_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_activity" ADD CONSTRAINT "verification_activity_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "verification_activity_worker_id_idx" ON "verification_activity" USING btree ("worker_profile_id");--> statement-breakpoint
ALTER TABLE "worker_profiles" ADD CONSTRAINT "worker_profiles_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "worker_profiles_verification_idx" ON "worker_profiles" USING btree ("verification_status");