# Phase 4: Production Hardening, Escrow Linking & Rollout (Weeks 10 – 12)
## Detailed Engineering & Implementation Plan

---

## 1. Phase Objective & Systems Integration

### 1.1 Goal
Solidify the entire AI diagnostic and smart matching engine for commercial production. Connect the diagnostic output directly to Fixmate's dual escrow infrastructure (Monad blockchain USDC smart contracts and Paystack fiat deposits), implement emergency SOS dispatch, deploy AI post-repair photo verification before milestone release, enforce token economic controls, and guarantee data protection compliance.

### 1.2 End-to-End System Integration Flow

```
[Client Multimodal Inquiry]
            │
            ▼
[AI Diagnostic Engine] ───▶ [Calculates Labor + BOM Range: e.g. ₦18,000 - ₦25,000]
            │
            ▼
[Smart Matcher] ─────────▶ [Selects Top 3 Artisans with verified distance]
            │
            ▼
[1-Click Escrow Funding] ─▶ [Choose Monad USDC or Paystack Fiat]
            │
    ┌───────┴───────┐
    │ Escrow Funded │
    └───────┬───────┘
            ▼
[Artisan Dispatched with Job Dossier]
            │
            ▼
[Work Completed: Artisan uploads Post-Repair Photo]
            │
            ▼
[AI Diff Verification: Before vs After Inspection]
            │
            ▼
[Milestone Approved ──▶ Funds Released to Artisan Wallet]
```

---

## 2. Technical Implementation Modules

### 2.1 Module 1: Diagnostic-to-Escrow Linking (`src/services/escrow.service.js`) (Days 1–3)
Connect the diagnosed labor and material costs with Fixmate's smart contracts and fiat escrow:
1. **Automated Milestone Split:**
   - **Milestone 1 (Materials Advance):** Set to AI `estimatedBOM` median total (e.g. ₦12,000). Released only after artisan submits receipt photo or check-in.
   - **Milestone 2 (Labor Upon Completion):** Set to `estimatedLabor` amount (e.g. ₦10,000). Released after client approval and AI post-repair verification.
2. **Dual-Rail Payment Support:**
   - **Crypto / Web3 Rail:** Invokes `createContract()` on Fixmate's deployed Monad Escrow smart contract with USDC amount.
   - **Fiat Rail:** Generates a Paystack dedicated virtual account or checkout link with exact escrow lock.

---

### 2.2 Module 2: Emergency 1-Tap SOS Dispatch Mode (Days 4–6)
When the AI diagnostic engine detects `urgency === "EMERGENCY"` and `isHazardous === true` (e.g. active gas leak, sparking fuse board, bursting main pipe):
1. **Bypass Standard Bidding:** Skip the standard request-for-proposals queue.
2. **Simultaneous Multi-Cast Dispatch:**
   - Find the 3 closest verified on-call emergency artisans within a 5km radius.
   - Dispatch high-priority push notifications and automated SMS alerts via `sms.service.js`:
     > *"URGENT: Artifix Emergency Electrical Callout near Lekki Phase 1 (1.2km away). ₦15,000 callout guaranteed in escrow. Tap to accept now."*
3. **First-to-Claim Lock:**
   - The first artisan to tap "Accept" secures the contract.
   - Live location tracking opens immediately between client and artisan.

---

### 2.3 Module 3: AI Post-Repair Verification & Before/After Inspection (Days 7–9)
To prevent premature or fraudulent escrow milestone releases, implement automated photo verification:

```javascript
// src/services/ai-verification.service.js
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export class AiVerificationService {
  /**
   * Compare pre-repair diagnostic photos with post-repair completion photos
   */
  static async verifyRepairWork({ initialPhotoUrls, completionPhotoUrls, diagnosticTitle }) {
    const prompt = `
Context: You are inspecting the completion of an artisanal home repair for Artifix.
Job Title: "${diagnosticTitle}"

Task:
Compare the initial damage photos with the completed repair photos.
Verify:
1. Has the reported defect been repaired or replaced?
2. Are there any visible lingering safety hazards (bare uninsulated wires, leaking water, missing covers)?
3. Does the workmanship look structurally sound and complete?

Return JSON:
{
  "isRepairVerified": boolean,
  "confidenceScore": number,
  "observations": string[],
  "hazardsRemaining": boolean,
  "recommendation": "APPROVE_MILESTONE" | "REQUIRE_ARTISAN_REWORK" | "FLAG_FOR_HUMAN_INSPECTION"
}
`;

    const contents = [{ text: prompt }];
    initialPhotoUrls.forEach(url => contents.push({ image: { uri: url } }));
    completionPhotoUrls.forEach(url => contents.push({ image: { uri: url } }));

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1
      }
    });

    return JSON.parse(response.text);
  }
}
```

---

### 2.4 Module 4: Performance Caching & Token Economics (Days 10–11)
1. **Redis Semantic Caching:**
   - Compute hash of normalized symptom descriptions.
   - If an identical inquiry occurs within 48 hours in the same locality, serve the cached diagnostic tree and price radar, saving API tokens and reducing latency to $< 250\text{ms}$.
2. **Token Budget Controls:**
   - Maximum prompt budget: 1,500 tokens.
   - Maximum response budget: 800 tokens.
   - Monthly ceiling alerting via Slack webhook if AI expenditure approaches \$250/month.

---

### 2.5 Module 5: Security, Privacy & NDPR Compliance (Days 12–13)
1. **Metadata Stripping:** Strip EXIF geospatial metadata from uploaded JPEG/PNG photos before public Cloudinary URL persistence to protect client residence privacy.
2. **Phone Number Masking:** Client and artisan contact numbers are masked using temporary virtual relays until contract escrow is locked.
3. **Voice Audio Retention:** Voice notes are deleted from temporary storage after 30 days of contract completion in compliance with Nigerian Data Protection Regulation (NDPR).

---

### 2.6 Module 6: End-to-End Testing & Telemetry (Days 14–15)
1. **Integration Test Suite:** Create `scripts/test-ai-diagnostic-flow.js` executing:
   * Photo upload $\rightarrow$ Diagnosis generation $\rightarrow$ Match scoring $\rightarrow$ Escrow creation $\rightarrow$ Completion verification $\rightarrow$ Payout release.
2. **PostHog Analytics Events:**
   - `ai_diagnostic_started` (inputType: text | voice | photo)
   - `ai_diagnostic_completed` (category, severity, durationMs)
   - `ai_artisan_selected` (artisanId, matchScore, distanceKm)
   - `ai_escrow_funded` (amount, currency: NGN | USDC)
   - `ai_repair_verified` (verificationOutcome)

---

## 3. Phase 4 Deliverables Checklist

- [ ] Escrow service automatically pre-populated with AI BOM and labor estimates.
- [ ] Emergency SOS dispatch protocol implemented and tested with Web Push + SMS.
- [ ] AI Post-Repair Before/After verification pipeline deployed.
- [ ] Redis caching layer active for common diagnostic queries.
- [ ] EXIF metadata scrubbing active on all uploaded images.
- [ ] PostHog conversion telemetry dashboards configured.
- [ ] End-to-end integration test passing in CI.
