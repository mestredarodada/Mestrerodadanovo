ALTER TABLE "predictions" ADD COLUMN "is_published" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "predictions" ADD COLUMN "published_at" timestamp;