CREATE TYPE "DiagnosticStatus" AS ENUM ('INFORMATION_GATHERING', 'ASSESSMENT_READY', 'DIY_GUIDANCE', 'PROFESSIONAL_REQUIRED', 'EMERGENCY', 'RESOLVED');

ALTER TABLE "ai_diagnostic_sessions"
  ADD COLUMN "diagnostic_status" "DiagnosticStatus" NOT NULL DEFAULT 'INFORMATION_GATHERING',
  ADD COLUMN "diagnostic_state" JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN "conversation_summary" TEXT,
  ADD COLUMN "prompt_version" VARCHAR(100);

CREATE TABLE "ai_diagnostic_turns" (
  "id" UUID NOT NULL,
  "diagnostic_session_id" UUID NOT NULL,
  "role" VARCHAR(20) NOT NULL,
  "content" TEXT NOT NULL,
  "structured_decision" JSONB,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ai_diagnostic_turns_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_diagnostic_turns_diagnostic_session_id_created_at_idx"
  ON "ai_diagnostic_turns"("diagnostic_session_id", "created_at");

ALTER TABLE "ai_diagnostic_turns"
  ADD CONSTRAINT "ai_diagnostic_turns_diagnostic_session_id_fkey"
  FOREIGN KEY ("diagnostic_session_id") REFERENCES "ai_diagnostic_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
