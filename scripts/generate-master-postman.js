import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const collection = {
  info: {
    name: "Artisan Escrow Marketplace — Master API Collection (Complete)",
    description: "Exhaustive Master Postman Collection containing ALL endpoints, HTTP methods (GET, POST, PUT, PATCH, DELETE), role authentications, and automated test chaining.",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  variable: [
    { key: "baseUrl", value: "http://localhost:5050/api/v1", type: "string" },
    { key: "adminToken", value: "", type: "string" },
    { key: "clientToken", value: "", type: "string" },
    { key: "artisanToken", value: "", type: "string" },
    { key: "secondArtisanToken", value: "", type: "string" },
    { key: "clientRefreshToken", value: "", type: "string" },
    { key: "artisanRefreshToken", value: "", type: "string" },
    { key: "clientId", value: "", type: "string" },
    { key: "artisanId", value: "", type: "string" },
    { key: "secondArtisanId", value: "", type: "string" },
    { key: "artisanProfileId", value: "", type: "string" },
    { key: "jobId", value: "", type: "string" },
    { key: "invitationId", value: "", type: "string" },
    { key: "attachmentId", value: "", type: "string" },
    { key: "proposalId", value: "", type: "string" },
    { key: "secondProposalId", value: "", type: "string" },
    { key: "contractId", value: "", type: "string" },
    { key: "milestoneId", value: "", type: "string" },
    { key: "milestone2Id", value: "", type: "string" },
    { key: "disputeId", value: "", type: "string" },
    { key: "evidenceId", value: "", type: "string" },
    { key: "reviewId", value: "", type: "string" },
    { key: "conversationId", value: "", type: "string" },
    { key: "messageId", value: "", type: "string" },
    { key: "bankAccountId", value: "", type: "string" },
    { key: "payoutId", value: "", type: "string" },
    { key: "cardId", value: "", type: "string" },
    { key: "portfolioId", value: "", type: "string" },
    { key: "serviceId", value: "", type: "string" },
    { key: "kycId", value: "", type: "string" },
    { key: "notificationId", value: "", type: "string" },
    { key: "sessionId", value: "", type: "string" },
    { key: "adminCategoryId", value: 1, type: "number" },
    { key: "adminSkillId", value: 1, type: "number" },
    { key: "dynClientEmail", value: "client_test@example.com", type: "string" },
    { key: "dynClientPhone", value: "+2348011223344", type: "string" },
    { key: "dynArtisanEmail", value: "artisan_test@example.com", type: "string" },
    { key: "dynArtisanPhone", value: "+2347011223344", type: "string" }
  ],
  item: [
    // 01. SYSTEM & HEALTH
    {
      name: "01. System & Health",
      item: [
        {
          name: "Health Check (GET /health)",
          event: [{
            listen: "test",
            script: {
              exec: [
                "pm.test('Status is 200', () => pm.response.to.have.status(200));",
                "pm.test('Service is ok', () => pm.expect(pm.response.json().status).to.eql('ok'));"
              ]
            }
          }],
          request: {
            method: "GET",
            url: "{{baseUrl}}/health"
          }
        }
      ]
    },

    // 02. AUTHENTICATION & SESSIONS
    {
      name: "02. Authentication & Sessions",
      item: [
        {
          name: "Admin Login (POST /auth/login)",
          event: [{
            listen: "test",
            script: {
              exec: [
                "pm.test('Status is 200', () => pm.response.to.have.status(200));",
                "const json = pm.response.json();",
                "if (json.data && json.data.tokens) {",
                "  pm.collectionVariables.set('adminToken', json.data.tokens.accessToken);",
                "}"
              ]
            }
          }],
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                email: "admin@artisanplatform.com",
                password: "Admin@123456"
              }, null, 2)
            },
            url: "{{baseUrl}}/auth/login"
          }
        },
        {
          name: "Register Client (POST /auth/register)",
          event: [{
            listen: "prerequest",
            script: {
              exec: [
                "const rand = Math.floor(10000000 + Math.random() * 90000000);",
                "pm.collectionVariables.set('dynClientEmail', 'client_' + rand + '@example.com');",
                "pm.collectionVariables.set('dynClientPhone', '+23480' + rand);"
              ]
            }
          }, {
            listen: "test",
            script: {
              exec: [
                "pm.test('Status is 201', () => pm.response.to.have.status(201));",
                "const json = pm.response.json();",
                "if (json.data) {",
                "  pm.collectionVariables.set('clientId', json.data.user.id);",
                "  pm.collectionVariables.set('clientToken', json.data.tokens.accessToken);",
                "  pm.collectionVariables.set('clientRefreshToken', json.data.tokens.refreshToken);",
                "}"
              ]
            }
          }],
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                email: "{{dynClientEmail}}",
                phoneNumber: "{{dynClientPhone}}",
                password: "Password@123",
                role: "CLIENT",
                firstName: "Chinedu",
                lastName: "Okonkwo",
                state: "Lagos",
                lgaCity: "Ikeja"
              }, null, 2)
            },
            url: "{{baseUrl}}/auth/register"
          }
        },
        {
          name: "Register Artisan (POST /auth/register)",
          event: [{
            listen: "prerequest",
            script: {
              exec: [
                "const rand = Math.floor(10000000 + Math.random() * 90000000);",
                "pm.collectionVariables.set('dynArtisanEmail', 'artisan_' + rand + '@example.com');",
                "pm.collectionVariables.set('dynArtisanPhone', '+23470' + rand);"
              ]
            }
          }, {
            listen: "test",
            script: {
              exec: [
                "pm.test('Status is 201', () => pm.response.to.have.status(201));",
                "const json = pm.response.json();",
                "if (json.data) {",
                "  pm.collectionVariables.set('artisanId', json.data.user.id);",
                "  pm.collectionVariables.set('artisanToken', json.data.tokens.accessToken);",
                "  pm.collectionVariables.set('artisanRefreshToken', json.data.tokens.refreshToken);",
                "}"
              ]
            }
          }],
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                email: "{{dynArtisanEmail}}",
                phoneNumber: "{{dynArtisanPhone}}",
                password: "Password@123",
                role: "ARTISAN",
                businessName: "Apex Solar & Electrical Services",
                state: "Lagos",
                lgaCity: "Lekki"
              }, null, 2)
            },
            url: "{{baseUrl}}/auth/register"
          }
        },
        {
          name: "Client Login (POST /auth/login)",
          event: [{
            listen: "test",
            script: {
              exec: [
                "const json = pm.response.json();",
                "if (json.data && json.data.tokens) {",
                "  pm.collectionVariables.set('clientToken', json.data.tokens.accessToken);",
                "  pm.collectionVariables.set('clientRefreshToken', json.data.tokens.refreshToken);",
                "}"
              ]
            }
          }],
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                email: "{{dynClientEmail}}",
                password: "Password@123"
              }, null, 2)
            },
            url: "{{baseUrl}}/auth/login"
          }
        },
        {
          name: "Artisan Login (POST /auth/login)",
          event: [{
            listen: "test",
            script: {
              exec: [
                "const json = pm.response.json();",
                "if (json.data && json.data.tokens) {",
                "  pm.collectionVariables.set('artisanToken', json.data.tokens.accessToken);",
                "  pm.collectionVariables.set('artisanRefreshToken', json.data.tokens.refreshToken);",
                "}"
              ]
            }
          }],
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                email: "{{dynArtisanEmail}}",
                password: "Password@123"
              }, null, 2)
            },
            url: "{{baseUrl}}/auth/login"
          }
        },
        {
          name: "Verify OTP (POST /auth/verify-otp)",
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                identifier: "{{dynClientPhone}}",
                otp: "123456",
                purpose: "PHONE_VERIFICATION"
              }, null, 2)
            },
            url: "{{baseUrl}}/auth/verify-otp"
          }
        },
        {
          name: "Refresh Access Token (POST /auth/refresh-token)",
          event: [{
            listen: "test",
            script: {
              exec: [
                "const json = pm.response.json();",
                "if (json.data && json.data.accessToken) {",
                "  pm.collectionVariables.set('clientToken', json.data.accessToken);",
                "}"
              ]
            }
          }],
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                refreshToken: "{{clientRefreshToken}}"
              }, null, 2)
            },
            url: "{{baseUrl}}/auth/refresh-token"
          }
        },
        {
          name: "Get Current Profile (GET /auth/me)",
          request: {
            method: "GET",
            header: [{ key: "Authorization", value: "Bearer {{clientToken}}" }],
            url: "{{baseUrl}}/auth/me"
          }
        },
        {
          name: "Change Password (PATCH /auth/change-password)",
          request: {
            method: "PATCH",
            header: [
              { key: "Authorization", value: "Bearer {{clientToken}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                oldPassword: "Password@123",
                newPassword: "NewSecurePassword@123"
              }, null, 2)
            },
            url: "{{baseUrl}}/auth/change-password"
          }
        },
        {
          name: "Forgot Password (POST /auth/forgot-password)",
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                identifier: "{{dynClientEmail}}"
              }, null, 2)
            },
            url: "{{baseUrl}}/auth/forgot-password"
          }
        },
        {
          name: "Reset Password (POST /auth/reset-password)",
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                identifier: "{{dynClientEmail}}",
                otp: "123456",
                newPassword: "Password@123"
              }, null, 2)
            },
            url: "{{baseUrl}}/auth/reset-password"
          }
        },
        {
          name: "Get Active Sessions (GET /auth/sessions)",
          event: [{
            listen: "test",
            script: {
              exec: [
                "const json = pm.response.json();",
                "if (json.data && json.data.length > 0) {",
                "  pm.collectionVariables.set('sessionId', json.data[0].id);",
                "}"
              ]
            }
          }],
          request: {
            method: "GET",
            header: [{ key: "Authorization", value: "Bearer {{clientToken}}" }],
            url: "{{baseUrl}}/auth/sessions"
          }
        },
        {
          name: "Revoke Specific Session (DELETE /auth/sessions/:id)",
          request: {
            method: "DELETE",
            header: [{ key: "Authorization", value: "Bearer {{clientToken}}" }],
            url: "{{baseUrl}}/auth/sessions/{{sessionId}}"
          }
        }
      ]
    },

    // 03. PROFILES, SERVICES & KYC
    {
      name: "03. Profiles, Services & KYC",
      item: [
        {
          name: "Public Directory Search (GET /profiles/artisans)",
          request: {
            method: "GET",
            url: "{{baseUrl}}/profiles/artisans"
          }
        },
        {
          name: "Update Client Profile (PATCH /profiles/client)",
          request: {
            method: "PATCH",
            header: [
              { key: "Authorization", value: "Bearer {{clientToken}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                firstName: "Chinedu",
                lastName: "Okonkwo",
                companyName: "Okonkwo Real Estate Ltd",
                state: "Lagos",
                lgaCity: "Ikeja"
              }, null, 2)
            },
            url: "{{baseUrl}}/profiles/client"
          }
        },
        {
          name: "Update Artisan Profile (PATCH /profiles/artisan)",
          event: [{
            listen: "test",
            script: {
              exec: [
                "const json = pm.response.json();",
                "if (json.data && json.data.id) {",
                "  pm.collectionVariables.set('artisanProfileId', json.data.id);",
                "}"
              ]
            }
          }],
          request: {
            method: "PATCH",
            header: [
              { key: "Authorization", value: "Bearer {{artisanToken}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                tagline: "Certified High-Voltage Solar Systems Specialist",
                bio: "Over 8 years experience installing Tier-1 inverters, lithium batteries, and smart distribution panels.",
                yearsOfExperience: 8,
                hourlyRate: 8500,
                skillIds: [1, 2]
              }, null, 2)
            },
            url: "{{baseUrl}}/profiles/artisan"
          }
        },
        {
          name: "Artisan Profile Details (GET /profiles/artisans/:id)",
          request: {
            method: "GET",
            url: "{{baseUrl}}/profiles/artisans/{{artisanProfileId}}"
          }
        },
        {
          name: "Artisan Availability Toggle (PATCH /profiles/artisan/availability)",
          request: {
            method: "PATCH",
            header: [
              { key: "Authorization", value: "Bearer {{artisanToken}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({ isAvailable: true }, null, 2)
            },
            url: "{{baseUrl}}/profiles/artisan/availability"
          }
        },
        {
          name: "Artisan GPS Location (PATCH /profiles/artisan/location)",
          request: {
            method: "PATCH",
            header: [
              { key: "Authorization", value: "Bearer {{artisanToken}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({ latitude: 6.5244, longitude: 3.3792 }, null, 2)
            },
            url: "{{baseUrl}}/profiles/artisan/location"
          }
        },
        {
          name: "Add Portfolio Project (POST /profiles/artisan/portfolio)",
          event: [{
            listen: "test",
            script: {
              exec: [
                "const json = pm.response.json();",
                "if (json.data && json.data.id) {",
                "  pm.collectionVariables.set('portfolioId', json.data.id);",
                "}"
              ]
            }
          }],
          request: {
            method: "POST",
            header: [
              { key: "Authorization", value: "Bearer {{artisanToken}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                title: "10kVA Hybrid Solar Inverter Installation",
                description: "Installed 16 x 550W Canadian Solar panels with 15kWh Lithium storage.",
                mediaUrls: ["https://images.unsplash.com/photo-1509391365360-2e959784a276"],
                completionDate: "2026-06-15"
              }, null, 2)
            },
            url: "{{baseUrl}}/profiles/artisan/portfolio"
          }
        },
        {
          name: "Update Portfolio Project (PUT /profiles/artisan/portfolio/:id)",
          request: {
            method: "PUT",
            header: [
              { key: "Authorization", value: "Bearer {{artisanToken}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                title: "10kVA Hybrid Solar Inverter Installation (Upgraded)"
              }, null, 2)
            },
            url: "{{baseUrl}}/profiles/artisan/portfolio/{{portfolioId}}"
          }
        },
        {
          name: "Create Packaged Service (POST /profiles/artisan/services)",
          event: [{
            listen: "test",
            script: {
              exec: [
                "const json = pm.response.json();",
                "if (json.data && json.data.id) {",
                "  pm.collectionVariables.set('serviceId', json.data.id);",
                "}"
              ]
            }
          }],
          request: {
            method: "POST",
            header: [
              { key: "Authorization", value: "Bearer {{artisanToken}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                title: "Comprehensive Solar Panel Cleaning & Diagnostic Check",
                description: "Complete inspection of PV arrays, inverter firmware, and electrical bonding.",
                price: 25000,
                deliveryDays: 1
              }, null, 2)
            },
            url: "{{baseUrl}}/profiles/artisan/services"
          }
        },
        {
          name: "Update Packaged Service (PATCH /profiles/artisan/services/:id)",
          request: {
            method: "PATCH",
            header: [
              { key: "Authorization", value: "Bearer {{artisanToken}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({ price: 30000 }, null, 2)
            },
            url: "{{baseUrl}}/profiles/artisan/services/{{serviceId}}"
          }
        },
        {
          name: "Bookmark Artisan (POST /profiles/artisans/:id/save)",
          request: {
            method: "POST",
            header: [{ key: "Authorization", value: "Bearer {{clientToken}}" }],
            url: "{{baseUrl}}/profiles/artisans/{{artisanProfileId}}/save"
          }
        },
        {
          name: "Get Saved Artisans (GET /profiles/saved-artisans)",
          request: {
            method: "GET",
            header: [{ key: "Authorization", value: "Bearer {{clientToken}}" }],
            url: "{{baseUrl}}/profiles/saved-artisans"
          }
        },
        {
          name: "Unsave Artisan (DELETE /profiles/artisans/:id/save)",
          request: {
            method: "DELETE",
            header: [{ key: "Authorization", value: "Bearer {{clientToken}}" }],
            url: "{{baseUrl}}/profiles/artisans/{{artisanProfileId}}/save"
          }
        },
        {
          name: "Bind Monad Wallet Address (PATCH /profiles/wallet-address)",
          request: {
            method: "PATCH",
            header: [
              { key: "Authorization", value: "Bearer {{artisanToken}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                walletAddress: "0x9A979F4f6C24cBB96a2c4f7bd1fa2fdAb60173eB"
              }, null, 2)
            },
            url: "{{baseUrl}}/profiles/wallet-address"
          }
        },
        {
          name: "Update Avatar (PATCH /profiles/avatar)",
          request: {
            method: "PATCH",
            header: [
              { key: "Authorization", value: "Bearer {{clientToken}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde"
              }, null, 2)
            },
            url: "{{baseUrl}}/profiles/avatar"
          }
        },
        {
          name: "Submit KYC Verification (POST /profiles/kyc)",
          event: [{
            listen: "test",
            script: {
              exec: [
                "const json = pm.response.json();",
                "if (json.data && json.data.id) {",
                "  pm.collectionVariables.set('kycId', json.data.id);",
                "}"
              ]
            }
          }],
          request: {
            method: "POST",
            header: [
              { key: "Authorization", value: "Bearer {{artisanToken}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                documentType: "DRIVERS_LICENSE",
                documentNumber: "DL-98234710",
                documentFrontUrl: "https://storage.artisan.ng/kyc/doc_front.jpg",
                documentBackUrl: "https://storage.artisan.ng/kyc/doc_back.jpg",
                selfieUrl: "https://storage.artisan.ng/kyc/selfie.jpg"
              }, null, 2)
            },
            url: "{{baseUrl}}/profiles/kyc"
          }
        },
        {
          name: "Admin Approves KYC (PATCH /profiles/kyc/:id/review)",
          request: {
            method: "PATCH",
            header: [
              { key: "Authorization", value: "Bearer {{adminToken}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({ status: "APPROVED" }, null, 2)
            },
            url: "{{baseUrl}}/profiles/kyc/{{kycId}}/review"
          }
        }
      ]
    },

    // 04. WALLETS & TOP-UP
    {
      name: "04. Wallets & Top-Up",
      item: [
        {
          name: "Client Top-Up Available Balance (POST /wallets/simulate-deposit)",
          request: {
            method: "POST",
            header: [
              { key: "Authorization", value: "Bearer {{clientToken}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({ amount: 200000 }, null, 2)
            },
            url: "{{baseUrl}}/wallets/simulate-deposit"
          }
        },
        {
          name: "Get Client Wallet (GET /wallets/my-wallet)",
          request: {
            method: "GET",
            header: [{ key: "Authorization", value: "Bearer {{clientToken}}" }],
            url: "{{baseUrl}}/wallets/my-wallet"
          }
        }
      ]
    },

    // 05. JOBS & INVITATIONS
    {
      name: "05. Jobs & Invitations",
      item: [
        {
          name: "List Categories (GET /jobs/categories)",
          request: {
            method: "GET",
            url: "{{baseUrl}}/jobs/categories"
          }
        },
        {
          name: "Create Job (POST /jobs)",
          event: [{
            listen: "test",
            script: {
              exec: [
                "pm.test('Status is 201', () => pm.response.to.have.status(201));",
                "const json = pm.response.json();",
                "if (json.data && json.data.id) {",
                "  pm.collectionVariables.set('jobId', json.data.id);",
                "}"
              ]
            }
          }],
          request: {
            method: "POST",
            header: [
              { key: "Authorization", value: "Bearer {{clientToken}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                categoryId: 1,
                title: "Full 5kVA Solar Inverter Setup for 4-Bedroom Duplex",
                description: "Need certified solar engineer to install 5kVA Felicity Inverter, 10kWh Lithium Battery, and 8 solar panels on rooftop.",
                budgetType: "FIXED",
                budgetMin: 80000,
                budgetMax: 120000,
                state: "Lagos",
                lgaCity: "Lekki",
                address: "Plot 14, Admiralty Road, Lekki Phase 1",
                expectedOutcome: "Seamless 24/7 solar power switchover with zero flicker.",
                materialsProvidedBy: "CLIENT",
                completionProofReq: "Photos of DC breaker cabling, battery testing screen, and AC distribution panel.",
                deadlineDate: "2026-09-15",
                skillIds: [1]
              }, null, 2)
            },
            url: "{{baseUrl}}/jobs"
          }
        },
        {
          name: "Edit Job (PUT /jobs/:id)",
          request: {
            method: "PUT",
            header: [
              { key: "Authorization", value: "Bearer {{clientToken}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                title: "Full 5kVA Solar Inverter Setup for 4-Bedroom Duplex (Updated)",
                budgetMax: 130000
              }, null, 2)
            },
            url: "{{baseUrl}}/jobs/{{jobId}}"
          }
        },
        {
          name: "Get Single Job (GET /jobs/:id)",
          request: {
            method: "GET",
            url: "{{baseUrl}}/jobs/{{jobId}}"
          }
        },
        {
          name: "Invite Artisan to Job (POST /jobs/:id/invite/:artisanId)",
          event: [{
            listen: "test",
            script: {
              exec: [
                "const json = pm.response.json();",
                "if (json.data && json.data.id) {",
                "  pm.collectionVariables.set('invitationId', json.data.id);",
                "}"
              ]
            }
          }],
          request: {
            method: "POST",
            header: [{ key: "Authorization", value: "Bearer {{clientToken}}" }],
            url: "{{baseUrl}}/jobs/{{jobId}}/invite/{{artisanId}}"
          }
        },
        {
          name: "Artisan Views Invitations (GET /jobs/invitations/my-invitations)",
          request: {
            method: "GET",
            header: [{ key: "Authorization", value: "Bearer {{artisanToken}}" }],
            url: "{{baseUrl}}/jobs/invitations/my-invitations"
          }
        },
        {
          name: "Respond to Invitation (PATCH /jobs/invitations/:id/respond)",
          request: {
            method: "PATCH",
            header: [
              { key: "Authorization", value: "Bearer {{artisanToken}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({ status: "ACCEPTED" }, null, 2)
            },
            url: "{{baseUrl}}/jobs/invitations/{{invitationId}}/respond"
          }
        },
        {
          name: "Save Job Bookmark (POST /jobs/:id/save)",
          request: {
            method: "POST",
            header: [{ key: "Authorization", value: "Bearer {{artisanToken}}" }],
            url: "{{baseUrl}}/jobs/{{jobId}}/save"
          }
        },
        {
          name: "Get Saved Jobs (GET /jobs/saved)",
          request: {
            method: "GET",
            header: [{ key: "Authorization", value: "Bearer {{artisanToken}}" }],
            url: "{{baseUrl}}/jobs/saved"
          }
        }
      ]
    },

    // 06. PROPOSALS & BIDDING
    {
      name: "06. Proposals & Bidding",
      item: [
        {
          name: "Submit Proposal with Milestones (POST /proposals)",
          event: [{
            listen: "test",
            script: {
              exec: [
                "pm.test('Status is 201', () => pm.response.to.have.status(201));",
                "const json = pm.response.json();",
                "if (json.data && json.data.id) {",
                "  pm.collectionVariables.set('proposalId', json.data.id);",
                "}"
              ]
            }
          }],
          request: {
            method: "POST",
            header: [
              { key: "Authorization", value: "Bearer {{artisanToken}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                jobId: "{{jobId}}",
                coverLetter: "I am a certified solar and battery technician. I can complete this 5kVA setup cleanly in 2 days with full surge protection.",
                bidAmount: 100000,
                estimatedDays: 2,
                milestones: [
                  {
                    stepOrder: 1,
                    title: "Roof Mounting, Rails & Panel Cabling",
                    amount: 40000,
                    estimatedDays: 1
                  },
                  {
                    stepOrder: 2,
                    title: "Inverter Mounting, Battery Hookup & Commissioning",
                    amount: 60000,
                    estimatedDays: 1
                  }
                ]
              }, null, 2)
            },
            url: "{{baseUrl}}/proposals"
          }
        },
        {
          name: "Get Proposal Details (GET /proposals/:id)",
          request: {
            method: "GET",
            header: [{ key: "Authorization", value: "Bearer {{artisanToken}}" }],
            url: "{{baseUrl}}/proposals/{{proposalId}}"
          }
        },
        {
          name: "Update Proposal (PUT /proposals/:id)",
          request: {
            method: "PUT",
            header: [
              { key: "Authorization", value: "Bearer {{artisanToken}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                bidAmount: 95000,
                milestones: [
                  { stepOrder: 1, title: "Roof Mounting & DC Cabling", amount: 35000, estimatedDays: 1 },
                  { stepOrder: 2, title: "Inverter Setup & Commissioning", amount: 60000, estimatedDays: 1 }
                ]
              }, null, 2)
            },
            url: "{{baseUrl}}/proposals/{{proposalId}}"
          }
        },
        {
          name: "Client Shortlists Proposal (PATCH /proposals/:id/status)",
          request: {
            method: "PATCH",
            header: [
              { key: "Authorization", value: "Bearer {{clientToken}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({ status: "SHORTLISTED" }, null, 2)
            },
            url: "{{baseUrl}}/proposals/{{proposalId}}/status"
          }
        }
      ]
    },

    // 07. CONTRACTS & WORK AGREEMENTS
    {
      name: "07. Contracts & Agreements",
      item: [
        {
          name: "Accept Proposal & Create Contract (POST /contracts/accept-proposal/:id)",
          event: [{
            listen: "test",
            script: {
              exec: [
                "pm.test('Status is 201', () => pm.response.to.have.status(201));",
                "const json = pm.response.json();",
                "if (json.data && json.data.id) {",
                "  pm.collectionVariables.set('contractId', json.data.id);",
                "  if (json.data.milestones && json.data.milestones.length >= 2) {",
                "    pm.collectionVariables.set('milestoneId', json.data.milestones[0].id);",
                "    pm.collectionVariables.set('milestone2Id', json.data.milestones[1].id);",
                "  }",
                "}"
              ]
            }
          }],
          request: {
            method: "POST",
            header: [{ key: "Authorization", value: "Bearer {{clientToken}}" }],
            url: "{{baseUrl}}/contracts/accept-proposal/{{proposalId}}"
          }
        },
        {
          name: "Get Contract Details (GET /contracts/:id)",
          request: {
            method: "GET",
            header: [{ key: "Authorization", value: "Bearer {{clientToken}}" }],
            url: "{{baseUrl}}/contracts/{{contractId}}"
          }
        },
        {
          name: "Modify Milestone Schedule (PATCH /contracts/:id/milestones/:milestoneId)",
          request: {
            method: "PATCH",
            header: [
              { key: "Authorization", value: "Bearer {{clientToken}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                title: "Roof Mounting, Rails, Panels & DC Cabling (Inspected)"
              }, null, 2)
            },
            url: "{{baseUrl}}/contracts/{{contractId}}/milestones/{{milestoneId}}"
          }
        }
      ]
    },

    // 08. ESCROW PROTOCOL & SETTLEMENT
    {
      name: "08. Escrow Protocol & Settlement",
      item: [
        {
          name: "Fund Milestone 1 into Escrow (POST /escrow/fund-milestone/:id)",
          request: {
            method: "POST",
            header: [
              { key: "Authorization", value: "Bearer {{clientToken}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({}, null, 2)
            },
            url: "{{baseUrl}}/escrow/fund-milestone/{{milestoneId}}"
          }
        },
        {
          name: "Submit Milestone Work Proof (POST /escrow/submit-work/:id)",
          request: {
            method: "POST",
            header: [
              { key: "Authorization", value: "Bearer {{artisanToken}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                submissionNotes: "All 8 solar panels mounted on aluminum rails and MC4 connectors crimped.",
                beforeProofUrls: ["https://images.unsplash.com/photo-1508873696983-2df5293cb32b"],
                submissionProofUrls: ["https://images.unsplash.com/photo-1509391365360-2e959784a276"]
              }, null, 2)
            },
            url: "{{baseUrl}}/escrow/submit-work/{{milestoneId}}"
          }
        },
        {
          name: "Request Deliverable Revision (PATCH /escrow/request-revision/:id)",
          request: {
            method: "PATCH",
            header: [
              { key: "Authorization", value: "Bearer {{clientToken}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                revisionNotes: "Please add UV-resistant conduit around the roof cable entry point."
              }, null, 2)
            },
            url: "{{baseUrl}}/escrow/request-revision/{{milestoneId}}"
          }
        },
        {
          name: "Re-Submit Milestone Work (POST /escrow/submit-work/:id)",
          request: {
            method: "POST",
            header: [
              { key: "Authorization", value: "Bearer {{artisanToken}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                submissionNotes: "Added UV-rated conduit around all entry points.",
                submissionProofUrls: ["https://images.unsplash.com/photo-1509391365360-2e959784a276"]
              }, null, 2)
            },
            url: "{{baseUrl}}/escrow/submit-work/{{milestoneId}}"
          }
        },
        {
          name: "Approve Work & Release Payout (POST /escrow/approve-release/:id)",
          request: {
            method: "POST",
            header: [
              { key: "Authorization", value: "Bearer {{clientToken}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({}, null, 2)
            },
            url: "{{baseUrl}}/escrow/approve-release/{{milestoneId}}"
          }
        },
        {
          name: "Fund Milestone 2 (POST /escrow/fund-milestone/:id)",
          request: {
            method: "POST",
            header: [
              { key: "Authorization", value: "Bearer {{clientToken}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({}, null, 2)
            },
            url: "{{baseUrl}}/escrow/fund-milestone/{{milestone2Id}}"
          }
        },
        {
          name: "Artisan Voluntary Refund Milestone 2 (PATCH /escrow/refund-milestone/:id)",
          request: {
            method: "PATCH",
            header: [
              { key: "Authorization", value: "Bearer {{artisanToken}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                refundReason: "Customer requested alternative installer for inverter setup."
              }, null, 2)
            },
            url: "{{baseUrl}}/escrow/refund-milestone/{{milestone2Id}}"
          }
        },
        {
          name: "Sync Monad On-Chain Escrow (POST /escrow/sync-onchain/:contractId)",
          request: {
            method: "POST",
            header: [{ key: "Authorization", value: "Bearer {{clientToken}}" }],
            url: "{{baseUrl}}/escrow/sync-onchain/{{contractId}}"
          }
        }
      ]
    },

    // 09. BANKING & WITHDRAWALS
    {
      name: "09. Banking & Withdrawals",
      item: [
        {
          name: "Link Bank Account (POST /wallets/bank-accounts)",
          event: [{
            listen: "test",
            script: {
              exec: [
                "const json = pm.response.json();",
                "if (json.data && json.data.id) {",
                "  pm.collectionVariables.set('bankAccountId', json.data.id);",
                "}"
              ]
            }
          }],
          request: {
            method: "POST",
            header: [
              { key: "Authorization", value: "Bearer {{artisanToken}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                bankName: "Guaranty Trust Bank",
                bankCode: "058",
                accountNumber: "0123456789",
                accountName: "Apex Electrical Technologies"
              }, null, 2)
            },
            url: "{{baseUrl}}/wallets/bank-accounts"
          }
        },
        {
          name: "Set Default Bank Account (PATCH /wallets/bank-accounts/:id/default)",
          request: {
            method: "PATCH",
            header: [{ key: "Authorization", value: "Bearer {{artisanToken}}" }],
            url: "{{baseUrl}}/wallets/bank-accounts/{{bankAccountId}}/default"
          }
        },
        {
          name: "Request Withdrawal Payout (POST /wallets/withdraw)",
          event: [{
            listen: "test",
            script: {
              exec: [
                "const json = pm.response.json();",
                "if (json.data && json.data.id) {",
                "  pm.collectionVariables.set('payoutId', json.data.id);",
                "}"
              ]
            }
          }],
          request: {
            method: "POST",
            header: [
              { key: "Authorization", value: "Bearer {{artisanToken}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                bankAccountId: "{{bankAccountId}}",
                amount: 20000
              }, null, 2)
            },
            url: "{{baseUrl}}/wallets/withdraw"
          }
        },
        {
          name: "Cancel Withdrawal Request (DELETE /wallets/withdrawals/:id)",
          request: {
            method: "DELETE",
            header: [{ key: "Authorization", value: "Bearer {{artisanToken}}" }],
            url: "{{baseUrl}}/wallets/withdrawals/{{payoutId}}"
          }
        },
        {
          name: "Get Saved Cards (GET /wallets/saved-cards)",
          request: {
            method: "GET",
            header: [{ key: "Authorization", value: "Bearer {{clientToken}}" }],
            url: "{{baseUrl}}/wallets/saved-cards"
          }
        }
      ]
    },

    // 10. REVIEWS & REPUTATION
    {
      name: "10. Reviews & Reputation",
      item: [
        {
          name: "Create Review (POST /reviews)",
          event: [{
            listen: "test",
            script: {
              exec: [
                "const json = pm.response.json();",
                "if (json.data && json.data.id) {",
                "  pm.collectionVariables.set('reviewId', json.data.id);",
                "}"
              ]
            }
          }],
          request: {
            method: "POST",
            header: [
              { key: "Authorization", value: "Bearer {{clientToken}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                contractId: "{{contractId}}",
                overallRating: 5,
                qualityRating: 5,
                communicationRating: 5,
                punctualityRating: 5,
                comment: "Brilliant solar installation! Highly recommended master engineer."
              }, null, 2)
            },
            url: "{{baseUrl}}/reviews"
          }
        },
        {
          name: "Edit Review (PUT /reviews/:id)",
          request: {
            method: "PUT",
            header: [
              { key: "Authorization", value: "Bearer {{clientToken}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                comment: "Brilliant solar installation! Highly recommended master engineer (Updated)."
              }, null, 2)
            },
            url: "{{baseUrl}}/reviews/{{reviewId}}"
          }
        },
        {
          name: "Artisan Reply to Review (POST /reviews/:reviewId/reply)",
          request: {
            method: "POST",
            header: [
              { key: "Authorization", value: "Bearer {{artisanToken}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                artisanReply: "Thank you Mr. Chinedu! It was a pleasure delivering your clean solar installation."
              }, null, 2)
            },
            url: "{{baseUrl}}/reviews/{{reviewId}}/reply"
          }
        },
        {
          name: "Get Artisan Public Reviews (GET /reviews/artisan/:id)",
          request: {
            method: "GET",
            url: "{{baseUrl}}/reviews/artisan/{{artisanId}}"
          }
        }
      ]
    },

    // 11. DISPUTES & COLLABORATION
    {
      name: "11. Disputes & Collaboration",
      item: [
        {
          name: "File Dispute (POST /disputes)",
          event: [{
            listen: "test",
            script: {
              exec: [
                "const json = pm.response.json();",
                "if (json.data && json.data.id) {",
                "  pm.collectionVariables.set('disputeId', json.data.id);",
                "}"
              ]
            }
          }],
          request: {
            method: "POST",
            header: [
              { key: "Authorization", value: "Bearer {{clientToken}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                contractId: "{{contractId}}",
                reason: "Inverter calibration clarification",
                explanation: "Need confirmation on load balancing specifications."
              }, null, 2)
            },
            url: "{{baseUrl}}/disputes"
          }
        },
        {
          name: "Get Contract Disputes (GET /disputes/contract/:contractId)",
          request: {
            method: "GET",
            header: [{ key: "Authorization", value: "Bearer {{clientToken}}" }],
            url: "{{baseUrl}}/disputes/contract/{{contractId}}"
          }
        },
        {
          name: "Send Dispute Message (POST /disputes/:id/messages)",
          request: {
            method: "POST",
            header: [
              { key: "Authorization", value: "Bearer {{artisanToken}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                body: "I have uploaded the manufacturer calibration charts for your review."
              }, null, 2)
            },
            url: "{{baseUrl}}/disputes/{{disputeId}}/messages"
          }
        },
        {
          name: "Get Dispute Messages (GET /disputes/:id/messages)",
          request: {
            method: "GET",
            header: [{ key: "Authorization", value: "Bearer {{clientToken}}" }],
            url: "{{baseUrl}}/disputes/{{disputeId}}/messages"
          }
        },
        {
          name: "Upload Supplementary Evidence (POST /disputes/:id/evidence)",
          event: [{
            listen: "test",
            script: {
              exec: [
                "const json = pm.response.json();",
                "if (json.data && json.data.id) {",
                "  pm.collectionVariables.set('evidenceId', json.data.id);",
                "}"
              ]
            }
          }],
          request: {
            method: "POST",
            header: [
              { key: "Authorization", value: "Bearer {{artisanToken}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                title: "Calibration Spec Sheet",
                fileUrl: "https://storage.artisan.ng/evidence/spec_sheet.pdf",
                mimeType: "application/pdf"
              }, null, 2)
            },
            url: "{{baseUrl}}/disputes/{{disputeId}}/evidence"
          }
        },
        {
          name: "Cancel / Withdraw Dispute (PATCH /disputes/:id/cancel)",
          request: {
            method: "PATCH",
            header: [{ key: "Authorization", value: "Bearer {{clientToken}}" }],
            url: "{{baseUrl}}/disputes/{{disputeId}}/cancel"
          }
        }
      ]
    },

    // 12. REAL-TIME CHAT & MESSAGING
    {
      name: "12. Real-Time Chat & Messaging",
      item: [
        {
          name: "Get Conversations (GET /chat/conversations)",
          event: [{
            listen: "test",
            script: {
              exec: [
                "const json = pm.response.json();",
                "if (json.data && json.data.length > 0) {",
                "  pm.collectionVariables.set('conversationId', json.data[0].id);",
                "}"
              ]
            }
          }],
          request: {
            method: "GET",
            header: [{ key: "Authorization", value: "Bearer {{clientToken}}" }],
            url: "{{baseUrl}}/chat/conversations"
          }
        },
        {
          name: "Send Chat Message (POST /chat/conversations/:id/messages)",
          event: [{
            listen: "test",
            script: {
              exec: [
                "const json = pm.response.json();",
                "if (json.data && json.data.id) {",
                "  pm.collectionVariables.set('messageId', json.data.id);",
                "}"
              ]
            }
          }],
          request: {
            method: "POST",
            header: [
              { key: "Authorization", value: "Bearer {{clientToken}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                body: "Hello engineer, confirming that all panels are performing at peak output!"
              }, null, 2)
            },
            url: "{{baseUrl}}/chat/conversations/{{conversationId}}/messages"
          }
        },
        {
          name: "Get Message History (GET /chat/conversations/:id/messages)",
          request: {
            method: "GET",
            header: [{ key: "Authorization", value: "Bearer {{clientToken}}" }],
            url: "{{baseUrl}}/chat/conversations/{{conversationId}}/messages"
          }
        },
        {
          name: "Edit Message (PUT /chat/messages/:id)",
          request: {
            method: "PUT",
            header: [
              { key: "Authorization", value: "Bearer {{clientToken}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                body: "Hello engineer, confirming that all panels are performing at peak output! (Edited)"
              }, null, 2)
            },
            url: "{{baseUrl}}/chat/messages/{{messageId}}"
          }
        },
        {
          name: "Mute Conversation (PATCH /chat/conversations/:id/mute)",
          request: {
            method: "PATCH",
            header: [{ key: "Authorization", value: "Bearer {{clientToken}}" }],
            url: "{{baseUrl}}/chat/conversations/{{conversationId}}/mute"
          }
        }
      ]
    },

    // 13. IN-APP NOTIFICATIONS
    {
      name: "13. In-App Notifications",
      item: [
        {
          name: "Get Notifications Inbox (GET /notifications)",
          event: [{
            listen: "test",
            script: {
              exec: [
                "const json = pm.response.json();",
                "if (json.data && json.data.notifications && json.data.notifications.length > 0) {",
                "  pm.collectionVariables.set('notificationId', json.data.notifications[0].id);",
                "}"
              ]
            }
          }],
          request: {
            method: "GET",
            header: [{ key: "Authorization", value: "Bearer {{artisanToken}}" }],
            url: "{{baseUrl}}/notifications"
          }
        },
        {
          name: "Mark Single Notification as Read (PATCH /notifications/:id/read)",
          request: {
            method: "PATCH",
            header: [{ key: "Authorization", value: "Bearer {{artisanToken}}" }],
            url: "{{baseUrl}}/notifications/{{notificationId}}/read"
          }
        },
        {
          name: "Mark All Notifications as Read (PATCH /notifications/read-all)",
          request: {
            method: "PATCH",
            header: [{ key: "Authorization", value: "Bearer {{artisanToken}}" }],
            url: "{{baseUrl}}/notifications/read-all"
          }
        }
      ]
    },

    // 14. ADMIN MANAGEMENT
    {
      name: "14. Admin Management",
      item: [
        {
          name: "Create Category (POST /admin/categories)",
          event: [{
            listen: "test",
            script: {
              exec: [
                "const json = pm.response.json();",
                "if (json.data && json.data.id) {",
                "  pm.collectionVariables.set('adminCategoryId', json.data.id);",
                "}"
              ]
            }
          }],
          request: {
            method: "POST",
            header: [
              { key: "Authorization", value: "Bearer {{adminToken}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                name: "HVAC & Air Treatment",
                slug: "hvac-air-treatment-" + Date.now()
              }, null, 2)
            },
            url: "{{baseUrl}}/admin/categories"
          }
        },
        {
          name: "Update Category (PUT /admin/categories/:id)",
          request: {
            method: "PUT",
            header: [
              { key: "Authorization", value: "Bearer {{adminToken}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                name: "HVAC & Climate Control"
              }, null, 2)
            },
            url: "{{baseUrl}}/admin/categories/{{adminCategoryId}}"
          }
        },
        {
          name: "Create Skill under Category (POST /admin/skills)",
          event: [{
            listen: "test",
            script: {
              exec: [
                "const json = pm.response.json();",
                "if (json.data && json.data.id) {",
                "  pm.collectionVariables.set('adminSkillId', json.data.id);",
                "}"
              ]
            }
          }],
          request: {
            method: "POST",
            header: [
              { key: "Authorization", value: "Bearer {{adminToken}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                categoryId: 1,
                name: "Industrial Chiller " + Date.now(),
                slug: "industrial-chiller-" + Date.now()
              }, null, 2)
            },
            url: "{{baseUrl}}/admin/skills"
          }
        },
        {
          name: "Update User Status (PATCH /admin/users/:id/status)",
          request: {
            method: "PATCH",
            header: [
              { key: "Authorization", value: "Bearer {{adminToken}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                status: "ACTIVE",
                reason: "Administrative verification verified"
              }, null, 2)
            },
            url: "{{baseUrl}}/admin/users/{{clientId}}/status"
          }
        },
        {
          name: "Get Audit Logs (GET /admin/audit-logs)",
          request: {
            method: "GET",
            header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
            url: "{{baseUrl}}/admin/audit-logs"
          }
        },
        {
          name: "Get System Settings (GET /admin/settings)",
          request: {
            method: "GET",
            header: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
            url: "{{baseUrl}}/admin/settings"
          }
        },
        {
          name: "Update System Setting (PUT /admin/settings/:key)",
          request: {
            method: "PUT",
            header: [
              { key: "Authorization", value: "Bearer {{adminToken}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                value: "5.00",
                description: "Platform service fee on released escrow milestones"
              }, null, 2)
            },
            url: "{{baseUrl}}/admin/settings/ESCROW_FEE_PERCENT"
          }
        }
      ]
    }
  ]
};

const environment = {
  name: "Artisan Escrow Local Environment",
  values: [
    { key: "baseUrl", value: "http://localhost:5050/api/v1", enabled: true }
  ]
};

const collectionPath = path.resolve(__dirname, '../Artisan_Master_Postman_Collection.json');
const environmentPath = path.resolve(__dirname, '../Artisan_Postman_Environment.json');

fs.writeFileSync(collectionPath, JSON.stringify(collection, null, 2), 'utf8');
fs.writeFileSync(environmentPath, JSON.stringify(environment, null, 2), 'utf8');

console.log(`✅ Master Postman Collection written to: ${collectionPath}`);
console.log(`✅ Postman Environment written to: ${environmentPath}`);
