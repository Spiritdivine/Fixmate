-- AlterTable: users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "wallet_address" VARCHAR(66);
CREATE INDEX IF NOT EXISTS "users_wallet_address_idx" ON "users"("wallet_address");

-- AlterTable: jobs
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "expected_outcome" TEXT;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "materials_provided_by" VARCHAR(50);
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "completion_proof_req" TEXT;

-- AlterTable: contracts
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "on_chain_escrow_id" INTEGER;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "smart_contract_addr" VARCHAR(66);
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "funding_tx_hash" VARCHAR(128);
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "release_tx_hash" VARCHAR(128);
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "refund_tx_hash" VARCHAR(128);
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "crypto_amount" DECIMAL(28,18);
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "crypto_currency" VARCHAR(10) NOT NULL DEFAULT 'MON';
CREATE INDEX IF NOT EXISTS "contracts_on_chain_escrow_id_idx" ON "contracts"("on_chain_escrow_id");

-- AlterTable: milestones
ALTER TABLE "milestones" ADD COLUMN IF NOT EXISTS "before_proof_urls" JSONB NOT NULL DEFAULT '[]';

-- AlterTable: disputes
ALTER TABLE "disputes" ADD COLUMN IF NOT EXISTS "on_chain_dispute_tx_hash" VARCHAR(128);
ALTER TABLE "disputes" ADD COLUMN IF NOT EXISTS "on_chain_resolution_tx_hash" VARCHAR(128);
