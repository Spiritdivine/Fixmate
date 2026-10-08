# Artifix AI Diagnostic & Smart Artisan Matching Engine: Comprehensive Architecture & Implementation Blueprint

---

## 1. Executive Summary & Product Vision

### 1.1 The Problem Space
In the home and trade services marketplace, the greatest source of transaction friction occurs before an artisan is ever booked. Non-technical clients face three critical barriers:
1. **Linguistic and Technical Deficit:** A homeowner cannot describe whether an AC issue is a faulty capacitor, a burnt compressor, or low refrigerant. They describe symptoms ("e dey blow hot air") rather than root causes.
2. **Misdiagnosis & Wrong Artisan Dispatch:** Calling an electrician for an appliance issue or a plumber for a structural leak causes wasted transit fees, customer frustration, and delayed resolution.
3. **Information Asymmetry & Overpricing Fear:** Clients fear being price-gouged due to lack of visibility into market-standard labor rates and necessary replacement parts.

### 1.2 The AI Solution: *Artifix FixBot / Copilot*
The proposed AI feature transforms the Artifix platform into an **intelligent triage diagnostic clinic**:
- **Multimodal Ingestion:** Users communicate naturally via **casual text**, **smartphone photos/short video clips**, or **spontaneous voice notes** (including Nigerian Pidgin and regional dialects).
- **Dual-Track AI Output:**
  1. **Diagnostic & Self-Help Track:** Provides an instantaneous, plain-English breakdown of what is likely wrong, immediate hazard/safety mitigation (e.g., "turn off the main water valve immediately"), and a realistic Bill of Materials (BOM) with an estimated cost range.
  2. **Smart Artisan Matching Track:** Synthesizes the diagnosed problem into a structured job specification, queries verified artisans using geospatial, semantic, and availability filters, and recommends the top 3 best-fit artisans alongside a 1-click booking flow into Fixmate's escrow-backed contract system.

```
       ┌────────────────────────────────────────────────────────┐
       │             CLIENT MULTIMODAL INGESTION                │
       │     (Text Prompt  •  Photos/Video  •  Voice Note)      │
       └───────────────────────────┬────────────────────────────┘
                                   │
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │               INGESTION & PRE-PROCESSING               │
       │ • Audio: Opus/WebM -> Whisper / Gemini Audio -> Text   │
       │ • Images: Cloudinary -> Resizing / Quality Scrubbing   │
       │ • Text: Normalization & Pidgin/Slang Dialect Parsing   │
       └───────────────────────────┬────────────────────────────┘
                                   │
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │         MULTIMODAL DIAGNOSTIC AGENT (LLM ENGINE)        │
       │ • Root-cause Analysis & Severity Classification       │
       │ • Safety/Hazard Check (Gas, Fire, Water, Shock)        │
       │ • DIY Feasibility vs Professional Need Determination   │
       │ • Estimated Bill of Materials & Price Band Radar       │
       └──────────────┬──────────────────────────┬──────────────┘
                      │                          │
        [Track A: Client Self-Help]  [Track B: Smart Matching Engine]
                      │                          │
                      ▼                          ▼
      ┌─────────────────────────┐  ┌─────────────────────────────┐
      │  Interactive Diagnostic │  │  PGVECTOR & POSTGIS MATCHER │
      │  Card & Safety Steps    │  │  • Trade Category Filtering │
      │  • What happened        │  │  • Spatial Proximity (GPS)  │
      │  • Immediate safety     │  │  • Availability & KYC Tier  │
      │  • Price estimate band  │  │  • Historical Rating Weight │
      └─────────────────────────┘  └─────────────┬───────────────┘
                                                 │
                                                 ▼
                                   ┌─────────────────────────────┐
                                   │  1-CLICK ESCROW DISPATCH    │
                                   │  • Pre-filled Job Contract  │
                                   │  • AI Artisan Brief Dossier │
                                   │  • Monad USDC / Fiat Escrow │
                                   └─────────────────────────────┘
```

---

## 2. Multimodal Ingestion Pipeline

### 2.1 Voice Note Processing Architecture
Voice is the most natural medium for trades and emergency home repairs, especially across African markets where users prefer speaking over typing technical details.

```
+--------------------------------------------------------------------------+
|                     AUDIO PROCESSING PIPELINE                            |
|                                                                          |
|  [Client Mic]                                                            |
|       │ (Web Audio API / MediaRecorder: audio/webm or audio/mp4)        |
|       ▼                                                                  |
|  [Client PWA / React Front-end]                                          |
|       │ Direct upload via Multipart Form or S3/Cloudinary Presigned URL  |
|       ▼                                                                  |
|  [Express Audio Controller]                                              |
|       │ Stream buffer -> Whisper API / Gemini Native Audio Pipeline      |
|       ▼                                                                  |
|  [Transcript Extraction & Dialect Adaptation Engine]                     |
|       • English, Nigerian Pidgin, Yoruba, Igbo, Hausa colloquialisms     |
|       • Output: Cleaned semantic transcript + Sentiment/Urgency tag      |
+--------------------------------------------------------------------------+
```

#### Technical Strategy for Audio:
1. **Frontend Capture:** React component leveraging `navigator.mediaDevices.getUserMedia` with a standardized 16kHz or 44.1kHz mono WAV/WebM stream, chunked every 250ms for visual audio waveform rendering.
2. **Dialect Resilience:** Standard Whisper or Gemini 2.0 Flash models handle Nigerian Pidgin smoothly when primed with a system prompt like:
   > *"You are transcribing and interpreting Nigerian and West African English home repair audio. Common terms include 'nepaa took light', 'gen dey spark', 'pumping machine don trip', 'ac dey sweat', 'tap dey leak', 'suck-away don full'."*
3. **Tone & Emergency Scoring:** The audio parser analyzes vocal urgency (pitch agitation, speed) to set an `urgency_level` (Routine, Urgent, Life-Safety Emergency).

### 2.2 Photo & Visual Media Pipeline
Home damage is inherently visual. Users often cannot articulate what part has failed, but a clear photo reveals burnt terminals, calcified valves, broken tiles, or leaking compressor joints.

#### Technical Strategy for Visuals:
1. **Client-Side Optimization:** Before uploading, the frontend compresses images with canvas/WebP down to maximum 1920x1080 resolution (under 1.5MB) to reduce upload latency on cellular connections.
2. **Cloudinary Asset Storage:** Images are uploaded via Fixmate's existing Cloudinary pipeline, generating permanent signed URLs tagged with `session_id`.
3. **Visual Inspection Prompting:** The images are passed to **Gemini 2.0 Flash / Pro Vision** alongside the transcribed text or written inquiry.
4. **Multi-Image Corroboration:** The system allows up to 4 photos:
   - Photo 1: Wide shot (Context/Location in the house).
   - Photo 2: Close-up (Defect, fracture, discoloration, model tag/label).
   - Photo 3/4: Context/Surroundings (Water supply valve, distribution board).

### 2.3 Interactive Clarification Loop (Conversational Triage)
If the user uploads a blurry photo or an ambiguous audio note ("My AC is not working"), the AI will not prematurely recommend an artisan. Instead, it triggers a **Dynamic Clarification Loop**:
- Prompts with max 2 highly focused diagnostic questions:
  * *"Is the outdoor compressor fan spinning when you turn it on?"*
  * *"Is there any ice forming on the copper pipes behind the indoor unit?"*
- Supports quick-tap chips (`Yes`, `No`, `Not sure / Cannot access`) to keep friction minimal.

---

## 3. Core Diagnostic Intelligence & Knowledge Engine

### 3.1 Failure Mode & Effects Analysis (FMEA) Categorization
The diagnostic agent is trained on a structured ontology of trade verticals matching Artifix's category tree:

| Vertical | Common Symptoms | Potential Root Causes | Typical Urgency | Safety Protocols |
| :--- | :--- | :--- | :--- | :--- |
| **Plumbing** | Water leaking under sink, low shower pressure, gurgling drains | Worn cartridge, calcified aerator, blocked soil stack, pipe fissure | High (if flooding) | Isolate main stopcock; shut off booster pump |
| **Electrical** | Breaker tripping repeatedly, burning smell, flickering lights | Overloaded circuit, burnt relay, shorted neutral wire, loose busbar | Critical | Trip main RCBO/Incomer immediately; no touch |
| **HVAC / Cooling** | AC blowing lukewarm air, water dripping inside room | Clogged condensate tray, refrigerant leak, dead capacitor, dirty coils | Moderate | Power down unit to protect compressor motor |
| **Carpentry / Doors** | Door sagging, jamming latch, termite sawdust | Shifted hinges, warped timber, moisture expansion, pest infestation | Low | Secure latch; keep moisture away |
| **Generators / Power**| Gen surging, cranking without starting, black smoke | Dirty carburetor, clogged fuel filter, fouled spark plug, bad AVR | Moderate | Turn off fuel petcock; do not overload |
| **Masonry / Roofing** | Ceiling dampness, plaster cracking, wall dampness | Roof flashing leak, failed damp-proof course (DPC), broken tiles | Moderate | Move furniture; clear drain gutters |

### 3.2 Hazard & Safety Triage Module
Before discussing repairs or artisans, the agent checks for high-risk hazards:
- **Electrical Shock / Arc Hazard:** Sparks, scorched sockets, burning plastic odor.
- **Gas / Explosive Hazard:** Cooking gas leaks, strange hissing near cylinders.
- **Structural / Flooding Hazard:** Active bursting pipes near appliances, collapsing ceiling boards.

**Output Rule:** When hazard confidence exceeds 85%, the UI injects a bold red **Emergency Action Banner** with step-by-step containment instructions before displaying repair solutions.

### 3.3 Diagnostic Output Data Contract
The AI returns a strictly typed JSON payload structured as follows:

```json
{
  "diagnosticSummary": {
    "title": "Air Conditioner Compressor Running Without Cooling",
    "probableRootCause": "Failed Dual Run Capacitor or Refrigerant (Freon) Undercharge",
    "confidenceScore": 0.91,
    "severity": "MODERATE",
    "urgencyLevel": "MEDIUM"
  },
  "safetyWarning": {
    "hasHazard": false,
    "containmentSteps": [
      "Turn off the air conditioner from the isolator switch to prevent compressor burnout."
    ]
  },
  "diyFeasibility": {
    "isDiyRecommended": false,
    "diyRiskReason": "Requires high-voltage discharge testing and refrigerant manifold gauge sets."
  },
  "billOfMaterialsEstimate": [
    {
      "item": "Dual Run Capacitor (35+5 uF)",
      "estimatedCostMin": 6500,
      "estimatedCostMax": 12000,
      "currency": "NGN"
    },
    {
      "item": "R410A Refrigerant Top-up (if leaking)",
      "estimatedCostMin": 15000,
      "estimatedCostMax": 25000,
      "currency": "NGN"
    }
  ],
  "estimatedLaborCost": {
    "min": 8000,
    "max": 15000,
    "currency": "NGN"
  },
  "requiredTradeSlug": "air-conditioning-refrigeration",
  "requiredSkillSlugs": ["hvac-repair", "refrigerant-charging", "electrical-troubleshooting"]
}
```

---

## 4. Intelligent Artisan Matching Engine

Once the AI diagnoses the issue and extracts the requisite `tradeSlug`, `skillSlugs`, and `severity`, the matching engine executes a multi-stage scoring algorithm.

```
+--------------------------------------------------------------------------+
|                     5-STAGE ARTISAN MATCHING ENGINE                      |
|                                                                          |
|  [AI Diagnosis Payload]                                                  |
|       │                                                                  |
|  Stage 1: Trade & Skill Hard Filter                                      |
|       │ Category == 'HVAC' & Skills IN ['hvac-repair', ...]              |
|       ▼                                                                  |
|  Stage 2: Spatial & Proximity Gate                                       |
|       │ PostGIS ST_DWithin / Haversine <= 15 km from client GPS          |
|       ▼                                                                  |
|  Stage 3: Availability & Capacity Filter                                 |
|       │ isAvailable == true & active_contracts < max_concurrency         |
|       ▼                                                                  |
|  Stage 4: Multi-Factor Weighted Scoring Formula                          |
|       │ Score = (0.35 * Proximity) + (0.25 * Rating) +                   |
|       │         (0.20 * PortfolioSim) + (0.10 * KYC) + (0.10 * Price)     |
|       ▼                                                                  |
|  Stage 5: Top 3 Artisan Dossier Generation & 1-Click Booking             |
+--------------------------------------------------------------------------+
```

### 4.1 The 5-Pillar Matching Formula
Each candidate artisan is scored on a normalized scale from `0.00` to `100.00`:

$$\text{FinalScore} = (W_d \cdot S_{\text{dist}}) + (W_r \cdot S_{\text{rating}}) + (W_p \cdot S_{\text{portfolio}}) + (W_k \cdot S_{\text{kyc}}) + (W_c \cdot S_{\text{completion}})$$

#### Weight Distribution:
1. **Distance Score ($W_d = 0.35$):**
   $$S_{\text{dist}} = \max\left(0, 100 \cdot \left(1 - \frac{\text{Distance in km}}{\text{Max Search Radius (e.g. 20km)}}\right)\right)$$
   Artisans located 2km away score substantially higher than artisans 18km away, prioritizing fast arrival and reduced transit fees.
2. **Reputation & Review Score ($W_r = 0.25$):**
   Combines `ratingAvg` (Bayesian adjusted for review count) and recent customer feedback sentiment.
3. **Portfolio Semantic Similarity ($W_p = 0.20$):**
   Uses vector embeddings comparing the current job's diagnostic summary with previous jobs and portfolio items completed by the artisan. (e.g., An electrician who has documented 30 "distribution board wire replacements" gets a significant boost).
4. **Verification & KYC Status ($W_k = 0.10$):**
   Fully vetted artisans with verified identity documents (NIN, BVN, address verification) receive top priority.
5. **Historical Completion Velocity ($W_c = 0.10$):**
   Measures contract completion rate, low dispute ratio, and prompt response rate on the platform.

### 4.2 The "Artisan Job Dossier" (Pre-Job Briefing Pack)
When the client approves an artisan match and initiates an inquiry or booking, Fixmate generates an automated **Artisan Briefing Dossier**:
- **Problem Overview:** AI diagnosis in clear, professional terminology.
- **Client Voice/Visual Assets:** Audio snippet + photo attachments with AI-highlighted damage areas.
- **Recommended Tools & Parts:** List of specific replacement components (e.g., "Bring 35uF dual capacitor, digital multimeter, R410A gauges").
- **Client Access Notes:** Location, parking details, power/water access notes.

*Result:* The artisan arrives with the correct parts on trip #1, eliminating the notorious "let me go to market and inspect first" multiple-trip delay.

---

## 5. Technical Implementation Details & Code Blueprints

### 5.1 Prisma Database Schema Extensions
Add the following models into `prisma/schema.prisma` to support sessions, media attachments, and matching records:

```prisma
// ==============================================================================
// AI DIAGNOSTIC & MATCHING ENGINE MODELS
// ==============================================================================

enum DiagnosticInputType {
  TEXT
  VOICE
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
  transcribedAudio   String?              @map("transcribed_audio") @db.Text
  voiceAudioUrl      String?              @map("voice_audio_url") @db.Text
  
  // Diagnostic Output
  diagnosticTitle    String?              @map("diagnostic_title") @db.VarChar(255)
  probableCause      String?              @map("probable_cause") @db.Text
  severity           DiagnosticSeverity   @default(LOW)
  urgency            DiagnosticUrgency    @default(ROUTINE)
  isHazardous        Boolean              @default(false) @map("is_hazardous")
  safetyInstructions Json                 @default("[]") @map("safety_instructions")
  diyAllowed         Boolean              @default(false) @map("diy_allowed")
  diyGuide           String?              @map("diy_guide") @db.Text
  
  // Financial Estimations
  estimatedBOM       Json                 @default("[]") @map("estimated_bom")
  estimatedLaborMin  Decimal?             @map("estimated_labor_min") @db.Decimal(12, 2)
  estimatedLaborMax  Decimal?             @map("estimated_labor_max") @db.Decimal(12, 2)
  currency           String               @default("NGN") @db.VarChar(10)
  
  // Categorization
  matchedCategoryId  Int?                 @map("matched_category_id")
  recommendedSkills  Json                 @default("[]") @map("recommended_skills")
  
  // Geo coordinates at diagnostic time
  clientLatitude     Decimal?             @map("client_latitude") @db.Decimal(10, 8)
  clientLongitude    Decimal?             @map("client_longitude") @db.Decimal(11, 8)
  clientAddress      String?              @map("client_address") @db.Text
  
  // Conversion Tracking
  convertedToJobId   String?              @unique @map("converted_to_job_id") @db.Uuid
  selectedArtisanId  String?              @map("selected_artisan_id") @db.Uuid
  
  createdAt          DateTime             @default(now()) @map("created_at") @db.Timestamptz
  updatedAt          DateTime             @updatedAt @map("updated_at") @db.Timestamptz

  // Relations
  user               User?                @relation(fields: [userId], references: [id], onDelete: SetNull)
  category           JobCategory?         @relation(fields: [matchedCategoryId], references: [id])
  mediaFiles         DiagnosticMedia[]
  recommendations    DiagnosticMatch[]

  @@index([userId])
  @@index([matchedCategoryId])
  @@index([createdAt])
  @@map("ai_diagnostic_sessions")
}

model DiagnosticMedia {
  id                   String              @id @default(uuid()) @db.Uuid
  diagnosticSessionId  String              @map("diagnostic_session_id") @db.Uuid
  mediaUrl             String              @map("media_url") @db.Text
  mediaType            String              @map("media_type") @db.VarChar(50) // 'image/jpeg', 'audio/webm'
  fileSize             Int                 @map("file_size")
  aiVisualSummary      String?             @map("ai_visual_summary") @db.Text
  annotatedBoxes       Json                @default("[]") @map("annotated_boxes")
  createdAt            DateTime            @default(now()) @map("created_at") @db.Timestamptz

  session              AiDiagnosticSession @relation(fields: [diagnosticSessionId], references: [id], onDelete: Cascade)

  @@index([diagnosticSessionId])
  @@map("diagnostic_media")
}

model DiagnosticMatch {
  id                  String              @id @default(uuid()) @db.Uuid
  diagnosticSessionId String              @map("diagnostic_session_id") @db.Uuid
  artisanProfileId    String              @map("artisan_profile_id") @db.Uuid
  matchScore          Decimal             @map("match_score") @db.Decimal(5, 2)
  distanceKm          Decimal?            @map("distance_km") @db.Decimal(6, 2)
  matchRationale      String?             @map("match_rationale") @db.Text
  isContacted         Boolean             @default(false) @map("is_contacted")
  createdAt           DateTime            @default(now()) @map("created_at") @db.Timestamptz

  session             AiDiagnosticSession @relation(fields: [diagnosticSessionId], references: [id], onDelete: Cascade)
  artisan             ArtisanProfile      @relation(fields: [artisanProfileId], references: [id], onDelete: Cascade)

  @@index([diagnosticSessionId])
  @@index([artisanProfileId])
  @@map("diagnostic_matches")
}
```

### 5.2 Diagnostic AI Controller & Service Implementation
Create `src/services/ai-diagnostic.service.js`:

```javascript
// src/services/ai-diagnostic.service.js
import { GoogleGenAI } from '@google/genai';
import prisma from '../config/prisma.js';
import cloudinary from '../config/cloudinary.js';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export class AiDiagnosticService {
  /**
   * Process multimodal inquiry (text, images, voice transcript)
   */
  static async analyzeInquiry({ textPrompt, audioTranscript, imageUrls, clientCoords }) {
    const combinedText = [
      textPrompt ? `User Description: ${textPrompt}` : '',
      audioTranscript ? `Voice Note Transcription: ${audioTranscript}` : ''
    ].filter(Boolean).join('\n');

    const systemInstruction = `
You are the Fixmate Diagnostic AI Specialist. You analyze home repair, automotive, electrical, plumbing, generator, and appliance faults in West African residential settings.
Your job is to:
1. Identify the probable problem and root causes based on descriptions and images.
2. Determine urgency and critical safety hazards (e.g. fire, electric shock, toxic fumes, active flooding).
3. Provide immediate containment advice (e.g., turn off the main circuit breaker).
4. Decide if safe for DIY or if a licensed artisan is mandatory.
5. Provide a realistic Bill of Materials (BOM) in Nigerian Naira (NGN) with estimated labor costs.
6. Map the issue to an appropriate trade category and relevant skills.

Return your response strictly in JSON according to this structure:
{
  "diagnosticTitle": string,
  "probableCause": string,
  "severity": "LOW" | "MODERATE" | "HIGH" | "CRITICAL",
  "urgency": "ROUTINE" | "SCHEDULED" | "URGENT" | "EMERGENCY",
  "isHazardous": boolean,
  "safetyInstructions": string[],
  "diyAllowed": boolean,
  "diyGuide": string | null,
  "estimatedBOM": [{ "item": string, "estimatedCostMin": number, "estimatedCostMax": number }],
  "estimatedLaborMin": number,
  "estimatedLaborMax": number,
  "categorySlug": string,
  "recommendedSkillSlugs": string[]
}
`;

    // Prepare multimodal contents
    const contents = [];
    if (combinedText) {
      contents.push({ text: combinedText });
    }

    // Attach images as inline parts or remote fetch
    for (const url of imageUrls) {
      contents.push({
        image: { uri: url }
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.2
      }
    });

    const parsedResult = JSON.parse(response.text);
    return parsedResult;
  }

  /**
   * Match top 3 fitting artisans based on diagnostic results and client coordinates
   */
  static async matchArtisans({ categorySlug, requiredSkills, clientLat, clientLng, limit = 3 }) {
    // 1. Fetch category
    const category = await prisma.jobCategory.findUnique({
      where: { slug: categorySlug },
      include: { skills: true }
    });

    // 2. Query available artisans in this trade
    const artisans = await prisma.artisanProfile.findMany({
      where: {
        isAvailable: true,
        user: { status: 'ACTIVE' },
        skills: {
          some: {
            skill: {
              slug: { in: requiredSkills.length > 0 ? requiredSkills : [categorySlug] }
            }
          }
        }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            avatarUrl: true,
            kycStatus: true
          }
        },
        skills: { include: { skill: true } },
        portfolios: { take: 3 }
      }
    });

    // 3. Compute Distance and Final Scores
    const scoredArtisans = artisans.map((artisan) => {
      let distanceKm = 10.0; // Default fallback if no GPS
      if (clientLat && clientLng && artisan.latitude && artisan.longitude) {
        distanceKm = calculateHaversineDistance(
          parseFloat(clientLat),
          parseFloat(clientLng),
          parseFloat(artisan.latitude),
          parseFloat(artisan.longitude)
        );
      }

      // Distance score: 100 for 0km, 0 for >= 25km
      const distScore = Math.max(0, 100 * (1 - distanceKm / 25.0));

      // Rating score: 5.0 is 100
      const ratingScore = parseFloat(artisan.ratingAvg) * 20.0;

      // Experience & Verification score
      const kycBonus = artisan.user.kycStatus === 'APPROVED' ? 15 : 0;
      const jobCountScore = Math.min(30, artisan.completedJobsCount * 3);

      const totalScore = (0.40 * distScore) + (0.30 * ratingScore) + (0.15 * kycBonus) + (0.15 * jobCountScore);

      return {
        artisan,
        distanceKm: Math.round(distanceKm * 10) / 10,
        matchScore: Math.round(totalScore * 10) / 10
      };
    });

    // Sort by match score descending
    scoredArtisans.sort((a, b) => b.matchScore - a.matchScore);
    return scoredArtisans.slice(0, limit);
  }
}

function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
```

### 5.3 Frontend Multimodal Input Component (React 19 + Tailwind)

```tsx
// frontend/src/components/ai/AiDiagnosticWidget.tsx
import React, { useState, useRef } from 'react';
import { Mic, Image as ImageIcon, Send, AlertTriangle, CheckCircle, Wrench, Shield } from 'lucide-react';
import axios from 'axios';

export const AiDiagnosticWidget: React.FC = () => {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<any | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // 1. Audio Recording Controls
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Microphone permission denied', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // 2. Submission Handler
  const handleDiagnose = async () => {
    setIsLoading(true);
    const formData = new FormData();
    if (text) formData.append('textPrompt', text);
    if (audioBlob) formData.append('voiceAudio', audioBlob, 'voicenote.webm');
    images.forEach((img) => formData.append('photos', img));

    // Append geo-coordinates if enabled
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          formData.append('latitude', position.coords.latitude.toString());
          formData.append('longitude', position.coords.longitude.toString());
          submitFormData(formData);
        },
        () => submitFormData(formData)
      );
    } else {
      submitFormData(formData);
    }
  };

  const submitFormData = async (formData: FormData) => {
    try {
      const res = await axios.post('/api/ai/diagnose', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setDiagnosticResult(res.data.data);
    } catch (error) {
      console.error('Diagnostic error', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
          <Wrench className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Artifix Diagnostic Copilot</h2>
          <p className="text-sm text-slate-400">Describe, photograph, or record what went wrong</p>
        </div>
      </div>

      {/* Input Box */}
      <div className="space-y-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="E.g., My AC indoor unit is leaking water and the compressor outside makes a humming sound..."
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm focus:outline-none focus:border-emerald-500 min-h-[100px]"
        />

        {/* Media Control Toolbar */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {/* Voice Record Button */}
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
                isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
            >
              <Mic className="w-4 h-4" />
              {isRecording ? 'Stop Recording' : audioBlob ? 'Re-record Voice' : 'Voice Note'}
            </button>

            {/* Photo Upload Input */}
            <label className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-medium cursor-pointer transition">
              <ImageIcon className="w-4 h-4" />
              <span>{images.length > 0 ? `${images.length} Photos` : 'Add Photos'}</span>
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files && setImages(Array.from(e.target.files))}
              />
            </label>
          </div>

          <button
            onClick={handleDiagnose}
            disabled={isLoading || (!text && !audioBlob && images.length === 0)}
            className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg transition"
          >
            {isLoading ? 'Analyzing...' : 'Diagnose Fault'}
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Result Cards Display */}
      {diagnosticResult && (
        <div className="mt-8 border-t border-slate-800 pt-6 space-y-6">
          {/* Safety Alert (If Hazardous) */}
          {diagnosticResult.isHazardous && (
            <div className="bg-red-500/10 border border-red-500/40 rounded-xl p-4 flex gap-3 text-red-200">
              <AlertTriangle className="w-6 h-6 shrink-0 text-red-400" />
              <div>
                <h4 className="font-bold text-red-400">Critical Hazard Detected</h4>
                <ul className="text-xs list-disc list-inside mt-1 space-y-1">
                  {diagnosticResult.safetyInstructions.map((s: string, i: number) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Diagnostic Summary */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Diagnosis</span>
            <h3 className="text-lg font-bold text-white mt-1">{diagnosticResult.diagnosticTitle}</h3>
            <p className="text-sm text-slate-300 mt-2">{diagnosticResult.probableCause}</p>

            {/* Estimated Price Range */}
            <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-800 pt-3">
              <div>
                <span className="text-xs text-slate-400">Estimated Labor Range:</span>
                <p className="text-sm font-semibold text-emerald-400">
                  ₦{diagnosticResult.estimatedLaborMin?.toLocaleString()} - ₦{diagnosticResult.estimatedLaborMax?.toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-400">DIY Feasibility:</span>
                <p className="text-sm font-semibold text-slate-200">
                  {diagnosticResult.diyAllowed ? 'Safe for DIY' : 'Professional Required'}
                </p>
              </div>
            </div>
          </div>

          {/* Matched Artisans List */}
          <div>
            <h4 className="font-bold text-white mb-3">Top Recommended Artisans Near You</h4>
            <div className="space-y-3">
              {diagnosticResult.matchedArtisans?.map((match: any) => (
                <div key={match.artisan.id} className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-3">
                    <img
                      src={match.artisan.user.avatarUrl || '/avatar-placeholder.png'}
                      alt={match.artisan.businessName}
                      className="w-12 h-12 rounded-full object-cover border border-slate-700"
                    />
                    <div>
                      <h5 className="font-semibold text-white">{match.artisan.businessName || `${match.artisan.firstName} ${match.artisan.lastName}`}</h5>
                      <p className="text-xs text-slate-400">
                        {match.distanceKm} km away • ⭐ {match.artisan.ratingAvg} ({match.artisan.reviewCount} reviews)
                      </p>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white rounded-lg transition">
                    Book with Escrow
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
```

---

## 6. Strategic Extra Features to Elevate the Product

### Feature 1: "Artisan Prep Dossier" & Automated Bill of Materials (BOM)
- **Problem:** Artisans arrive empty-handed just to inspect, charge an inspection fee, and take 3 hours going to market to buy spare parts.
- **Solution:** Fixmate compiles an **Artisan Prep Pack**:
  * Exact appliance model identified from the nameplate photo.
  * Prescribed list of parts to buy in advance with local market price benchmarks.
  * Recommended specialty tools required (e.g., manifold gauges, pipe expanders).
- **Result:** The artisan arrives ready to resolve the fault on Trip #1, slashing repair turnaround by 50%.

### Feature 2: Anti-Gouging "Fair Price Radar"
- **Problem:** Unscrupulous artisans charge arbitrary fees when they observe a client living in an affluent neighborhood or acting uncertain about technical terms.
- **Solution:** Fixmate displays an objective **Fair Price Radar** showing:
  * Minimum, average, and maximum labor fees charged across Fixmate's historical contract database for this exact fault in this LGA/City.
  * Part cost index updated from local wholesale markets (Alaba International, Ladipo, Odunade).
- Artisans submitting bids outside a 25% deviation corridor must provide written line-item justifications.

### Feature 3: Interactive Visual AR / Photo Annotation
- **Problem:** Text explanations of where a component is located ("the bleed valve under the filter") confuse users.
- **Solution:** The AI returns SVG bounding box coordinates on the uploaded photo. The UI renders an interactive overlay with a glowing target: *"Turn this blue valve 90 degrees clockwise to stop the water."*

### Feature 4: Two-Way Multimodal Language Translation for Artisans
- **Problem:** While the client may write inquiries in formal British English, the artisan may be more comfortable listening to explanations in Nigerian Pidgin, Yoruba, Igbo, or Hausa.
- **Solution:** The AI converts the client's formal problem statement into a 30-second localized audio voice note (Text-to-Speech) sent directly to the artisan's WhatsApp or Fixmate Mobile PWA.
  * *Example:* "Oga Chinedu, the customer get LG 1.5HP inverter AC for Lekki Phase 1. The fan dey blow but e no dey cold. Likely capacitor don blow. Carry 35uF capacitor along."

### Feature 5: AI Post-Repair Verification (Escrow Milestone Protection)
- **Problem:** In milestone-based escrow contracts, clients often do not know whether the repair was executed properly before authorizing fund release.
- **Solution:** The artisan must upload a "Completed Work Photo/Video" before requesting milestone release. Fixmate's AI performs a **Diff Comparison** (Before vs After):
  * Verifies that the new part is installed.
  * Checks that charred wires were re-insulated with heat shrink/terminal blocks.
  * Confirms no active leaks or visible hazards remain.
  * Generates a certificate of completion stored immutably in the contract audit trail.

### Feature 6: Predictive Home Maintenance & "Fixmate Logbook"
- **Problem:** Homeowners only react when catastrophic failures occur.
- **Solution:** Every diagnostic inquiry is saved in the property's digital logbook. When an AC has had its capacitor replaced twice in 6 months, the AI alerts the homeowner:
  *"Your power supply likely has irregular voltage surges. We recommend installing an AC surge protector to prevent compressor breakdown."*

### Feature 7: Emergency 1-Tap SOS Dispatch
- **Problem:** Bursts in main water lines, sparking distribution boxes, or gas leaks require sub-15-minute response times, not an asynchronous quotation workflow.
- **Solution:** If the AI flags `urgency == "EMERGENCY"` and `isHazardous == true`, the UI switches to **SOS Mode**:
  * Bypasses the 3-proposal bidding flow.
  * Pings the 3 closest verified emergency on-call artisans simultaneously via Web Push + SMS + Automated voice alert.
  * The first artisan to accept receives immediate turn-by-turn navigation, with emergency callout fees locked in escrow.

---

## 7. Implementation Roadmap & Milestones

```
   WEEKS 1-3          WEEKS 4-6          WEEKS 7-9         WEEKS 10-12
┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   PHASE 1    │   │   PHASE 2    │   │   PHASE 3    │   │   PHASE 4    │
│  Core MVP    │──▶│ Smart Vector │──▶│ Voice & Dialect│──▶│ Hardening &  │
│ Multimodal   │   │ & PostGIS    │   │ Conversational│  │ Escrow / Live │
│ Diagnostic   │   │ Match Engine │   │ Audio Loop   │   │ Production   │
└──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘
```

### Phase 1: Core Multimodal Diagnostic MVP (Weeks 1 to 3)
- Create database schema migrations for `AiDiagnosticSession` and `DiagnosticMedia`.
- Build `AiDiagnosticService` integrating Gemini 2.0 Flash with JSON schema validation.
- Integrate Cloudinary image compression and storage.
- Implement basic rule-based artisan filtering by category and city.
- Deploy frontend diagnostic dialog with camera and photo upload in React/Vite.

### Phase 2: Geospatial & Multi-Factor Matching Engine (Weeks 4 to 6)
- Implement Haversine distance calculations and spatial indexing on `ArtisanProfile`.
- Build the multi-factor scoring algorithm (Distance + Rating + KYC + Completion history).
- Create the "Top 3 Matched Artisans" preview cards with real-time ETA estimates.
- Build the 1-click **"Convert Diagnosis to Job/Contract"** pipeline into Fixmate's existing `job.service.js`.

### Phase 3: Conversational Voice Loop & Regional Dialect Tuning (Weeks 7 to 9)
- Implement frontend Web Audio recorder with visual waveform feedback.
- Build server-side audio ingestion pipe streaming to Whisper/Gemini Audio.
- Fine-tune prompt dictionaries for Nigerian Pidgin and West African colloquialisms.
- Build the interactive Clarification Loop (follow-up diagnostic questions for ambiguous complaints).
- Implement the "Artisan Prep Dossier" generator for matched contractors.

### Phase 4: Production Hardening, Escrow Linking & Rollout (Weeks 10 to 12)
- Connect diagnostic estimates to Fixmate's escrow smart contracts (Monad USDC or Paystack fiat funding).
- Add Emergency SOS dispatch for critical hazards.
- Implement rate limiting, Redis response caching, and prompt token budget controls.
- End-to-end integration tests (`scripts/test-all-endpoints.js`) covering diagnostic and matching flows.
- PostHog telemetry tracking conversion rates from *Inquiry -> Diagnosis -> Match -> Escrow Funded*.

---

## 8. Performance, Cost Optimization & Resilience Matrix

| Dimension | Target Metric | Engineering Strategy |
| :--- | :--- | :--- |
| **Diagnostic Latency** | $< 2.5\text{ seconds}$ | Use Gemini 2.0 Flash with prompt caching; stream intermediate status updates ("Analyzing image...", "Calculating price radar...") to the frontend. |
| **Voice Transcription Latency** | $< 1.8\text{ seconds}$ | Compress voice notes client-side to Opus/WebM at 32kbps mono; stream directly to the inference endpoint. |
| **AI Inference Cost** | $< \$0.004\text{ / diagnosis}$ | Enforce strict max token outputs ($< 800$ tokens); downscale images to max 1080p before sending to LLM; cache recurring diagnostic solutions (e.g., standard "AC capacitor failure" prompts). |
| **Matching Engine Latency** | $< 350\text{ ms}$ | Pre-filter artisans using indexed database queries (`category_id`, `state`, `lgaCity`, `is_available`) before computing mathematical distance and ranking scores in memory. |
| **Fault Tolerance & Fallback** | $99.9\%\text{ Uptime}$ | If the AI multimodal endpoint times out or fails, gracefully degrade to keyword-based category matching and connect the client with Fixmate human support triage. |
| **Data Privacy & Compliance** | NDPR / GDPR compliant | Strip EXIF GPS metadata from public URLs; anonymize client phone numbers until an artisan is confirmed; encrypt voice note files in transit and at rest. |

---

## 9. Next Steps for Implementation

1. **Database Migration:** Apply the `AiDiagnosticSession` and `DiagnosticMedia` models to `prisma/schema.prisma` and run `npm run prisma:migrate`.
2. **Backend Service:** Create `src/services/ai-diagnostic.service.js` and configure environment keys (`GEMINI_API_KEY`).
3. **API Routes:** Register `/api/ai/diagnose`, `/api/ai/match-artisans`, and `/api/ai/convert-to-job` in `src/routes`.
4. **Frontend Interface:** Add the interactive multimodal widget (`AiDiagnosticWidget.tsx`) to the client dashboard in `frontend/src`.
