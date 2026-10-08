# Phase 1: Core Multimodal Diagnostic MVP (Weeks 1 – 3)
## Detailed Engineering & Implementation Plan

---

## 1. Phase Objective & Scope Boundary

### 1.1 Goal
Deliver a functional, secure end-to-end MVP that allows homeowners and clients on Fixmate to submit an issue via **text description** and/or **photographs**, receive an instant structured AI diagnosis (root cause, hazard level, immediate safety containment steps, DIY feasibility, and estimated Bill of Materials + labor costs), and view preliminary category-matched artisans.

### 1.2 In Scope
- Database schema expansion with Prisma for diagnostic sessions and media records.
- Secure media ingestion via Cloudinary with image compression and validation.
- Gemini 2.0 Flash integration with strict JSON schema validation and prompt engineering.
- Prompt injection defense, input sanitization, and out-of-scope inquiry filtering.
- REST API endpoints for diagnostic initiation, session polling, and basic category queries.
- Interactive React 19 frontend modal/widget with drag-and-drop photo upload and diagnostic result presentation.
- Automated tests verifying parsing accuracy across 5 major trade categories (Plumbing, Electrical, HVAC, Carpentry, Generators).

### 1.3 Out of Scope for Phase 1
- Native voice note recording & Whisper pipeline (deferred to Phase 3).
- Vector embeddings / pgvector cosine similarity (deferred to Phase 2).
- Direct escrow funding from diagnosis (deferred to Phase 4).

---

## 2. Architecture & Data Flow

```
[Client Web / Mobile PWA]
      │
      │ 1. Multipart POST: textPrompt + image files (max 4)
      ▼
[Express 5 Server: /api/ai/diagnose]
      │
      │ 2. Multer Memory Storage -> Validation (Zod)
      ▼
[Cloudinary Ingestion]
      │ 3. Parallel Upload & URL Generation (Auto-compressed WebP)
      ▼
[AiDiagnosticService]
      │ 4. Build Multimodal Payload -> Gemini 2.0 Flash
      ▼
[AI Response JSON Validation]
      │ 5. Parse, Validate Types, Fallback Recovery
      ▼
[Prisma Client: Database Persist]
      │ 6. Create AiDiagnosticSession + DiagnosticMedia records
      ▼
[Category & Artisan Quick-Lookup]
      │ 7. Query top active artisans in category
      ▼
[Response to Client (< 3s target)]
```

---

## 3. Step-by-Step Implementation Breakdown

### 3.1 Step 1: Database Schema Migration (Days 1–2)
Extend `prisma/schema.prisma` with the diagnostic session and media models:

```prisma
enum DiagnosticInputType {
  TEXT
  PHOTO
  MULTIMODAL
}

enum DiagnosticSeverity {
  LOW
  MODERATE
  HIGH
  CRITICAL
}

enum DiagnosticUrgency {
  ROUTINE
  SCHEDULED
  URGENT
  EMERGENCY
}

model AiDiagnosticSession {
  id                 String               @id @default(uuid()) @db.Uuid
  userId             String?              @map("user_id") @db.Uuid
  clientSessionToken String?              @map("client_session_token") @db.VarChar(128)
  inputType          DiagnosticInputType  @default(TEXT) @map("input_type")
  rawTextPrompt      String?              @map("raw_text_prompt") @db.Text
  
  diagnosticTitle    String?              @map("diagnostic_title") @db.VarChar(255)
  probableCause      String?              @map("probable_cause") @db.Text
  severity           DiagnosticSeverity   @default(LOW)
  urgency            DiagnosticUrgency    @default(ROUTINE)
  isHazardous        Boolean              @default(false) @map("is_hazardous")
  safetyInstructions Json                 @default("[]") @map("safety_instructions")
  diyAllowed         Boolean              @default(false) @map("diy_allowed")
  diyGuide           String?              @map("diy_guide") @db.Text
  
  estimatedBOM       Json                 @default("[]") @map("estimated_bom")
  estimatedLaborMin  Decimal?             @map("estimated_labor_min") @db.Decimal(12, 2)
  estimatedLaborMax  Decimal?             @map("estimated_labor_max") @db.Decimal(12, 2)
  currency           String               @default("NGN") @db.VarChar(10)
  
  matchedCategoryId  Int?                 @map("matched_category_id")
  recommendedSkills  Json                 @default("[]") @map("recommended_skills")
  
  clientLatitude     Decimal?             @map("client_latitude") @db.Decimal(10, 8)
  clientLongitude    Decimal?             @map("client_longitude") @db.Decimal(11, 8)
  clientAddress      String?              @map("client_address") @db.Text
  
  convertedToJobId   String?              @unique @map("converted_to_job_id") @db.Uuid
  selectedArtisanId  String?              @map("selected_artisan_id") @db.Uuid
  
  createdAt          DateTime             @default(now()) @map("created_at") @db.Timestamptz
  updatedAt          DateTime             @updatedAt @map("updated_at") @db.Timestamptz

  user               User?                @relation(fields: [userId], references: [id], onDelete: SetNull)
  category           JobCategory?         @relation(fields: [matchedCategoryId], references: [id])
  mediaFiles         DiagnosticMedia[]

  @@index([userId])
  @@index([matchedCategoryId])
  @@index([createdAt])
  @@map("ai_diagnostic_sessions")
}

model DiagnosticMedia {
  id                   String              @id @default(uuid()) @db.Uuid
  diagnosticSessionId  String              @map("diagnostic_session_id") @db.Uuid
  mediaUrl             String              @map("media_url") @db.Text
  mediaType            String              @map("media_type") @db.VarChar(50)
  fileSize             Int                 @map("file_size")
  aiVisualSummary      String?             @map("ai_visual_summary") @db.Text
  createdAt            DateTime            @default(now()) @map("created_at") @db.Timestamptz

  session              AiDiagnosticSession @relation(fields: [diagnosticSessionId], references: [id], onDelete: Cascade)

  @@index([diagnosticSessionId])
  @@map("diagnostic_media")
}
```

**Execution Tasks:**
1. Execute `npx prisma migrate dev --name add_ai_diagnostic_models`.
2. Verify migration cleanly updates PostgreSQL and regenerates `@prisma/client`.

---

### 3.2 Step 2: Cloudinary Upload Optimization (Days 3–4)
Update `src/services/upload.service.js` to handle diagnostic image batches:
- Accept memory buffer from `multer`.
- Automatically downscale images exceeding 1920px width/height.
- Convert format to `.webp` with 80% quality compression to reduce LLM ingestion latency.
- Return public secure URLs.

---

### 3.3 Step 3: Diagnostic AI Prompting & Gemini Service (Days 5–8)
Implement `src/services/ai-diagnostic.service.js`:

```javascript
import { GoogleGenAI } from '@google/genai';
import prisma from '../config/prisma.js';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export class AiDiagnosticService {
  static async runDiagnostic({ textPrompt, imageUrls = [], clientCoords = null, userId = null }) {
    const prompt = `
Context: You are the chief diagnostic engineering AI for Artifix (Fixmate), an artisanal repair marketplace operating in Nigeria and West Africa.
Task: Diagnose the user's repair inquiry based on the text description and attached photos.

Input Details:
- User Description: "${textPrompt || 'No written text provided, analyze photos'}"
- Image Count: ${imageUrls.length}

Requirements:
1. Provide a professional, concise diagnostic title.
2. Formulate the probable root cause in plain English.
3. Classify severity: LOW, MODERATE, HIGH, or CRITICAL.
4. Classify urgency: ROUTINE, SCHEDULED, URGENT, or EMERGENCY.
5. Check for immediate life/property hazards (fire, electric shock, gas leak, active flooding).
6. Give 1-3 immediate containment steps (e.g. "Switch off main circuit breaker").
7. Indicate whether it is safe for DIY or if a professional artisan is strictly required.
8. Provide estimated Bill of Materials (BOM) in Nigerian Naira (NGN) with realistic price ranges.
9. Provide estimated labor range in NGN.
10. Map to one of the canonical Artifix categories: [electrical, plumbing, hvac-refrigeration, carpentry, masonry-painting, generator-repair, appliance-repair].
11. Return strictly valid JSON conforming to the schema.
`;

    const contents = [{ text: prompt }];
    for (const url of imageUrls) {
      contents.push({ image: { uri: url } });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.15
      }
    });

    const parsed = JSON.parse(response.text);

    // Save session in database
    const session = await prisma.aiDiagnosticSession.create({
      data: {
        userId,
        inputType: imageUrls.length > 0 ? (textPrompt ? 'MULTIMODAL' : 'PHOTO') : 'TEXT',
        rawTextPrompt: textPrompt,
        diagnosticTitle: parsed.diagnosticTitle,
        probableCause: parsed.probableCause,
        severity: parsed.severity,
        urgency: parsed.urgency,
        isHazardous: parsed.isHazardous,
        safetyInstructions: parsed.safetyInstructions || [],
        diyAllowed: parsed.diyAllowed,
        diyGuide: parsed.diyGuide || null,
        estimatedBOM: parsed.estimatedBOM || [],
        estimatedLaborMin: parsed.estimatedLaborMin,
        estimatedLaborMax: parsed.estimatedLaborMax,
        recommendedSkills: parsed.recommendedSkills || [],
        clientLatitude: clientCoords?.lat ? parseFloat(clientCoords.lat) : null,
        clientLongitude: clientCoords?.lng ? parseFloat(clientCoords.lng) : null,
        mediaFiles: {
          create: imageUrls.map(url => ({
            mediaUrl: url,
            mediaType: 'image/webp',
            fileSize: 0
          }))
        }
      },
      include: { mediaFiles: true }
    });

    return { session, diagnosis: parsed };
  }
}
```

---

### 3.4 Step 4: Express Controller & Validation (Days 9–10)
1. **Validation Schema (`src/validators/ai.validator.js`):**
   ```javascript
   import { z } from 'zod';

   export const diagnoseSchema = z.object({
     textPrompt: z.string().max(2000).optional(),
     latitude: z.string().regex(/^-?\d+(\.\d+)?$/).optional(),
     longitude: z.string().regex(/^-?\d+(\.\d+)?$/).optional(),
   });
   ```
2. **Controller (`src/controllers/ai.controller.js`):**
   - Handle multer multipart upload (max 4 files, 5MB each, JPEG/PNG/WebP only).
   - Validate input text / images existence.
   - Enforce rate limit (max 10 diagnostic requests per user/IP per hour).
   - Return formatted response.

---

### 3.5 Step 5: Frontend React Component (Days 11–13)
- Build `frontend/src/components/ai/AiDiagnosticModal.tsx`.
- Include responsive image preview with thumbnail remove buttons.
- Display loading skeleton with progressive status chips:
  * *"Uploading photos..."*
  * *"Analyzing visual defect..."*
  * *"Checking safety hazards..."*
  * *"Calculating local price radar..."*
- Render clean result cards with danger alert styling when `isHazardous === true`.

---

### 3.6 Step 6: Testing & Quality Assurance (Days 14–15)
1. **Test Dataset:** Run 25 benchmark scenarios:
   - 5 Electrical (tripping breaker, burnt socket, flickering chandelier, inverter humming, bare wire).
   - 5 Plumbing (under-sink leak, gurgling toilet, low booster pump pressure, burst pipe, dripping tap).
   - 5 HVAC (lukewarm AC, indoor water drip, noisy outdoor fan, iced copper pipe, dead remote sensor).
   - 5 Generator (cranking no ignition, surging engine, oil leak, black smoke, no voltage output).
   - 5 Adversarial / Out-of-scope (cooking recipe request, spam, blurry blank image).
2. **Benchmark Acceptance Criteria:**
   - Classification accuracy $\ge 92\%$.
   - Safety hazard detection accuracy $= 100\%$ on fire/shock/gas prompts.
   - Average latency $\le 2.8\text{ seconds}$.

---

## 4. Phase 1 Deliverables Checklist

- [ ] Prisma migration deployed and verified.
- [ ] Cloudinary diagnostic asset folder configured with retention policies.
- [ ] Gemini API key integrated with secret rotation.
- [ ] Rate limiting & prompt injection filters active.
- [ ] End-to-end frontend upload modal merged in `frontend/src/components/ai/`.
- [ ] CI automated test suite passing in `scripts/test-step3-apis.js`.
