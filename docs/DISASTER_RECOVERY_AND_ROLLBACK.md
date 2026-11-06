# Artifix Platform — Disaster Recovery & Rollback Operational Runbook

This runbook outlines standard operating procedures (SOPs) for disaster recovery, database snapshot restoration, migration rollbacks, and financial incident remediation.

---

## 1. Database Disaster Recovery & Point-in-Time Recovery (PITR)

### Automated Daily Backups
The automated backup script is located at `scripts/backup-database.sh`.
- **Archive Format**: Custom compressed PostgreSQL dump (`.dump`)
- **Encryption**: AES-256-CBC via OpenSSL with PBKDF2 key derivation (`BACKUP_ENCRYPTION_KEY`).
- **Retention**: Local archives pruned automatically after 30 days.

### Triggering a Manual Backup
```bash
# Set your encryption key (optional but recommended for production)
export BACKUP_ENCRYPTION_KEY="your-strong-backup-key"
./scripts/backup-database.sh
```

### Full Disaster Recovery Restoration
```bash
export BACKUP_ENCRYPTION_KEY="your-strong-backup-key"
./scripts/restore-database.sh ./backups/artisan_db_20261021_120000Z.dump.enc "$DATABASE_URL"
```

### Cloud Provider Point-In-Time Recovery (PITR)
If operating on managed PostgreSQL (Render Postgres, Neon, Supabase, or AWS RDS):
1. **Render Postgres**: Go to **Dashboard** -> **PostgreSQL Service** -> **Backups** tab -> Click **Restore** to fork a new instance from any 1-minute window in the past 7 days.
2. **Neon**: In Neon Console, use **Branches** to instantly restore a point-in-time snapshot to an isolated branch with zero downtime.
3. **Supabase**: Navigate to **Database** -> **Backups** -> **Point in Time** -> Select restore timestamp.

---

## 2. Prisma Database Migration Rollbacks

Prisma does not support automated "down" migrations. If a bad migration has been deployed via `prisma migrate deploy`, execute the following sequence:

### Safe Rollback Procedure
1. **Inspect Applied Migration**:
   Check the failed migration name in `prisma/migrations/` and query the migration log:
   ```bash
   npx prisma migrate status
   ```
2. **Write Compensating Migration**:
   Never manually delete folders from `prisma/migrations` in production. Instead, create a new forward migration that reverses the offending schema changes:
   ```bash
   npx prisma migrate dev --name revert_offending_change
   ```
3. **Emergency Production Hotfix**:
   If the migration failed halfway and blocked the deployment pipeline:
   ```bash
   # Mark the failed migration as rolled-back in Prisma's internal _prisma_migrations table:
   npx prisma migrate resolve --rolled-back "<migration_folder_name>"
   ```
   Then deploy the compensating SQL script directly.

---

## 3. Financial Reconciliations & Payout Sagas

### When Payouts are Stuck in PROCESSING
If Kotani Pay or Paystack experienced a network outage during transfer dispatch:
1. Run the financial ledger audit:
   ```bash
   node -e "import('./src/services/reconciliation.service.js').then(m => m.ReconciliationService.performDailyReconciliation())"
   ```
2. If discrepancies are detected (`CRITICAL`), inspect the unconfirmed payouts:
   ```sql
   SELECT id, reference, amount, status, failure_reason, created_at 
   FROM payout_requests 
   WHERE status = 'PROCESSING' AND created_at < NOW() - INTERVAL '30 minutes';
   ```
3. To safely refund a verified stuck payout back to the user's available balance:
   ```sql
   BEGIN;
   UPDATE payout_requests 
   SET status = 'REJECTED', failure_reason = 'Reconciled manual timeout reversal' 
   WHERE id = '<payout_id>';

   UPDATE wallets 
   SET available_balance = available_balance + <payout_amount> 
   WHERE id = '<wallet_id>';

   UPDATE transactions 
   SET status = 'FAILED' 
   WHERE reference = '<payout_reference>';
   COMMIT;
   ```

---

## 4. Monad Arbiter Gas Outage Emergency Procedure

If the Monad Arbiter wallet runs out of gas, on-chain escrow releases and dispute resolutions will fail with `INSUFFICIENT_FUNDS`.

1. **Check Arbiter Balance**:
   ```bash
   npm run monitor:gas
   ```
2. **Refill Gas Reserves**:
   Transfer at least 10 MON to the Arbiter wallet address:
   ```bash
   # Check active address
   node -e "import('./src/config/env.js').then(m => console.log('Arbiter Address:', m.env.ESCROW_ARBITER_ADDRESS))"
   ```
3. **Reprocess Failed Transactions**:
   Start the blockchain worker to drain and retry stalled queue items:
   ```bash
   npm run start:blockchain-tx
   ```
