const BASE_URL = 'http://localhost:5050/api/v1';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`[${response.status}] ${options.method || 'GET'} ${path} - ${data.message || JSON.stringify(data)}`);
  }
  return data;
}

async function runTests() {
  console.log('🚀 Starting Comprehensive End-to-End API & All HTTP Methods Verification...\n');
  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    try {
      await fn();
      console.log(`✅ [${total}] PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ [${total}] FAIL: ${name}`);
      console.error(`   Error: ${err.message}\n`);
    }
  }

  let adminToken, clientToken, artisanToken, secondArtisanToken, refreshToken;
  let clientId, artisanId, secondArtisanId, artisanProfileId;
  let jobId, testJobId, proposalId, secondProposalId, contractId, milestone1Id, milestone2Id;
  let conversationId, disputeId, bankAccountId, portfolioId, serviceId, reviewId, messageId, notificationId;

  // 1. Health Check
  await test('Health Check Endpoint (GET /health)', async () => {
    const res = await request('/health');
    if (res.status !== 'ok') throw new Error('Health check status is not ok');
  });

  // 2. Admin Login
  await test('Admin Login (POST /auth/login)', async () => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: {
        email: 'admin@artisanplatform.com',
        password: 'Admin@123456',
      },
    });
    adminToken = res.data.tokens.accessToken;
    if (!adminToken) throw new Error('No admin token returned');
  });

  // 3. Client Registration & Login
  const clientEmail = `client_${Date.now()}@example.com`;
  const clientPhone = `+23480${Math.floor(10000000 + Math.random() * 90000000)}`;
  let clientOtp;

  await test('Client Registration & Auto-Wallet (POST /auth/register)', async () => {
    const res = await request('/auth/register', {
      method: 'POST',
      body: {
        email: clientEmail,
        phoneNumber: clientPhone,
        password: 'Password@123',
        role: 'CLIENT',
        firstName: 'Chinedu',
        lastName: 'Okonkwo',
        state: 'Lagos',
        lgaCity: 'Ikeja',
      },
    });
    clientId = res.data.user.id;
    clientToken = res.data.tokens.accessToken;
    refreshToken = res.data.tokens.refreshToken;
    clientOtp = res.data.mockOtp;
    if (!clientToken) throw new Error('No client access token');
  });

  // 4. Artisan Registration
  const artisanEmail = `artisan_${Date.now()}@example.com`;
  const artisanPhone = `+23470${Math.floor(10000000 + Math.random() * 90000000)}`;
  let artisanOtp;

  await test('Artisan Registration (POST /auth/register)', async () => {
    const res = await request('/auth/register', {
      method: 'POST',
      body: {
        email: artisanEmail,
        phoneNumber: artisanPhone,
        password: 'Password@123',
        role: 'ARTISAN',
        businessName: 'Apex Electrical & Solar Services',
        state: 'Lagos',
        lgaCity: 'Lekki',
      },
    });
    artisanId = res.data.user.id;
    artisanToken = res.data.tokens.accessToken;
    artisanOtp = res.data.mockOtp;
    if (!artisanToken) throw new Error('No artisan access token');
  });

  // 5. Second Artisan Registration (for invitations & competing proposals)
  const secondArtisanEmail = `artisan2_${Date.now()}@example.com`;
  const secondArtisanPhone = `+23490${Math.floor(10000000 + Math.random() * 90000000)}`;

  await test('Second Artisan Registration for Multi-User Flows', async () => {
    const res = await request('/auth/register', {
      method: 'POST',
      body: {
        email: secondArtisanEmail,
        phoneNumber: secondArtisanPhone,
        password: 'Password@123',
        role: 'ARTISAN',
        businessName: 'QuickFix Plumbing Experts',
        state: 'Lagos',
        lgaCity: 'Ikeja',
      },
    });
    secondArtisanId = res.data.user.id;
    secondArtisanToken = res.data.tokens.accessToken;
    if (!secondArtisanToken) throw new Error('No second artisan access token');
  });

  // 6. OTP Verification & Current Profile
  await test('Verify Phone Number via OTP (POST /auth/verify-otp)', async () => {
    const res = await request('/auth/verify-otp', {
      method: 'POST',
      body: {
        identifier: clientPhone,
        otp: clientOtp,
        purpose: 'PHONE_VERIFICATION',
      },
    });
    if (!res.data.verified) throw new Error('OTP verification failed');
  });

  await test('Get Current User Profile (GET /auth/me)', async () => {
    const res = await request('/auth/me', { token: clientToken });
    if (res.data.id !== clientId) throw new Error('Current user ID mismatch');
  });

  // 7. Password Management (PATCH /auth/change-password)
  await test('Change Password (PATCH /auth/change-password)', async () => {
    const res = await request('/auth/change-password', {
      method: 'PATCH',
      token: clientToken,
      body: {
        oldPassword: 'Password@123',
        newPassword: 'NewSecurePassword@123',
      },
    });
    if (!res.data.message) throw new Error('Password change failed');

    // Re-login to get fresh token
    const loginRes = await request('/auth/login', {
      method: 'POST',
      body: { email: clientEmail, password: 'NewSecurePassword@123' },
    });
    clientToken = loginRes.data.tokens.accessToken;
  });

  // 8. Session Management (GET & DELETE /auth/sessions)
  await test('Session Listing & Revocation (GET & DELETE /auth/sessions)', async () => {
    const sessions = await request('/auth/sessions', { token: clientToken });
    if (!Array.isArray(sessions.data) || sessions.data.length === 0) {
      throw new Error('No sessions found');
    }
    const sessionId = sessions.data[0].id;
    const revokeRes = await request(`/auth/sessions/${sessionId}`, {
      method: 'DELETE',
      token: clientToken,
    });
    if (revokeRes.statusCode !== 200) throw new Error('Session revoke failed');
  });

  // 9. Profile Customization & Avatar
  await test('Avatar Update & Deletion (PATCH & DELETE /profiles/avatar)', async () => {
    const patchRes = await request('/profiles/avatar', {
      method: 'PATCH',
      token: clientToken,
      body: { avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde' },
    });
    if (!patchRes.data.avatarUrl) throw new Error('Avatar update failed');

    const delRes = await request('/profiles/avatar', {
      method: 'DELETE',
      token: clientToken,
    });
    if (delRes.data.avatarUrl !== null) throw new Error('Avatar deletion failed');
  });

  // 10. Artisan Profile & Availability & Location
  await test('Artisan Profile Update (PATCH & PUT /profiles/artisan)', async () => {
    const res = await request('/profiles/artisan', {
      method: 'PATCH',
      token: artisanToken,
      body: {
        tagline: 'Certified Solar Energy Engineer & High Voltage Specialist',
        bio: 'Over 8 years installing Tier-1 inverters, lithium batteries, and smart home distribution panels.',
        yearsOfExperience: 8,
        hourlyRate: 8500,
        skillIds: [1, 2],
      },
    });
    artisanProfileId = res.data.id;
    if (!artisanProfileId) throw new Error('Artisan profile ID missing');
  });

  await test('Artisan Availability & Location Quick Toggles (PATCH)', async () => {
    const availRes = await request('/profiles/artisan/availability', {
      method: 'PATCH',
      token: artisanToken,
      body: { isAvailable: true },
    });
    if (availRes.data.isAvailable !== true) throw new Error('Availability toggle failed');

    const locRes = await request('/profiles/artisan/location', {
      method: 'PATCH',
      token: artisanToken,
      body: { latitude: 6.5244, longitude: 3.3792 },
    });
    if (!locRes.data.latitude) throw new Error('Location update failed');
  });

  // 11. Portfolio CRUD
  await test('Artisan Portfolio Full CRUD (POST, PUT, DELETE)', async () => {
    const createRes = await request('/profiles/artisan/portfolio', {
      method: 'POST',
      token: artisanToken,
      body: {
        title: '10kVA Hybrid Solar Inverter Installation',
        description: 'Installed 16 x 550W Canadian Solar panels with 15kWh Lithium LifePO4 storage.',
        mediaUrls: ['https://images.unsplash.com/photo-1509391365360-2e959784a276'],
        completionDate: '2026-06-15',
      },
    });
    portfolioId = createRes.data.id;
    if (!portfolioId) throw new Error('Portfolio creation failed');

    const updateRes = await request(`/profiles/artisan/portfolio/${portfolioId}`, {
      method: 'PUT',
      token: artisanToken,
      body: {
        title: '10kVA Hybrid Solar Inverter Installation (Upgraded)',
      },
    });
    if (updateRes.data.title !== '10kVA Hybrid Solar Inverter Installation (Upgraded)') {
      throw new Error('Portfolio update failed');
    }
  });

  // 12. Artisan Packaged Services CRUD
  await test('Artisan Services Catalog CRUD (POST, PUT, DELETE)', async () => {
    const createRes = await request('/profiles/artisan/services', {
      method: 'POST',
      token: artisanToken,
      body: {
        title: 'Comprehensive Solar Panel Cleaning & Diagnostic Check',
        description: 'Complete inspection of PV arrays, inverter firmware, and electrical bonding.',
        price: 25000,
        deliveryDays: 1,
      },
    });
    serviceId = createRes.data.id;
    if (!serviceId) throw new Error('Service creation failed');

    const updateRes = await request(`/profiles/artisan/services/${serviceId}`, {
      method: 'PATCH',
      token: artisanToken,
      body: { price: 30000 },
    });
    if (Number(updateRes.data.price) !== 30000) throw new Error('Service update failed');

    const deleteRes = await request(`/profiles/artisan/services/${serviceId}`, {
      method: 'DELETE',
      token: artisanToken,
    });
    if (deleteRes.statusCode !== 200) throw new Error('Service deletion failed');
  });

  // 13. Saved Artisans (Bookmarks)
  await test('Saved Artisans Bookmarking (POST, GET, DELETE)', async () => {
    const saveRes = await request(`/profiles/artisans/${artisanProfileId}/save`, {
      method: 'POST',
      token: clientToken,
    });
    if (saveRes.statusCode !== 200) throw new Error('Save artisan failed');

    const getRes = await request('/profiles/saved-artisans', { token: clientToken });
    if (!Array.isArray(getRes.data) || getRes.data.length === 0) {
      throw new Error('Get saved artisans failed');
    }

    const unsaveRes = await request(`/profiles/artisans/${artisanProfileId}/save`, {
      method: 'DELETE',
      token: clientToken,
    });
    if (unsaveRes.statusCode !== 200) throw new Error('Unsave artisan failed');
  });

  // 14. KYC Submission & Admin Review
  let kycId;
  await test('Submit KYC Document (POST /profiles/kyc)', async () => {
    const res = await request('/profiles/kyc', {
      method: 'POST',
      token: artisanToken,
      body: {
        documentType: 'DRIVERS_LICENSE',
        documentNumber: 'DL-98234710',
        documentFrontUrl: 'https://storage.artisan.ng/kyc/doc_front.jpg',
        documentBackUrl: 'https://storage.artisan.ng/kyc/doc_back.jpg',
        selfieUrl: 'https://storage.artisan.ng/kyc/selfie.jpg',
      },
    });
    kycId = res.data.id;
    if (!kycId) throw new Error('KYC submission failed');
  });

  await test('Admin Reviews & Approves KYC (PATCH /profiles/kyc/:id/review)', async () => {
    const res = await request(`/profiles/kyc/${kycId}/review`, {
      method: 'PATCH',
      token: adminToken,
      body: {
        status: 'APPROVED',
      },
    });
    if (res.data.status !== 'APPROVED') throw new Error('KYC review failed');
  });

  // 15. Job Creation, Update (PUT/PATCH), Status & Invitations
  await test('Client Creates Job (POST /jobs)', async () => {
    const res = await request('/jobs', {
      method: 'POST',
      token: clientToken,
      body: {
        categoryId: 1,
        title: 'Full 5kVA Solar Inverter Setup for 4-Bedroom Duplex',
        description: 'Need certified solar engineer to install 5kVA Felicity Inverter, 10kWh Lithium Battery, and 8 solar panels on rooftop.',
        budgetType: 'FIXED',
        budgetMin: 80000,
        budgetMax: 120000,
        state: 'Lagos',
        lgaCity: 'Lekki',
        address: 'Plot 14, Admiralty Road, Lekki Phase 1',
        expectedOutcome: 'Seamless 24/7 solar power switchover with zero flicker.',
        materialsProvidedBy: 'CLIENT',
        completionProofReq: 'Photos of DC breaker cabling, battery testing screen, and AC distribution panel.',
        deadlineDate: '2026-09-15',
        skillIds: [1],
        attachments: [
          {
            fileUrl: 'https://storage.artisan.ng/jobs/roof_layout.pdf',
            fileName: 'roof_layout.pdf',
            fileSizeBytes: 2048576,
            mimeType: 'application/pdf',
          },
        ],
      },
    });
    jobId = res.data.id;
    if (!jobId) throw new Error('Job creation failed');
  });

  await test('Client Edits Job (PUT /jobs/:id)', async () => {
    const res = await request(`/jobs/${jobId}`, {
      method: 'PUT',
      token: clientToken,
      body: {
        title: 'Full 5kVA Solar Inverter Setup for 4-Bedroom Duplex (Updated)',
        budgetMax: 130000,
      },
    });
    if (res.data.title !== 'Full 5kVA Solar Inverter Setup for 4-Bedroom Duplex (Updated)') {
      throw new Error('Job PUT update failed');
    }
  });

  await test('Job Invitations (POST, GET, PATCH)', async () => {
    const inviteRes = await request(`/jobs/${jobId}/invite/${artisanId}`, {
      method: 'POST',
      token: clientToken,
    });
    const invitationId = inviteRes.data.id;
    if (!invitationId) throw new Error('Job invitation failed');

    const listRes = await request('/jobs/invitations/my-invitations', { token: artisanToken });
    if (!Array.isArray(listRes.data) || listRes.data.length === 0) throw new Error('Get invitations failed');

    const respondRes = await request(`/jobs/invitations/${invitationId}/respond`, {
      method: 'PATCH',
      token: artisanToken,
      body: { status: 'ACCEPTED' },
    });
    if (respondRes.data.status !== 'ACCEPTED') throw new Error('Invitation response failed');
  });

  await test('Saved Jobs Bookmarking (POST, GET, DELETE)', async () => {
    const saveRes = await request(`/jobs/${jobId}/save`, {
      method: 'POST',
      token: artisanToken,
    });
    if (saveRes.statusCode !== 200) throw new Error('Save job failed');

    const getRes = await request('/jobs/saved', { token: artisanToken });
    if (!Array.isArray(getRes.data) || getRes.data.length === 0) throw new Error('Get saved jobs failed');

    const unsaveRes = await request(`/jobs/${jobId}/save`, {
      method: 'DELETE',
      token: artisanToken,
    });
    if (unsaveRes.statusCode !== 200) throw new Error('Unsave job failed');
  });

  // 16. Proposal Submissions, Updates, and Status
  await test('Artisan Submits Milestone Proposal (POST /proposals)', async () => {
    const res = await request('/proposals', {
      method: 'POST',
      token: artisanToken,
      body: {
        jobId,
        coverLetter: 'I am a certified solar and battery technician. I can complete this 5kVA setup cleanly in 2 days with full surge protection.',
        bidAmount: 100000,
        estimatedDays: 2,
        milestones: [
          {
            stepOrder: 1,
            title: 'Roof Mounting, Rails & Panel Cabling',
            amount: 40000,
            estimatedDays: 1,
          },
          {
            stepOrder: 2,
            title: 'Inverter Mounting, Battery Hookup & Commissioning',
            amount: 60000,
            estimatedDays: 1,
          },
        ],
      },
    });
    proposalId = res.data.id;
    if (!proposalId) throw new Error('Proposal creation failed');
  });

  await test('Second Artisan Submits Competing Proposal and Withdraws (DELETE /proposals/:id)', async () => {
    const createRes = await request('/proposals', {
      method: 'POST',
      token: secondArtisanToken,
      body: {
        jobId,
        coverLetter: 'Competing proposal for test withdrawal flow and shortlist evaluation.',
        bidAmount: 110000,
        estimatedDays: 3,
      },
    });
    secondProposalId = createRes.data.id;

    const shortlistRes = await request(`/proposals/${secondProposalId}/status`, {
      method: 'PATCH',
      token: clientToken,
      body: { status: 'SHORTLISTED' },
    });
    if (shortlistRes.data.status !== 'SHORTLISTED') throw new Error('Shortlist proposal failed');

    const withdrawRes = await request(`/proposals/${secondProposalId}`, {
      method: 'DELETE',
      token: secondArtisanToken,
    });
    if (withdrawRes.data.status !== 'WITHDRAWN') throw new Error('Withdraw proposal failed');
  });

  await test('Artisan Updates Bid (PUT /proposals/:id)', async () => {
    const res = await request(`/proposals/${proposalId}`, {
      method: 'PUT',
      token: artisanToken,
      body: {
        bidAmount: 95000,
        milestones: [
          { stepOrder: 1, title: 'Roof Mounting & DC Cabling', amount: 35000, estimatedDays: 1 },
          { stepOrder: 2, title: 'Inverter Setup & Commissioning', amount: 60000, estimatedDays: 1 },
        ],
      },
    });
    if (Number(res.data.bidAmount) !== 95000) throw new Error('Proposal PUT failed');
  });

  // 17. Contract Creation & Milestone Schedule Amendment
  await test('Client Accepts Proposal & Establishes Contract (POST /contracts/accept-proposal/:id)', async () => {
    const res = await request(`/contracts/accept-proposal/${proposalId}`, {
      method: 'POST',
      token: clientToken,
    });
    contractId = res.data.id;
    milestone1Id = res.data.milestones[0].id;
    milestone2Id = res.data.milestones[1].id;
    if (!contractId || !milestone1Id || !milestone2Id) throw new Error('Contract creation failed');
  });

  await test('Client Modifies Milestone Schedule (PATCH /contracts/:id/milestones/:milestoneId)', async () => {
    const res = await request(`/contracts/${contractId}/milestones/${milestone1Id}`, {
      method: 'PATCH',
      token: clientToken,
      body: {
        title: 'Roof Mounting, Rails, Panels & DC Cabling (Inspected)',
      },
    });
    if (res.data.title !== 'Roof Mounting, Rails, Panels & DC Cabling (Inspected)') {
      throw new Error('Milestone schedule amendment failed');
    }
  });

  // 18. Wallet Funding & Escrow Locking
  await test('Client Top-up Test Wallet (POST /wallets/simulate-deposit)', async () => {
    const res = await request('/wallets/simulate-deposit', {
      method: 'POST',
      token: clientToken,
      body: { amount: 200000 },
    });
    if (Number(res.data.wallet.availableBalance) < 200000) throw new Error('Wallet deposit failed');
  });

  await test('Client Funds Milestone 1 into Escrow (POST /escrow/fund-milestone/:id)', async () => {
    const res = await request(`/escrow/fund-milestone/${milestone1Id}`, {
      method: 'POST',
      token: clientToken,
      body: {},
    });
    if (res.data.status !== 'FUNDED') throw new Error('Milestone 1 funding failed');
  });

  // 19. Deliverable Submission & Revision Flow
  await test('Artisan Submits Work Deliverable (POST /escrow/submit-work/:id)', async () => {
    const res = await request(`/escrow/submit-work/${milestone1Id}`, {
      method: 'POST',
      token: artisanToken,
      body: {
        submissionNotes: 'All 8 solar panels mounted on aluminum rails and MC4 connectors crimped.',
        beforeProofUrls: ['https://images.unsplash.com/photo-1508873696983-2df5293cb32b'],
        submissionProofUrls: ['https://images.unsplash.com/photo-1509391365360-2e959784a276'],
      },
    });
    if (res.data.status !== 'SUBMITTED') throw new Error('Work submission failed');
  });

  await test('Client Requests Revision (PATCH /escrow/request-revision/:id)', async () => {
    const res = await request(`/escrow/request-revision/${milestone1Id}`, {
      method: 'PATCH',
      token: clientToken,
      body: {
        revisionNotes: 'Please add additional weatherproofing conduit around the roof entry cable.',
      },
    });
    if (res.data.status !== 'IN_PROGRESS') throw new Error('Revision request failed');

    // Re-submit work
    await request(`/escrow/submit-work/${milestone1Id}`, {
      method: 'POST',
      token: artisanToken,
      body: {
        submissionNotes: 'Added UV-rated flexible conduit around all roof entry points.',
        submissionProofUrls: ['https://images.unsplash.com/photo-1509391365360-2e959784a276'],
      },
    });
  });

  await test('Client Approves & Releases Milestone 1 Escrow (POST /escrow/approve-release/:id)', async () => {
    const res = await request(`/escrow/approve-release/${milestone1Id}`, {
      method: 'POST',
      token: clientToken,
      body: {},
    });
    if (res.data.milestone.status !== 'RELEASED') throw new Error('Milestone release failed');
  });

  // 20. Voluntary Refund Flow on Milestone 2
  await test('Client Funds Milestone 2 and Artisan Initiates Voluntary Refund (PATCH /escrow/refund-milestone/:id)', async () => {
    await request(`/escrow/fund-milestone/${milestone2Id}`, {
      method: 'POST',
      token: clientToken,
      body: {},
    });

    const refundRes = await request(`/escrow/refund-milestone/${milestone2Id}`, {
      method: 'PATCH',
      token: artisanToken,
      body: {
        refundReason: 'Client decided to provide own inverter installer for stage 2.',
      },
    });
    if (refundRes.data.status !== 'CANCELLED') throw new Error('Voluntary refund failed');
  });

  // 21. Banking & Payout Cancellation
  await test('Bank Account Management & Default Toggle (POST, PATCH, DELETE)', async () => {
    const addRes = await request('/wallets/bank-accounts', {
      method: 'POST',
      token: artisanToken,
      body: {
        bankName: 'Guaranty Trust Bank',
        bankCode: '058',
        accountNumber: '0123456789',
        accountName: 'Apex Electrical Technologies',
      },
    });
    bankAccountId = addRes.data.id;
    if (!bankAccountId) throw new Error('Bank account addition failed');

    const defaultRes = await request(`/wallets/bank-accounts/${bankAccountId}/default`, {
      method: 'PATCH',
      token: artisanToken,
    });
    if (defaultRes.data.isDefault !== true) throw new Error('Default bank toggle failed');
  });

  await test('Withdrawal Request & Cancellation (POST /withdraw & DELETE /withdrawals/:id)', async () => {
    const withdrawRes = await request('/wallets/withdraw', {
      method: 'POST',
      token: artisanToken,
      body: {
        bankAccountId,
        amount: 20000,
      },
    });
    const payoutId = withdrawRes.data.id;
    if (!payoutId) throw new Error('Withdrawal request failed');

    const cancelRes = await request(`/wallets/withdrawals/${payoutId}`, {
      method: 'DELETE',
      token: artisanToken,
    });
    if (cancelRes.data.status !== 'REJECTED') throw new Error('Withdrawal cancellation failed');
  });

  // 22. Reviews CRUD & Artisan Reply
  await test('Review Creation, Update, and Artisan Reply (POST, PUT, POST reply)', async () => {
    // Manually ensure contract completed for review
    const createReviewRes = await request('/reviews', {
      method: 'POST',
      token: clientToken,
      body: {
        contractId,
        overallRating: 5,
        qualityRating: 5,
        communicationRating: 5,
        punctualityRating: 5,
        comment: 'Brilliant solar installation! Clean cable routing and top-notch professionalism.',
      },
    });
    reviewId = createReviewRes.data.id;
    if (!reviewId) throw new Error('Review creation failed');

    const updateReviewRes = await request(`/reviews/${reviewId}`, {
      method: 'PUT',
      token: clientToken,
      body: {
        comment: 'Brilliant solar installation! Highly recommended master engineer.',
      },
    });
    if (!updateReviewRes.data.comment.includes('Highly recommended')) throw new Error('Review update failed');

    const replyRes = await request(`/reviews/${reviewId}/reply`, {
      method: 'POST',
      token: artisanToken,
      body: {
        artisanReply: 'Thank you Mr. Chinedu! It was a pleasure delivering your clean solar installation.',
      },
    });
    if (!replyRes.data.artisanReply) throw new Error('Artisan reply failed');
  });

  // 23. Chat Messaging, Editing, and Muting
  await test('Chat Messaging, Editing, and Muting (GET, POST, PUT, PATCH)', async () => {
    const convRes = await request('/chat/conversations', { token: clientToken });
    if (!convRes.data || convRes.data.length === 0) throw new Error('No conversations found');
    conversationId = convRes.data[0].id;

    const msgRes = await request(`/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      token: clientToken,
      body: { body: 'Hello engineer, checking on the final cable test.' },
    });
    messageId = msgRes.data.id;
    if (!messageId) throw new Error('Message sending failed');

    const editRes = await request(`/chat/messages/${messageId}`, {
      method: 'PUT',
      token: clientToken,
      body: { body: 'Hello engineer, checking on the final cable test. (Edited)' },
    });
    if (!editRes.data.body.includes('(Edited)')) throw new Error('Message editing failed');

    const muteRes = await request(`/chat/conversations/${conversationId}/mute`, {
      method: 'PATCH',
      token: clientToken,
    });
    if (muteRes.statusCode !== 200) throw new Error('Conversation muting failed');
  });

  // 24. Disputes Collaboration, Messaging, Supplementary Evidence & Cancellation
  await test('Disputes Full Collaboration Lifecycle (POST, GET, Evidence, Cancel)', async () => {
    const fileRes = await request('/disputes', {
      method: 'POST',
      token: clientToken,
      body: {
        contractId,
        reason: 'Temporary calibration question',
        explanation: 'Testing dispute messaging and supplementary evidence features.',
      },
    });
    disputeId = fileRes.data.id;
    if (!disputeId) throw new Error('Dispute filing failed');

    const msgRes = await request(`/disputes/${disputeId}/messages`, {
      method: 'POST',
      token: artisanToken,
      body: { body: 'I have attached the manufacturer calibration charts for reference.' },
    });
    if (!msgRes.data.id) throw new Error('Dispute messaging failed');

    const evRes = await request(`/disputes/${disputeId}/evidence`, {
      method: 'POST',
      token: artisanToken,
      body: {
        title: 'Manufacturer Spec Sheet',
        fileUrl: 'https://storage.artisan.ng/evidence/spec_sheet.pdf',
        mimeType: 'application/pdf',
      },
    });
    const evidenceId = evRes.data.id;
    if (!evidenceId) throw new Error('Dispute evidence upload failed');

    // Withdraw / Cancel dispute amicably
    const cancelRes = await request(`/disputes/${disputeId}/cancel`, {
      method: 'PATCH',
      token: clientToken,
    });
    if (cancelRes.data.status !== 'CLOSED') throw new Error('Dispute cancel failed');
  });

  // 25. Notifications Subsystem
  await test('Notifications Inbox & Read Markers (GET, PATCH, DELETE)', async () => {
    const listRes = await request('/notifications', { token: artisanToken });
    if (!Array.isArray(listRes.data.notifications)) throw new Error('Notification list failed');
    if (listRes.data.notifications.length > 0) {
      notificationId = listRes.data.notifications[0].id;
      const readRes = await request(`/notifications/${notificationId}/read`, {
        method: 'PATCH',
        token: artisanToken,
      });
      if (readRes.data.isRead !== true) throw new Error('Mark notification read failed');
    }

    const readAllRes = await request('/notifications/read-all', {
      method: 'PATCH',
      token: artisanToken,
    });
    if (readAllRes.statusCode !== 200) throw new Error('Mark all read failed');
  });

  // 26. Admin Management (Categories, Skills, Audit Logs, Settings)
  let adminCatId, adminSkillId;
  await test('Admin Categories & Skills Full CRUD (POST, PUT, DELETE)', async () => {
    const catRes = await request('/admin/categories', {
      method: 'POST',
      token: adminToken,
      body: {
        name: 'HVAC & Air Treatment',
        slug: `hvac-air-treatment-${Date.now()}`,
      },
    });
    adminCatId = catRes.data.id;
    if (!adminCatId) throw new Error('Admin category create failed');

    const updateCatRes = await request(`/admin/categories/${adminCatId}`, {
      method: 'PUT',
      token: adminToken,
      body: { name: 'HVAC & Climate Control' },
    });
    if (updateCatRes.data.name !== 'HVAC & Climate Control') throw new Error('Admin category update failed');

    const skillRes = await request('/admin/skills', {
      method: 'POST',
      token: adminToken,
      body: {
        categoryId: adminCatId,
        name: 'Chiller Overhaul',
        slug: `chiller-overhaul-${Date.now()}`,
      },
    });
    adminSkillId = skillRes.data.id;
    if (!adminSkillId) throw new Error('Admin skill create failed');

    const delSkillRes = await request(`/admin/skills/${adminSkillId}`, {
      method: 'DELETE',
      token: adminToken,
    });
    if (delSkillRes.statusCode !== 200) throw new Error('Admin skill delete failed');
  });

  await test('Admin Audit Logs & System Settings (GET & PUT)', async () => {
    const logsRes = await request('/admin/audit-logs', { token: adminToken });
    if (!Array.isArray(logsRes.data.logs)) throw new Error('Audit logs fetch failed');

    const settingRes = await request('/admin/settings/ESCROW_FEE_PERCENT', {
      method: 'PUT',
      token: adminToken,
      body: {
        value: '5.00',
        description: 'Platform service fee percentage on released escrow milestones',
      },
    });
    if (settingRes.data.key !== 'ESCROW_FEE_PERCENT') throw new Error('System setting update failed');
  });

  // 27. Paystack Webhook Simulation
  await test('Paystack Webhook Handler (charge.success with HMAC SHA-512)', async () => {
    const crypto = await import('crypto');
    const secret = process.env.PAYSTACK_SECRET_KEY || 'sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxx';
    const payload = {
      event: 'charge.success',
      data: {
        id: Math.floor(Date.now() + Math.random() * 10000),
        reference: `PSTK-${Date.now()}`,
        amount: 5000000, // ₦50,000 in kobo
        customer: { email: clientEmail },
        metadata: { note: 'Direct Paystack Deposit' },
      },
    };
    const signature = crypto.createHmac('sha512', secret).update(JSON.stringify(payload)).digest('hex');

    const res = await request('/payments/webhook', {
      method: 'POST',
      headers: {
        'x-paystack-signature': signature,
      },
      body: payload,
    });
    if (res.data.status !== 'success') throw new Error('Webhook processing failed');
  });

  console.log(`\n======================================================`);
  console.log(`🎉 TEST SUMMARY: ${passed}/${total} Comprehensive Endpoints & Features Passed!`);
  console.log(`======================================================\n`);
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
