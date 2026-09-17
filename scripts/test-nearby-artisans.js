import http from 'http';
import app from '../src/app.js';
import prisma from '../src/config/db.js';
import { GeoUtils } from '../src/utils/geo.utils.js';
import { SphericalCosineStrategy } from '../src/utils/spatial-strategies/spherical-cosine.strategy.js';
import { HaversineStrategy } from '../src/utils/spatial-strategies/haversine.strategy.js';

let server;
let baseUrl = '';

async function startTestServer() {
  return new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}/api/v1`;
      resolve();
    });
  });
}

async function stopTestServer() {
  return new Promise((resolve) => {
    if (server) server.close(resolve);
    else resolve();
  });
}

async function runTests() {
  console.log('🧪 =========================================================');
  console.log('🧪 RUNNING GEOLOCATION & SPATIAL ENGINE VERIFICATION SUITE');
  console.log('🧪 =========================================================\n');

  let passed = 0;
  let total = 0;

  async function assertTest(name, fn) {
    total++;
    try {
      await fn();
      console.log(`✅ [${total}] PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ [${total}] FAIL: ${name}`);
      console.error(`   Reason: ${err.message}\n`);
    }
  }

  // -----------------------------------------------------------------
  // SECTION 1: DOMAIN UNIT TESTS (SOLID - Single Responsibility / Math)
  // -----------------------------------------------------------------
  console.log('--- SECTION 1: DOMAIN & MATHEMATICAL STRATEGY UNIT TESTS ---');

  await assertTest('GeoUtils.getBoundingBox calculates accurate envelope', () => {
    const box = GeoUtils.getBoundingBox(6.5244, 3.3792, 10);
    if (!box.minLat || !box.maxLat || !box.minLng || !box.maxLng) {
      throw new Error('Bounding box missing required coordinates');
    }
    if (box.minLat >= 6.5244 || box.maxLat <= 6.5244) {
      throw new Error('Center latitude is outside the computed envelope');
    }
    if (box.minLng >= 3.3792 || box.maxLng <= 3.3792) {
      throw new Error('Center longitude is outside the computed envelope');
    }
  });

  await assertTest('GeoUtils.calculateDistance computes accurate Great Circle distance', () => {
    // Ikeja (6.5952, 3.3512) to Lagos Island (6.5244, 3.3792) is ~8.46km
    const distance = GeoUtils.calculateDistance(6.5952, 3.3512, 6.5244, 3.3792);
    if (Math.abs(distance - 8.46) > 0.1) {
      throw new Error(`Distance calculation deviated: expected ~8.46km, got ${distance}`);
    }
  });

  await assertTest('GeoUtils.fuzzCoordinates provides deterministic, stable obfuscation', () => {
    const id = '550e8400-e29b-41d4-a716-446655440000';
    const first = GeoUtils.fuzzCoordinates(6.5952, 3.3512, id);
    const second = GeoUtils.fuzzCoordinates(6.5952, 3.3512, id);

    if (first.fuzzedLat !== second.fuzzedLat || first.fuzzedLng !== second.fuzzedLng) {
      throw new Error('Geofuzzing is not deterministic for identical entity IDs');
    }

    // Measure offset distance in meters
    const offsetKm = GeoUtils.calculateDistance(6.5952, 3.3512, first.fuzzedLat, first.fuzzedLng);
    const offsetMeters = offsetKm * 1000;

    if (offsetMeters < 140 || offsetMeters > 310) {
      throw new Error(`Fuzzing offset outside expected 150m-300m range: ${offsetMeters.toFixed(0)}m`);
    }
  });

  await assertTest('SphericalCosineStrategy and HaversineStrategy output matches with zero NaN on identical coords', () => {
    const spherical = new SphericalCosineStrategy();
    const haversine = new HaversineStrategy();

    const dSpherical = spherical.calculateDistance(6.5244, 3.3792, 6.5952, 3.3512);
    const dHaversine = haversine.calculateDistance(6.5244, 3.3792, 6.5952, 3.3512);

    if (Math.abs(dSpherical - dHaversine) > 0.01) {
      throw new Error(`Strategies diverged: Spherical=${dSpherical}, Haversine=${dHaversine}`);
    }

    // Defensive clamping test
    const zeroDistance = spherical.calculateDistance(6.5244, 3.3792, 6.5244, 3.3792);
    if (isNaN(zeroDistance) || zeroDistance !== 0) {
      throw new Error(`Zero-distance calculation produced NaN or non-zero: ${zeroDistance}`);
    }
  });

  // -----------------------------------------------------------------
  // SECTION 2: END-TO-END HTTP INTEGRATION TESTS
  // -----------------------------------------------------------------
  console.log('\n--- SECTION 2: END-TO-END HTTP API INTEGRATION TESTS ---');
  await startTestServer();

  // Ensure our database has at least one active artisan with known coordinates (Ikeja)
  const existingProfile = await prisma.artisanProfile.findFirst();
  if (existingProfile) {
    await prisma.artisanProfile.update({
      where: { id: existingProfile.id },
      data: {
        latitude: 6.5952,
        longitude: 3.3512,
        isAvailable: true,
        ratingAvg: 4.8,
        state: 'Lagos',
        lgaCity: 'Ikeja',
        address: 'Plot 12, Commercial Avenue, Ikeja, Lagos',
      },
    });
  }

  await assertTest('GET /profiles/artisans/nearby returns HTTP 200 with proximity distance and sanitized coordinates', async () => {
    // Search within 10km of Ikeja
    const res = await fetch(`${baseUrl}/profiles/artisans/nearby?lat=6.5952&lng=3.3512&radius=10`);
    const json = await res.json();

    if (res.status !== 200) {
      throw new Error(`Expected HTTP 200, got ${res.status}: ${JSON.stringify(json)}`);
    }

    if (!json.success || !json.data || !Array.isArray(json.data.artisans)) {
      throw new Error('Response payload missing standard success envelope or artisans array');
    }

    if (json.data.artisans.length === 0) {
      throw new Error('Expected at least 1 artisan found in Ikeja');
    }

    const artisan = json.data.artisans[0];
    if (typeof artisan.distanceKm !== 'number') {
      throw new Error('Artisan record missing numeric distanceKm');
    }
    if (artisan.displayLatitude == null || artisan.displayLongitude == null) {
      throw new Error('Artisan record missing displayLatitude/displayLongitude');
    }
    if (artisan.latitude !== undefined || artisan.longitude !== undefined) {
      throw new Error('Raw private coordinates were leaked in the public response');
    }
    if (!artisan.isLocationObfuscated) {
      throw new Error('Expected isLocationObfuscated to be true');
    }

    // Verify metadata
    if (!json.data.meta || json.data.meta.radiusKm !== 10) {
      throw new Error('Pagination meta missing or incorrect radiusKm');
    }
  });

  await assertTest('GET /profiles/artisans/nearby enforces radial boundary cutoff', async () => {
    // Search with a tiny radius (0.5km) far away from Ikeja (e.g. Lekki Phase 1: 6.4474, 3.4731)
    const res = await fetch(`${baseUrl}/profiles/artisans/nearby?lat=6.4474&lng=3.4731&radius=0.5`);
    const json = await res.json();

    if (res.status !== 200) {
      throw new Error(`Expected HTTP 200, got ${res.status}`);
    }

    // Artisan in Ikeja is ~25km away from Lekki, so radius 0.5km must exclude them
    if (json.data.artisans.length !== 0) {
      throw new Error(`Expected 0 artisans in 0.5km Lekki radius, got ${json.data.artisans.length}`);
    }
    if (json.data.meta.total !== 0) {
      throw new Error(`Expected meta.total to be 0, got ${json.data.meta.total}`);
    }
  });

  await assertTest('GET /profiles/artisans/nearby returns 400 Bad Request on out-of-range latitude', async () => {
    const res = await fetch(`${baseUrl}/profiles/artisans/nearby?lat=95.5&lng=3.3512`);
    const json = await res.json();

    if (res.status !== 400) {
      throw new Error(`Expected HTTP 400 for latitude 95.5, got ${res.status}`);
    }
  });

  await assertTest('GET /profiles/artisans/nearby returns 400 Bad Request on out-of-range longitude', async () => {
    const res = await fetch(`${baseUrl}/profiles/artisans/nearby?lat=6.5952&lng=195.0`);
    const json = await res.json();

    if (res.status !== 400) {
      throw new Error(`Expected HTTP 400 for longitude 195.0, got ${res.status}`);
    }
  });

  await assertTest('GET /profiles/artisans/nearby returns 400 Bad Request on negative radius', async () => {
    const res = await fetch(`${baseUrl}/profiles/artisans/nearby?lat=6.5952&lng=3.3512&radius=-5`);
    const json = await res.json();

    if (res.status !== 400) {
      throw new Error(`Expected HTTP 400 for radius -5, got ${res.status}`);
    }
  });

  await assertTest('GET /profiles/artisans/nearby returns 400 Bad Request when coordinates are missing', async () => {
    const res = await fetch(`${baseUrl}/profiles/artisans/nearby?radius=15`);
    const json = await res.json();

    if (res.status !== 400) {
      throw new Error(`Expected HTTP 400 when missing lat/lng, got ${res.status}`);
    }
  });

  await assertTest('GET /profiles/artisans/nearby filters by minRating', async () => {
    // Current artisan has rating 4.8
    const highRatingRes = await fetch(`${baseUrl}/profiles/artisans/nearby?lat=6.5952&lng=3.3512&radius=10&minRating=4.5`);
    const highRatingJson = await highRatingRes.json();
    if (highRatingJson.data.artisans.length === 0) {
      throw new Error('Expected artisan to match minRating=4.5');
    }

    const impossibleRatingRes = await fetch(`${baseUrl}/profiles/artisans/nearby?lat=6.5952&lng=3.3512&radius=10&minRating=5.0`);
    const impossibleRatingJson = await impossibleRatingRes.json();
    if (impossibleRatingJson.data.artisans.length !== 0) {
      throw new Error('Expected artisan with 4.8 rating to be excluded by minRating=5.0');
    }
  });

  await assertTest('PATCH /profiles/artisan/location updates coordinates & allows rediscovery in new location', async () => {
    const { generateAccessToken } = await import('../src/utils/token.util.js');
    const artisanProfile = await prisma.artisanProfile.findFirst({ include: { user: true } });
    if (!artisanProfile) throw new Error('No artisan profile found for auth test');

    const token = generateAccessToken({
      userId: artisanProfile.user.id,
      email: artisanProfile.user.email,
      role: 'ARTISAN',
    });

    // Move artisan to Victoria Island, Lagos
    const patchRes = await fetch(`${baseUrl}/profiles/artisan/location`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        latitude: 6.4281,
        longitude: 3.4219,
        address: '14 Adeola Odeku, Victoria Island',
        state: 'Lagos',
        lgaCity: 'Eti-Osa',
      }),
    });

    const patchJson = await patchRes.json();
    if (patchRes.status !== 200 || !patchJson.success) {
      throw new Error(`Location update failed: ${JSON.stringify(patchJson)}`);
    }

    // Now query nearby Victoria Island (5km radius)
    const viRes = await fetch(`${baseUrl}/profiles/artisans/nearby?lat=6.4281&lng=3.4219&radius=5`);
    const viJson = await viRes.json();

    if (viJson.data.artisans.length === 0) {
      throw new Error('Expected artisan to be discovered in Victoria Island after location update');
    }

    const foundArtisan = viJson.data.artisans[0];
    if (foundArtisan.lgaCity !== 'Eti-Osa') {
      throw new Error(`Expected updated lgaCity 'Eti-Osa', got '${foundArtisan.lgaCity}'`);
    }
  });

  await stopTestServer();

  console.log('\n=========================================================');
  console.log(`🏁 TEST RESULTS: ${passed}/${total} TESTS PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log('=========================================================\n');

  if (passed !== total) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(async (err) => {
  console.error('Fatal test runner error:', err);
  await stopTestServer();
  process.exit(1);
});
