# Phase 2: Geospatial & Multi-Factor Matching Engine (Weeks 4 – 6)
## Detailed Engineering & Implementation Plan

---

## 1. Phase Objective & Mathematical Foundations

### 1.1 Goal
Transform raw diagnostic outputs into high-precision, automated artisan recommendations. Instead of naive keyword or broad city matching, Phase 2 implements a **dynamic 5-pillar ranking engine** combining geospatial proximity, Bayesian-adjusted reputation scores, semantic portfolio similarity via vector embeddings, verified KYC tiers, and artisan workload availability.

### 1.2 Mathematical Formulation of the Matching Engine
Every eligible artisan candidate $a$ in trade category $C$ is scored according to:

$$\text{Score}(a) = w_d \cdot S_{\text{dist}}(a) + w_r \cdot S_{\text{rating}}(a) + w_p \cdot S_{\text{portfolio}}(a) + w_k \cdot S_{\text{kyc}}(a) + w_v \cdot S_{\text{velocity}}(a)$$

Where:
$$\sum w_i = 0.35 + 0.25 + 0.20 + 0.10 + 0.10 = 1.00$$

#### Component Formulations:
1. **Proximity Score ($S_{\text{dist}}$):**
   $$S_{\text{dist}}(a) = \max\left(0, 100 \cdot \left(1 - \frac{D(u, a)}{R_{\max}}\right)\right)$$
   Where $D(u, a)$ is the Haversine distance between client $u$ and artisan $a$, and $R_{\max} = 20\text{ km}$ (configurable per urban density).
2. **Bayesian Weighted Rating ($S_{\text{rating}}$):**
   $$S_{\text{rating}}(a) = 20 \cdot \left(\frac{v \cdot R + m \cdot C}{v + m}\right)$$
   Where $R$ is artisan's average rating, $v$ is review count, $m = 5$ (minimum review threshold), and $C = 3.5$ (prior mean platform rating). Multiplied by 20 to normalize to a 0–100 scale.
3. **Semantic Portfolio Similarity ($S_{\text{portfolio}}$):**
   $$S_{\text{portfolio}}(a) = 100 \cdot \max_{j \in \text{Jobs}(a)} \left(\frac{\mathbf{E}_{\text{diag}} \cdot \mathbf{E}_{j}}{\|\mathbf{E}_{\text{diag}}\| \|\mathbf{E}_{j}\|}\right)$$
   Cosine similarity between the current diagnostic embedding and the artisan's historical portfolio job descriptions.
4. **KYC & Verification Score ($S_{\text{kyc}}$):**
   $$S_{\text{kyc}}(a) = \begin{cases} 100, & \text{if KYC status } = \text{APPROVED} \\ 40, & \text{if KYC status } = \text{PENDING} \\ 0, & \text{otherwise} \end{cases}$$
5. **Completion Velocity & Reliability ($S_{\text{velocity}}$):**
   $$S_{\text{velocity}}(a) = 100 \cdot \left(1 - \text{DisputeRatio}(a)\right) \cdot \left(\frac{\text{CompletedJobs}(a)}{\text{CompletedJobs}(a) + 2}\right)$$

---

## 2. Technical Architecture & Database Enhancements

```
┌────────────────────────────────────────────────────────┐
│               DIAGNOSTIC SESSION OUTPUT                │
│  (Category: 'Plumbing', Skills: ['leak-repair'], GPS)  │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│             STAGE 1: HARD FILTER (SQL QUERY)           │
│ • isAvailable == true                                  │
│ • user.status == 'ACTIVE'                              │
│ • artisan.skills INTERSECT requiredSkills              │
│ • distance <= 20km (Haversine / Bounding Box)          │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│       STAGE 2: VECTOR EMBEDDINGS (SEMANTIC MATCH)      │
│ • Generate text-embedding-004 / ada-002 for diagnosis  │
│ • Cosine similarity search on artisan_portfolios       │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│          STAGE 3: MULTI-FACTOR WEIGHTED RANKING        │
│ • Compute Final Score (0 - 100)                        │
│ • Sort Descending -> Take Top 3                        │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│          STAGE 4: AUTOMATED ARTISAN DOSSIER            │
│ • Generate structured brief for artisan on arrival     │
│ • Create 1-click Draft Job with pre-filled escrow sum  │
└────────────────────────────────────────────────────────┘
```

---

## 3. Step-by-Step Implementation Breakdown

### 3.1 Step 1: Database Setup & Geospatial Indexing (Days 1–3)
Ensure PostgreSQL indices on latitude and longitude are optimized, and create the `diagnostic_matches` table:

```prisma
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

Add compound geospatial indices in PostgreSQL:
```sql
CREATE INDEX idx_artisan_coords ON artisan_profiles (latitude, longitude) WHERE is_available = true;
```

---

### 3.2 Step 2: Matching Engine Service (`src/services/matching-engine.service.js`) (Days 4–7)
Implement the core ranking logic:

```javascript
import prisma from '../config/prisma.js';

export class MatchingEngineService {
  /**
   * Run 5-pillar scoring algorithm
   */
  static async findTopMatches({ diagnosticSessionId, categorySlug, skillSlugs, clientLat, clientLng, limit = 3 }) {
    const maxRadiusKm = 20.0;

    // 1. Fetch eligible candidate artisans in trade
    const candidates = await prisma.artisanProfile.findMany({
      where: {
        isAvailable: true,
        user: { status: 'ACTIVE' },
        skills: {
          some: {
            skill: {
              slug: { in: skillSlugs.length > 0 ? skillSlugs : [categorySlug] }
            }
          }
        }
      },
      include: {
        user: {
          select: { id: true, email: true, phone: true, avatarUrl: true, kycStatus: true }
        },
        skills: { include: { skill: true } },
        portfolios: { take: 3 }
      }
    });

    if (!candidates || candidates.length === 0) {
      return [];
    }

    // 2. Compute individual components
    const scoredList = candidates.map(artisan => {
      // A. Distance & Proximity Score
      let distanceKm = 10.0;
      if (clientLat && clientLng && artisan.latitude && artisan.longitude) {
        distanceKm = calculateHaversine(
          parseFloat(clientLat),
          parseFloat(clientLng),
          parseFloat(artisan.latitude),
          parseFloat(artisan.longitude)
        );
      }
      const distScore = Math.max(0, 100 * (1 - (distanceKm / maxRadiusKm)));

      // B. Bayesian Rating Score
      const v = artisan.reviewCount;
      const R = parseFloat(artisan.ratingAvg);
      const m = 5;
      const C = 3.5;
      const bayesianRating = (v * R + m * C) / (v + m);
      const ratingScore = bayesianRating * 20.0; // 5.0 -> 100

      // C. KYC Verification
      const kycScore = artisan.user.kycStatus === 'APPROVED' ? 100 : (artisan.user.kycStatus === 'PENDING' ? 40 : 0);

      // D. Completion Velocity
      const compCount = artisan.completedJobsCount;
      const velocityScore = 100 * (compCount / (compCount + 2));

      // E. Portfolio Match Baseline
      const portfolioScore = artisan.portfolios.length > 0 ? 80 : 40;

      // Weighted Total Score
      const totalScore = (0.35 * distScore) + 
                         (0.25 * ratingScore) + 
                         (0.20 * portfolioScore) + 
                         (0.10 * kycScore) + 
                         (0.10 * velocityScore);

      return {
        artisanProfileId: artisan.id,
        artisan,
        distanceKm: Math.round(distanceKm * 10) / 10,
        matchScore: Math.round(totalScore * 10) / 10,
        rationale: `${Math.round(distanceKm)}km away • ${artisan.ratingAvg}★ rating • ${artisan.completedJobsCount} jobs completed`
      };
    });

    // 3. Filter within max distance (if coordinates exist) & sort descending
    const filtered = scoredList.filter(item => item.distanceKm <= maxRadiusKm);
    const sorted = (filtered.length > 0 ? filtered : scoredList).sort((a, b) => b.matchScore - a.matchScore);
    const topMatches = sorted.slice(0, limit);

    // 4. Persist match records in database
    await Promise.all(topMatches.map(m => 
      prisma.diagnosticMatch.create({
        data: {
          diagnosticSessionId,
          artisanProfileId: m.artisanProfileId,
          matchScore: m.matchScore,
          distanceKm: m.distanceKm,
          matchRationale: m.rationale
        }
      })
    ));

    return topMatches;
  }
}

function calculateHaversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
```

---

### 3.3 Step 3: Artisan Job Dossier Generation (Days 8–10)
When a client selects an artisan, the system compiles a standardized **Artisan Job Dossier**:
- Generates a PDF/Web Briefing Card.
- Outlines exact required tools, parts to purchase in advance, safety hazards, and customer contact notes.
- Pushes the dossier directly to the artisan's dashboard via Socket.io and Web Push.

---

### 3.4 Step 4: 1-Click "Diagnosis to Job Draft" Conversion (Days 11–12)
Connect the diagnostic output with `src/services/job.service.js`:
- Endpoint: `POST /api/ai/session/:sessionId/convert-to-job`
- Pre-fills:
  * Title: `session.diagnosticTitle`
  * Description: Diagnostic summary + parts list + safety instructions
  * Budget: Set to `session.estimatedLaborMax`
  * CategoryId: `session.matchedCategoryId`
  * PreferredArtisanId: `match.artisanProfileId`
- Transition status directly to `OPEN` or send direct contract proposal.

---

### 3.5 Step 5: Testing & Simulation Benchmark (Days 13–15)
Run simulated matching tests across major Nigerian cities:
1. **Lagos Testing Grid:** Lekki Phase 1, Ikeja GRA, Surulere, Yaba, Victoria Island.
2. **Abuja Testing Grid:** Wuse II, Maitama, Garki, Jabi.
3. **Port Harcourt Testing Grid:** GRA Phase 2, Peter Odili Road.
4. Verify that distance filtering prioritizes local artisans within 5km before expanding to 15km.

---

## 4. Phase 2 Deliverables Checklist

- [ ] `DiagnosticMatch` database model migrated and active.
- [ ] 5-pillar mathematical matching algorithm implemented and unit tested.
- [ ] Spatial index benchmarks confirmed ($< 150\text{ms}$ query execution time on 10,000 artisan records).
- [ ] "Diagnosis to Job Draft" 1-click conversion endpoint live.
- [ ] Top 3 Matched Artisan UI cards integrated in frontend.
