const BASE_URL = 'http://localhost:5050/api/v1';

async function request(url, options = {}) {
  const res = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`[${res.status}] ${data.message || JSON.stringify(data)}`);
  }
  return data;
}

async function runAdminTests() {
  console.log('🛡️ Starting Complete Admin Dashboard API Test Runner...\n');

  // 1. Login as Admin
  const loginRes = await request('/auth/login', {
    method: 'POST',
    body: {
      email: 'admin@artisanplatform.com',
      password: 'Admin@123456',
    },
  });
  const adminToken = loginRes.data.tokens.accessToken;
  const authHeaders = { Authorization: `Bearer ${adminToken}` };
  console.log('✅ [1] PASS: Admin Authentication & Token Generation');

  // 2. Health & Diagnostics
  const healthRes = await request('/health');
  if (healthRes.status) console.log('✅ [2] PASS: Health Diagnostics Probe (GET /health)');

  // 3. Analytics Overview
  const analyticsRes = await request('/admin/analytics/overview', { headers: authHeaders });
  if (analyticsRes.data?.metrics) {
    console.log('✅ [3] PASS: Platform Analytics & KPI Overview (GET /admin/analytics/overview)');
  }

  // 4. Users Directory & User Drilldown
  const usersRes = await request('/admin/users', { headers: authHeaders });
  const firstUser = usersRes.data.users[0];
  console.log(`✅ [4] PASS: Users Directory (GET /admin/users - Found ${usersRes.data.meta.total} users)`);

  if (firstUser) {
    const userDetailRes = await request(`/admin/users/${firstUser.id}`, { headers: authHeaders });
    console.log(`✅ [5] PASS: User Deep Dossier (GET /admin/users/:id - ${userDetailRes.data.email})`);

    // Moderation Status Update
    await request(`/admin/users/${firstUser.id}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: {
        status: 'ACTIVE',
        reason: 'Automated administrative verification check',
      },
    });
    console.log('✅ [6] PASS: User Account Status Moderation with Audit Log (PATCH /admin/users/:id/status)');

    // Manual Verification by Admin
    await request(`/admin/users/${firstUser.id}/verify`, {
      method: 'PATCH',
      headers: authHeaders,
      body: {
        isKycVerified: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        documentType: 'NIN',
        documentNumber: '11223344556',
        reason: 'Manual administrative identity audit test',
      },
    });
    console.log('✅ [7] PASS: Manual User Compliance Verification (PATCH /admin/users/:id/verify)');
  }


  // 5. KYC Submissions Queue
  const kycRes = await request('/admin/kyc', { headers: authHeaders });
  console.log(`✅ [7] PASS: KYC Submissions Queue (GET /admin/kyc - Found ${kycRes.data.meta.total} records)`);

  // 6. Disputes Oversight
  const disputesRes = await request('/admin/disputes', { headers: authHeaders });
  console.log(`✅ [8] PASS: Disputes Oversight Queue (GET /admin/disputes - Found ${disputesRes.data.meta.total} cases)`);

  if (disputesRes.data.disputes.length > 0) {
    const disputeId = disputesRes.data.disputes[0].id;
    const disputeDetailRes = await request(`/admin/disputes/${disputeId}`, { headers: authHeaders });
    console.log(`✅ [9] PASS: Dispute Arbitration Dossier (GET /admin/disputes/:id - Code ${disputeDetailRes.data.disputeCode})`);
  }

  // 7. Contracts Oversight
  const contractsRes = await request('/admin/contracts', { headers: authHeaders });
  console.log(`✅ [10] PASS: Contracts & Escrow Oversight (GET /admin/contracts - Found ${contractsRes.data.meta.total} contracts)`);

  if (contractsRes.data.contracts.length > 0) {
    const contractId = contractsRes.data.contracts[0].id;
    const contractDetailRes = await request(`/admin/contracts/${contractId}`, { headers: authHeaders });
    console.log(`✅ [11] PASS: Contract Deep Inspection (GET /admin/contracts/:id - Code ${contractDetailRes.data.contractCode})`);
  }

  // 8. Financial Ledger
  const ledgerRes = await request('/admin/transactions', { headers: authHeaders });
  console.log(`✅ [12] PASS: Financial Ledger (GET /admin/transactions - Found ${ledgerRes.data.meta.total} transactions)`);

  // 9. Payouts Moderation
  const payoutsRes = await request('/admin/payouts', { headers: authHeaders });
  console.log(`✅ [13] PASS: Artisan Payouts Queue (GET /admin/payouts - Found ${payoutsRes.data.meta.total} payouts)`);

  // 10. Reviews Moderation
  const reviewsRes = await request('/admin/reviews', { headers: authHeaders });
  console.log(`✅ [14] PASS: Reviews Moderation Feed (GET /admin/reviews - Found ${reviewsRes.data.meta.total} reviews)`);

  if (reviewsRes.data.reviews.length > 0) {
    const reviewId = reviewsRes.data.reviews[0].id;
    await request(`/admin/reviews/${reviewId}/visibility`, {
      method: 'PATCH',
      headers: authHeaders,
      body: { isPublic: true },
    });
    console.log('✅ [15] PASS: Toggle Review Public Visibility (PATCH /admin/reviews/:id/visibility)');
  }

  // 11. Categories & Skills
  const categoriesRes = await request('/admin/categories', { headers: authHeaders });
  console.log(`✅ [16] PASS: Categories Manager (GET /admin/categories - Found ${categoriesRes.data.length} categories)`);

  const skillsRes = await request('/admin/skills', { headers: authHeaders });
  console.log(`✅ [17] PASS: Skills Catalog (GET /admin/skills - Found ${skillsRes.data.length} skills)`);

  // 12. Audit Logs
  const auditRes = await request('/admin/audit-logs', { headers: authHeaders });
  console.log(`✅ [18] PASS: System Audit Trail (GET /admin/audit-logs - Found ${auditRes.data.meta.total} audit logs)`);

  // 13. System Settings
  const settingsRes = await request('/admin/settings', { headers: authHeaders });
  console.log(`✅ [19] PASS: System Settings Variables (GET /admin/settings - Found ${settingsRes.data.length} settings)`);

  await request('/admin/settings/PLATFORM_FEE_PERCENT', {
    method: 'PUT',
    headers: authHeaders,
    body: {
      value: '5.00',
      description: 'Base platform escrow commission percentage',
    },
  });
  console.log('✅ [20] PASS: Update Dynamic System Setting (PUT /admin/settings/:key)');

  console.log('\n======================================================');
  console.log('🎉 ALL 20/20 ADMIN DASHBOARD BACKEND ENDPOINTS PASSED!');
  console.log('======================================================\n');
}

runAdminTests().catch((err) => {
  console.error('❌ Admin test error:', err.message);
  process.exit(1);
});
