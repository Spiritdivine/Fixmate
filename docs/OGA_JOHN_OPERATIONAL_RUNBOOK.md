# ARTIFIX | OGA JOHN OPERATIONAL RUNBOOK
## Incident Response, Resilience, Secret Rotation, & Rollback Playbook
**Service**: Oga John AI Diagnostic & Matching Engine (`Fixmate / Artifix`)  
**Version**: 2.1.0 (Production Hardened)  
**Classification**: Mission-Critical Reliability Document (Tier 1)  

---

## 1. System Architecture & Component Mapping

```
                                      [Client Request]
                                             │
                                             ▼
                             ┌───────────────────────────────┐
                             │    Gate 1: Safety Shield      │ (< 2ms Deterministic Hazard Check)
                             └───────────────┬───────────────┘
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       │                                           │
             [Hazard Detected]                             [Safe Request]
                       │                                           │
                       ▼                                           ▼
         ┌───────────────────────────┐               ┌───────────────────────────┐
         │ Immediate Containment     │               │    Diagnostic Cache       │ (AiCacheService)
         │ + 1-Tap SOS Dispatch      │               └─────────────┬─────────────┘
         └───────────────────────────┘                             │
                                                     ┌─────────────┴─────────────┐
                                                     │                           │
                                               [Cache Hit]                 [Cache Miss]
                                                     │                           │
                                                     ▼                           ▼
                                            [Return Instant BOM]    ┌─────────────────────────┐
                                                                    │ Circuit Breaker Tier    │
                                                                    │ 1. OpenAI (gpt-4o)      │
                                                                    │ 2. Gemini (2.0 Flash)   │
                                                                    │ 3. Heuristic Engine     │
                                                                    └────────────┬────────────┘
                                                                                 │
                                                                                 ▼
                                                                    ┌─────────────────────────┐
                                                                    │ Price Grounding Engine  │
                                                                    │ (Merchant Survey DB)    │
                                                                    └────────────┬────────────┘
                                                                                 │
                                                                                 ▼
                                                                    ┌─────────────────────────┐
                                                                    │ Policy A Match Engine   │
                                                                    │ (Hard KYC + Zero-Pad)   │
                                                                    └─────────────────────────┘
```

---

## 2. Outage Handling & Severity Classifications

### 2.1 Incident Severity Levels

| Severity | Definition | Target MTTR | Trigger Example |
| :--- | :--- | :--- | :--- |
| **SEV-1 (Critical)** | Safety shield bypassed or total system crash (500s across all requests) | < 15 mins | Database offline, unhandled crash in `/ai/diagnose`, hazard undetected |
| **SEV-2 (High)** | All external AI providers down; system operating in resilience mode | < 45 mins | OpenAI & Gemini 503/429 simultaneously; BOM pricing oracle offline |
| **SEV-3 (Medium)** | Single AI provider degraded; circuit breaker automatically routed to backup | < 2 hours | Gemini quota exhausted; cache hit rate drops below 10% |
| **SEV-4 (Low)** | Non-blocking telemetry or background indexing delays | < 24 hours | Regional price index refresh lag; minor latency fluctuation |

---

### 2.2 Provider Outage Playbooks

#### Scenario A: Primary AI Provider (OpenAI / Gemini) Outage (SEV-3)
1. **Automated Behavior**:
   * The `AiCacheService` circuit breaker monitors consecutive failures. After 3 consecutive HTTP 429, 500, or 503 responses, the provider circuit state shifts to `OPEN`.
   * Requests immediately bypass the failed provider without waiting for network timeouts.
   * Telemetry event `PROVIDER_CIRCUIT_TRIPPED` is emitted.
2. **Operator Action**:
   * Check provider status pages: [OpenAI Status](https://status.openai.com) / [Google Cloud Status](https://status.cloud.google.com).
   * Verify circuit breaker status:
     ```bash
     curl -s -H "Authorization: Bearer $ADMIN_JWT" http://localhost:5050/api/v1/ai/cache-stats | jq .data.circuitBreakers
     ```
   * If an outage is confirmed by the vendor, simulate/lock the circuit to avoid probing retries:
     ```javascript
     AiCacheService.simulateOutage('openai', true);
     ```

#### Scenario B: Total AI Provider Outage (SEV-2)
1. **Automated Behavior**:
   * When both OpenAI and Gemini circuits are `OPEN`, `ai-diagnostic.service.js` automatically engages the **Deterministic Rule & Heuristic Engine** (`_simulateDiagnostic`).
   * Domain 1 Safety Shield (`SafetyShieldService`) remains **100% active** because it executes natively in Node.js via deterministic regex and keyword trees without external API calls.
   * Users receive accurate fault categorizations, safety containment steps, verified BOM breakdowns from Neon PostgreSQL, and Policy A specialist matches.
2. **Operator Action**:
   * Monitor cache hit rates and ensure incoming traffic does not throw unhandled 500 errors:
     ```bash
     curl -s http://localhost:5050/api/v1/ai/cache-stats | jq .
     ```
   * Verify that Gate 2 safe output validation is sanitizing all heuristic outputs.

#### Scenario C: Database (Neon PostgreSQL) Connection Saturation (SEV-1)
1. **Symptoms**:
   * Prisma throws `PrismaClientInitializationError` or `Timed out fetching a new connection from the connection pool`.
2. **Operator Action**:
   * Check active connections in Neon console.
   * Ensure `DATABASE_URL` uses PgBouncer pooler port (`6543`) with `?pgbouncer=true&connection_limit=10`.
   * Purge idle server sessions:
     ```bash
     pm2 restart artisan-backend
     ```

---

## 3. Secret & API Key Rotation Runbook

### 3.1 Supported Secrets Inventory
* `GEMINI_API_KEY`: Google Gemini Generative Language API
* `OPENAI_API_KEY`: OpenAI API Platform
* `DATABASE_URL`: Neon PostgreSQL pooled connection string
* `JWT_SECRET`: User session token signing secret
* `CROSSMINT_SECRET`: Monad crypto escrow wallet minting key

### 3.2 Dual-Key Zero-Downtime Rotation Procedure (OpenAI / Gemini)
1. **Generate New Key**:
   * In Google AI Studio or OpenAI Dashboard, create a new API key labeled `artifix-prod-YYYYMMDD`.
2. **Staging Verification**:
   * Test the new key against staging or via curl:
     ```bash
     curl -H "Content-Type: application/json" \
          "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=$NEW_GEMINI_KEY" \
          -d '{"contents":[{"parts":[{"text":"ping"}]}]}'
     ```
3. **Update Environment Secret**:
   * Update the environment variable in production vault / `.env`:
     ```bash
     GEMINI_API_KEY="new_key_here"
     ```
4. **Graceful Reload**:
   * Trigger zero-downtime cluster reload:
     ```bash
     pm2 reload artisan-backend --update-env
     ```
5. **Verify Telemetry**:
   * Check `/api/v1/ai/cache-stats` to verify that `circuitBreakers.gemini.state` is `CLOSED` and `consecutiveFailures: 0`.
6. **Decommission Old Key**:
   * After 30 minutes of stable operation, revoke the old key in the vendor dashboard.

---

## 4. Rollback & Hotfix Procedure

### 4.1 Application Rollback
If a regression is identified in the diagnostic engine:
1. **Identify Last Stable Commit**:
   ```bash
   git log -n 5 --oneline
   ```
2. **Revert Backend to Target Release**:
   ```bash
   git checkout <LAST_STABLE_COMMIT>
   npm install --production
   pm2 restart artisan-backend
   ```
3. **Frontend Rollback**:
   ```bash
   cd frontend
   git checkout <LAST_STABLE_COMMIT>
   npm run build
   pm2 restart artisan-frontend || systemctl reload nginx
   ```

### 4.2 Database Migration Rollback Safety
If a schema migration must be reverted:
1. **Review Pending Migration State**:
   ```bash
   npx prisma migrate status
   ```
2. **Zero Data-Loss Principle**:
   * Never drop columns or tables with live customer diagnostic sessions (`ai_diagnostic_sessions`, `match_snapshots`, `price_observations`).
   * Apply backward-compatible additive migrations only.

### 4.3 Emergency Cache Flush
If poisoned or outdated diagnosis/pricing data is cached:
```bash
# Invalidate specific category
curl -X POST -H "Authorization: Bearer $ADMIN_JWT" \
     -H "Content-Type: application/json" \
     http://localhost:5050/api/v1/ai/cache/invalidate \
     -d '{"categorySlug": "plumbing-and-pipefitting"}'

# Or flush entire cache
curl -X POST -H "Authorization: Bearer $ADMIN_JWT" \
     -H "Content-Type: application/json" \
     http://localhost:5050/api/v1/ai/cache/invalidate \
     -d '{}'
```

---

## 5. Observability, Telemetry & Compliance

### 5.1 Critical Health & Performance Thresholds

| Metric | Target Normal | Warning Threshold | Alert Action |
| :--- | :--- | :--- | :--- |
| **Gate 1 Hazard Scan Latency** | < 1.5 ms | > 5.0 ms | Profile regex patterns in `SafetyShieldService` |
| **Total Diagnostic Latency** | < 2,500 ms | > 6,000 ms | Check OpenAI/Gemini latency; verify cache hit rate |
| **Cache Hit Rate** | > 30% | < 10% | Check symptom normalization hashing in `AiCacheService` |
| **Provider Error Rate** | < 1.0% | > 5.0% | Trip circuit breaker to backup model tier |
| **Cross-Trade Mismatch Rate** | **0.0%** | > 0.0% | Immediate SEV-1 audit: Policy A hard gate violation |

### 5.2 Automated Telemetry Redaction Policy (NDPR & GDPR Compliance)
* **Zero PII in Logs**: Telemetry captured by `AiCacheService.recordTelemetry()` executes automated recursive regex redaction:
  * Phone numbers (`+234...`, `080...`) ➔ `[REDACTED_PHONE]`
  * Emails (`user@domain.com`) ➔ `[REDACTED_EMAIL]`
  * Nigerian BVN & NIN (11 digits) ➔ `[REDACTED_ID_NUMBER]`
  * API Keys & Bearer tokens ➔ `[REDACTED_API_KEY]` / `Bearer [REDACTED_TOKEN]`
* Telemetry records are accessible only to authenticated admins via `GET /api/v1/ai/telemetry`.

---

## 6. Verification Checklist

Before clearing any deployment or resolving an incident:
- [ ] Safety Shield Red-Team passed (`node scripts/test-ai-safety-redteam.js`)
- [ ] End-to-end multi-turn chat flow passed (`node scripts/test-hero-chat-flow.js`)
- [ ] Local price grounding validated (`node scripts/test-ai-price-grounding.js`)
- [ ] Policy A matching integrity and `MatchSnapshot` audit confirmed (`node scripts/test-ai-matching-integrity.js`)
- [ ] Outage resilience & telemetry redaction simulation passed (`node scripts/test-ai-outage-and-resilience.js`)
- [ ] Frontend production build compiled with Exit Code 0 (`npm run build`)
