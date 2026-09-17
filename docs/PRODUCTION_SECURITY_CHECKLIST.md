# Fixmate Wallet & Escrow Infrastructure — Production Security Checklist

This document details the enterprise-grade security architecture, smart contract safeguards, database constraints, and operational runbooks for running Fixmate's dual-rail (Fiat NGN + Monad USDC) wallet and escrow infrastructure in production.

---

## 1. Smart Contract Multi-Sig & Monad Deployment

### Multi-Sig Ownership via Gnosis Safe
In production, smart contracts (`FixmateEscrow.sol`) **must never be owned by a single private key / EOA (Externally Owned Account)**.

1. **Deploy a Gnosis Safe on Monad**:
   - Set up a minimum **3-of-5** or **2-of-3** multi-signature threshold.
   - Safe signers should be distributed across hardware wallets (e.g. Ledger / Trezor) owned by corporate officers and lead engineering staff.
2. **Transfer Contract Ownership**:
   ```solidity
   // Transfer ownership of deployed FixmateEscrow to Safe
   escrowContract.transferOwnership(GNOSIS_SAFE_ADDRESS);
   ```
3. **Admin & Dispute Resolver Roles**:
   - The contract defines an `admin` role and an `arbitrator` role.
   - The platform automated dispute backend (`backendRelayerAddress`) can be designated as an operational resolver with limited permissions or emergency timelocks.
4. **Emergency Circuit Breaker (Pause Mechanism)**:
   - In case of an on-chain anomaly or external exploit, the Gnosis Safe multi-sig can execute `pause()` to halt `createEscrow`, `fundEscrow`, and `releaseEscrow` until audited.

### Circle USDC Token Binding
- On Monad Testnet, Fixmate utilizes `MockUSDC` (`0x8E12F5e6D857Ea2c1C68673322E7eF061F5B0F75`) with 6 decimals.
- For Monad Mainnet:
  - Verify the official bridged or native Circle USDC contract address.
  - Set `usdcToken` address in constructor or via `updateTokenAddress()`.
  - Validate that `1 USDC = 1_000_000 units` (6 decimals) matches backend arithmetic across Kotani Pay on/off-ramp conversions.

---

## 2. Webhook Hardening & Replay Attack Defense

Both Paystack (Fiat) and Kotani Pay (Crypto On/Off-Ramp) communicate with Fixmate via asynchronous webhooks.

### A. HMAC-SHA256 Signature Verification
- Paystack: Header `x-paystack-signature` verified against `PAYSTACK_SECRET_KEY`.
- Kotani Pay: Header `kotani-signature` or `x-kotani-signature` verified against `KOTANI_SECRET_KEY`.
- Webhook raw body buffering is preserved using Express `verify` callback so signatures are evaluated against the unparsed byte payload.

### B. 5-Minute Replay Window Check
Every incoming webhook payload timestamp (`payload.timestamp`, `data.paid_at`, or `data.created_at`) is evaluated against current server time:
```javascript
const ageInSeconds = Math.abs(Date.now() - eventTime) / 1000;
if (ageInSeconds > 300 && env.NODE_ENV === 'production') {
  throw ApiError.badRequest('Webhook event expired (replay window exceeded: > 5 minutes)');
}
```
If an adversary intercepts a previously valid signed webhook payload and replays it later, it is immediately discarded.

### C. Database Idempotency
- Unique `eventId` entries are recorded in `webhook_events` within the PostgreSQL transaction.
- If an event is already marked `isProcessed = true`, duplicate attempts return HTTP 200 `{ status: 'already_processed' }` with zero state modification.

### D. Network Layer IP Allowlisting
In production deployment behind Cloudflare / AWS ALB:
- Whitelist Paystack IP ranges:
  - `52.31.139.75`
  - `52.214.14.220`
  - `52.49.173.169`
- Whitelist Kotani Pay IP ranges / domain origin proxies.
- Reject webhook requests originating from non-whitelisted CIDRs directly at the edge / WAF.

---

## 3. Database Integrity & Pessimistic Concurrency (Anti-Race Condition)

### PostgreSQL Non-Negative Balance Constraints
Even if an unforeseen edge case bypasses application-level validations, the PostgreSQL engine acts as an immutable final backstop:
```sql
ALTER TABLE "wallets"
ADD CONSTRAINT "chk_wallets_available_balance_non_negative"
CHECK ("available_balance" >= 0);

ALTER TABLE "wallets"
ADD CONSTRAINT "chk_wallets_escrow_locked_non_negative"
CHECK ("escrow_locked_balance" >= 0);
```
Any operation that would cause either balance to drop below `0.00` immediately aborts with a database constraint violation error.

### Pessimistic Row-Level Locking (`FOR UPDATE`)
To eliminate double-spend and overdraft race conditions when simultaneous payout requests or milestone escrow locks occur:
1. **Payout Withdrawals (`requestPayout`)**:
   ```sql
   SELECT id, available_balance 
   FROM wallets 
   WHERE user_id = ${userId}::uuid 
   FOR UPDATE
   ```
2. **Escrow Funding (`fundMilestone`)**:
   ```sql
   SELECT id, available_balance, escrow_locked_balance 
   FROM wallets 
   WHERE user_id = ${clientId}::uuid 
   FOR UPDATE
   ```
This acquires an exclusive lock on the wallet row for the duration of the Prisma ACID transaction. Concurrent requests are serialized, preventing parallel requests from reading the same stale pre-withdrawal balance.

---

## 4. Tiered KYC Daily Limits

To mitigate money laundering risks and account takeover damage, automated daily withdrawal limits are enforced on a rolling 24-hour window across both Fiat payouts and Kotani Crypto off-ramps:

| KYC Tier | Verification Status | Daily Fiat Limit (NGN) | Daily Crypto Off-Ramp Limit (USDC) |
|---|---|---|---|
| **Tier 1** | Unverified / Phone & Email Only | **₦50,000.00** | **$50.00 USDC** |
| **Tier 2** | Verified (BVN / NIN / Gov ID verified) | **₦1,000,000.00** | **$1,000.00 USDC** |
| **Tier 3** | High-Volume / Enterprise / Verified Merchant | Custom (Manual Compliance Approval) | Custom |

### Rolling 24-Hour Enforcement Logic
Withdrawal attempts sum all completed and pending payouts in `payout_requests` where `createdAt >= NOW() - INTERVAL '24 HOURS'`. If `(rollingSum + requestedAmount) > dailyLimit`, the transaction is rejected with an upgrade KYC prompt.

---

## 5. Privy Embedded Wallet Security

1. **Domain Allowlisting**:
   - In Privy Dashboard, configure `Allowed Domains` strictly to production URLs (e.g. `https://fixmate.ng`, `https://app.fixmate.ng`).
   - Disable localhost / wildcard wildcards in production.
2. **Session Signers & Scoped Delegation**:
   - Do not request full unlimited private key export permissions.
   - Use Privy embedded wallet session keys scoped strictly to `FixmateEscrow` contract calls.
3. **Paymaster Gas Tank**:
   - For a seamless Web2 UX, configure Biconomy / ZeroDev / Pimlico paymasters on Monad to sponsor gas for users, or require minimal native MON for direct gas payments.

---

## 6. Pre-Launch Production Checklist

- [x] Database check constraints `chk_wallets_available_balance_non_negative` active.
- [x] Database check constraints `chk_wallets_escrow_locked_non_negative` active.
- [x] Pessimistic row locking (`FOR UPDATE`) applied to `requestPayout()` and `fundMilestone()`.
- [x] Tiered KYC daily limits enforced on Fiat payout withdrawals.
- [x] Tiered KYC daily limits enforced on Kotani Pay USDC off-ramps.
- [x] Webhook replay protection window (300 seconds) enforced in Kotani & Paystack handlers.
- [x] On-chain USDC settlement decoupled from fiat balances (zero double-crediting).
- [ ] Gnosis Safe multi-sig deployed on Monad Mainnet and set as `FixmateEscrow` owner.
- [ ] Official Circle USDC mainnet address configured in environment and contract.
- [ ] Cloudflare WAF IP allowlisting configured for `/api/v1/payments/webhook/*`.
- [ ] Production Privy App ID and Client Secret configured with strict domain allowlists.
