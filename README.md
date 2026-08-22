# Fixmate - Decentralized Escrow & Artisan Marketplace Backend

A robust, decentralized and fiat-compatible marketplace backend connecting clients with verified artisans featuring milestone-based escrow protection, real-time messaging, and EVM smart contract integration on the **Monad Blockchain Testnet**.

---

## 📚 Documentation Quicklinks

- **[Complete API Documentation (All 44 Endpoints)](file:///Users/mac/Artisan/docs/API_DOCUMENTATION.md)**
- **[Monad Testnet Smart Contract Deployment Guide](file:///Users/mac/Artisan/docs/MONAD_DEPLOYMENT.md)**
- **[Master Postman Collection](file:///Users/mac/Artisan/Artisan_Master_Postman_Collection.json)**

---

## 🛠️ Tech Stack & Architecture

- **Backend Framework:** Node.js (ESM), Express 5
- **Database & ORM:** PostgreSQL, Prisma ORM
- **Blockchain:** Monad Testnet (EVM Chain ID `10143`), `ethers.js` v6, Solidity `0.8.36`
- **Real-Time Communication:** Socket.io (WebSockets with JWT authentication)
- **Validation & Security:** Zod schemas, Helmet, CORS, JWT (Access + Refresh tokens)

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Copy the example environment file and configure database & blockchain settings:
```bash
cp .env.example .env
```

### 3. Database Migration & Prisma Client
```bash
npm run prisma:generate
npm run prisma:migrate
```

### 4. Start Development Server
```bash
npm run dev
```
The server will boot on `http://localhost:5050` (or the configured `PORT`).

---

## 🧪 Testing & Verification

```bash
# Run the complete 34-step end-to-end API test suite
node scripts/test-all-endpoints.js

# Compile Solidity contracts
npm run compile

# Deploy Escrow contract to Monad Testnet
npm run deploy:escrow

# Test Monad on-chain escrow lifecycle
npm run test:monad

# Run full marketplace demonstration flow
npm run demo
```

---

## 📋 API Modules Summary

| Module | Base Path | Endpoints Count | Description |
| :--- | :--- | :---: | :--- |
| **System** | `/api/v1/health` | 1 | Uptime & health check |
| **Auth** | `/api/v1/auth` | 6 | Register, Login, Refresh, Logout, OTP, Profile |
| **Profiles** | `/api/v1/profiles` | 9 | Artisan discovery, portfolios, client/artisan profiles, KYC, Wallet binding |
| **Jobs** | `/api/v1/jobs` | 5 | Categories, job posting, browsing, client jobs, details |
| **Proposals** | `/api/v1/proposals` | 3 | Submit proposals/bids, my proposals, job proposals |
| **Contracts** | `/api/v1/contracts` | 3 | Accept proposal, list contracts, contract details |
| **Escrow** | `/api/v1/escrow` | 3 | Fund milestone (Web2 / Web3 Monad), submit work, approve release |
| **Wallets** | `/api/v1/wallets` | 5 | Balances, simulation top-up, bank accounts, withdrawals |
| **Payments** | `/api/v1/payments` | 1 | Payment provider webhooks |
| **Disputes** | `/api/v1/disputes` | 3 | File dispute, fetch dispute logs, admin arbitration |
| **Reviews** | `/api/v1/reviews` | 2 | Submit multi-criteria review, fetch artisan reviews |
| **Chat** | `/api/v1/chat` | 3 | List conversations, message history, send message (REST) |
| **WebSockets** | `ws://localhost:5050` | Full Duplex | Real-time chat, typing indicators, user alerts |

*For complete payload specifications, error schemas, and response examples, refer to [docs/API_DOCUMENTATION.md](file:///Users/mac/Artisan/docs/API_DOCUMENTATION.md).*
