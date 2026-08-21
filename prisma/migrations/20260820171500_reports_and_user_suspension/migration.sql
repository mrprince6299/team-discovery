-- CreateEnum
CREATE TYPE "ReportTargetType" AS ENUM ('USER', 'TEAM', 'MESSAGE', 'FILE', 'LINK');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('HARASSMENT', 'SPAM', 'INAPPROPRIATE_CONTENT', 'FAKE_PROFILE', 'MISLEADING_INFO', 'SUSPICIOUS_ACTIVITY', 'OTHER');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_suspended" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "suspended_at" TIMESTAMP(3),
ADD COLUMN     "suspended_by_id" UUID,
ADD COLUMN     "suspension_reason" TEXT;

-- CreateTable
CREATE TABLE "reports" (
    "id" UUID NOT NULL,
    "reporter_id" UUID NOT NULL,
    "target_type" "ReportTargetType" NOT NULL,
    "target_id" UUID NOT NULL,
    "reason" "ReportReason" NOT NULL,
    "description" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "resolver_id" UUID,
    "resolution_note" TEXT,
    "action_taken" TEXT,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reports_reporter_id_idx" ON "reports"("reporter_id");

-- CreateIndex
CREATE INDEX "reports_target_type_target_id_idx" ON "reports"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "reports_status_idx" ON "reports"("status");

-- CreateIndex
CREATE INDEX "reports_created_at_idx" ON "reports"("created_at");

-- CreateIndex
CREATE INDEX "users_is_suspended_idx" ON "users"("is_suspended");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_suspended_by_id_fkey" FOREIGN KEY ("suspended_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_resolver_id_fkey" FOREIGN KEY ("resolver_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create partial unique index to prevent duplicate open reports for the same target by the same reporter
CREATE UNIQUE INDEX IF NOT EXISTS "idx_one_open_report_per_target" ON "reports"("reporter_id", "target_type", "target_id") WHERE "status" IN ('OPEN', 'IN_REVIEW');

-- Enable RLS and create policies for reports table
ALTER TABLE "reports" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can submit own reports" ON "reports" 
  FOR INSERT WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Reporters and Admins can view reports" ON "reports" 
  FOR SELECT USING (reporter_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can update reports" ON "reports" 
  FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete reports" ON "reports" 
  FOR DELETE USING (public.is_admin(auth.uid()));
