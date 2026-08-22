# 🛠️ Fixmate — Decentralized Artisan Marketplace & Smart Escrow

[![Monad Testnet](https://img.shields.io/badge/Network-Monad_Testnet_(10143)-8A2BE2.svg)](https://testnet.monadvision.com)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20+-363636.svg)](https://soliditylang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-v20+-339933.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-6.x-2D3748.svg)](https://www.prisma.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Fixmate** is a high-performance, decentralized artisan marketplace that bridges Web2 fiat trust with Web3 smart contract escrow guarantees on the **Monad Blockchain**. Clients hire verified artisans (electricians, plumbers, carpenters, solar technicians) with 100% milestone-based escrow protection, dual payment rails (Fiat NGN & Crypto MON), before/after proof verification, and real-time chat.

---

## 🌐 Live Production Deployments & Contract Links

| Resource | Environment | Link / Explorer |
| :--- | :--- | :--- |
| **Frontend Web App** | **Vercel** | [fixmate-ashy.vercel.app](https://fixmate-ashy.vercel.app) |
| **Backend REST & Socket API** | **Render** | [fixmate-backend-a6t1.onrender.com](https://fixmate-backend-a6t1.onrender.com) |
| **Monad Deployment Tx Hash** | **MonadVision** | [`0x05e4a2...e9a28f`](https://testnet.monadvision.com/tx/0x05e4a210f95e811d27e70ef24c7da2909928928fff780c27d4a62cc1f9e9a28f) |
| **Monad Deployment Tx (Alt)** | **MonadExplorer** | [`0x05e4a2...e9a28f`](https://testnet.monadexplorer.com/tx/0x05e4a210f95e811d27e70ef24c7da2909928928fff780c27d4a62cc1f9e9a28f) |
| **Escrow Smart Contract** | **MonadVision** | [`0x088D3083a2873BB4D72B6Fde542736A4dD8D55de`](https://testnet.monadvision.com/address/0x088D3083a2873BB4D72B6Fde542736A4dD8D55de) |
| **Escrow Smart Contract (Alt)** | **MonadExplorer** | [`0x088D3083a2873BB4D72B6Fde542736A4dD8D55de`](https://testnet.monadexplorer.com/address/0x088D3083a2873BB4D72B6Fde542736A4dD8D55de) |
| **Deployer & Arbiter Wallet** | **MonadVision** | [`0x9A979F4f6C24cBB96a2c4f7bd1fa2fdAb60173eB`](https://testnet.monadvision.com/address/0x9A979F4f6C24cBB96a2c4f7bd1fa2fdAb60173eB) |
| **API Health Status** | **Live Endpoint** | [`/api/v1/health`](https://fixmate-backend-a6t1.onrender.com/api/v1/health) |

---

## ⚡ Key Highlights & Value Proposition

- 🛡️ **Zero-Trust Smart Escrow:** Funds are never paid upfront directly to the artisan. Monad smart contracts lock funds securely until work is submitted and verified.
- 💳 **Dual Payment Rails:** 
  - **Crypto Native:** Instant milestone funding and automated payouts via Monad `$MON`.
  - **Fiat Native:** Seamless NGN bank cards and transfers powered by Paystack.
- 🔍 **Proof-of-Work Verification:** Artisans submit photographic/video evidence before escrow release.
- 💬 **Full-Duplex Real-Time Chat:** Socket.IO messaging with typing indicators, attachments, and event pushes.
- ⚖️ **Cryptographic Dispute Arbitration:** Multi-signature / admin dispute resolution with evidence vaults and partial refund capabilities.
- 📡 **Automated Block Poller & Listener:** Background worker synchronizes Monad EVM blockchain events directly with PostgreSQL and WebSockets in real time.

---

## 🏗️ Architecture & Technology Stack

```
                               ┌──────────────────────────────────────────────┐
                               │           Fixmate Client & Artisan App       │
                               │        React 19 • Vite • Tailwind • SPA      │
                               └──────────────────────┬───────────────────────┘
                                                      │ HTTPS / WSS
                                                      ▼
                               ┌──────────────────────────────────────────────┐
                               │           Fixmate Backend Gateway            │
                               │         Express 5 • Socket.IO • Zod          │
                               └──────────────┬────────────────┬──────────────┘
                                              │                │
                      ┌───────────────────────┴─┐            ┌─┴────────────────────────┐
                      ▼                         ▼            ▼                          ▼
            ┌───────────────────┐     ┌───────────────────┐ ┌──────────────┐   ┌────────────────┐
            │  PostgreSQL (DB)  │     │ Cloudinary CDN    │ │ Paystack     │   │ Monad Testnet  │
            │  Prisma ORM       │     │ Media & Proofs    │ │ Fiat Gateway │   │ EVM Escrow     │
            └───────────────────┘     └───────────────────┘ └──────────────┘   └────────────────┘
```

### Core Technologies:
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, React Query (TanStack), Zustand, Lucide Icons, Socket.io-client.
- **Backend API:** Node.js (ESM), Express 5, Prisma ORM, PostgreSQL (Neon/Supabase/Render).
- **Smart Contracts:** Solidity `0.8.20+`, `ethers.js` v6, solc compiler.
- **Real-Time:** Socket.IO with JWT authentication and participant room isolation.
- **Storage & Payments:** Cloudinary Media API, Paystack Payment Gateway.

---

## 📜 Monad Smart Contract Specification (`ArtisanEscrow.sol`)

The `ArtisanEscrow` contract manages milestone state machines with full cryptographic transparency:

```solidity
enum EscrowState {
    FUNDED,          // Milestone funded by client (crypto or fiat relayer)
    WORK_SUBMITTED,  // Artisan submitted completion proofs
    RELEASED,        // Client approved work -> 95% to artisan, 5% platform fee
    DISPUTED,        // Dispute raised by either party
    RESOLVED,        // Arbiter resolved dispute
    REFUNDED         // Milestone refunded back to client
}
```

### On-Chain Contract Parameters:
- **Contract Code:** `ArtisanEscrow.sol`
- **Network:** Monad Testnet (Chain ID `10143`)
- **Address:** `0x088D3083a2873BB4D72B6Fde542736A4dD8D55de`
- **Platform Commission:** `500 bps` (5.00%) automatically routed to platform treasury.
- **Reentrancy Protection:** Guarded mutex state machine against re-entrant calls.

---

## 📂 Project Structure

```
Artisan/
├── contracts/                        # Solidity Smart Contracts
│   └── ArtisanEscrow.sol             # Monad Escrow Contract
├── docs/                             # Deep-dive documentation
│   ├── API_DOCUMENTATION.md          # 44 REST API Endpoints Specification
│   ├── MONAD_DEPLOYMENT.md           # Smart Contract Deployment Guide
│   └── RENDER_DEPLOYMENT.md          # Production Deployment Guide
├── frontend/                         # Vite + React 19 Frontend App
│   ├── src/
│   │   ├── components/               # UI components & role layouts
│   │   ├── lib/                      # API client (axios) & Socket.io client
│   │   ├── pages/                    # Client, Artisan & Admin views
│   │   └── stores/                   # Zustand global state stores
│   └── vercel.json                   # Vercel SPA routing configuration
├── prisma/
│   ├── schema.prisma                 # Relational database schema
│   └── seed.js                       # Idempotent database seeder
├── scripts/                          # Build, deploy & test scripts
│   ├── compile-contract.js           # Solc compiler
│   ├── deploy-escrow.js              # Monad deployer script
│   ├── test-monad-flow.js            # Monad on-chain lifecycle test
│   └── test-all-endpoints.js         # 34-step E2E API verification
└── src/                              # Backend Express Application
    ├── config/                       # Env validation & contract ABIs
    ├── controllers/                  # REST Endpoint controllers
    ├── middlewares/                  # Auth, validation, rate limiter
    ├── routes/                       # Express router modules
    ├── services/                     # Business logic, Web3 & Monad listener
    └── sockets/                      # Socket.IO event handlers
```

---

## 🚀 Getting Started Locally

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Spiritdivine/Fixmate.git
cd Fixmate

# Install backend dependencies
npm install

# Install frontend dependencies
npm --prefix frontend install
```

### 2. Configure Environment Variables
```bash
# Backend environment setup
cp .env.example .env

# Frontend environment setup
cp frontend/.env.example frontend/.env.local
```

### 3. Database Migration & Seeding
```bash
npm run prisma:generate
npm run prisma:migrate
npm run start:prod # Automatically runs migrations & seeds demo accounts
```

### 4. Run Development Servers
In two separate terminals:
```bash
# Terminal 1: Backend API (Port 5050)
npm run dev

# Terminal 2: Frontend App (Port 5173)
npm run client:dev
```

---

## 🧪 Testing & Verification

```bash
# 1. Run Complete 34-Step API Test Suite
npm run test:all

# 2. Compile Solidity Escrow Contract
npm run compile

# 3. Test Live Monad Blockchain Escrow Flow
npm run test:monad

# 4. Verify Frontend Production Build
npm run client:build
```

---

## 📚 Documentation & Resources

- 📖 **[API Documentation (All 44 Endpoints)](docs/API_DOCUMENTATION.md)**: Full request/response payloads, authentication flows, error schemas.
- ⚡ **[Monad Deployment Guide](docs/MONAD_DEPLOYMENT.md)**: Details on deploying and verifying smart contracts on Monad.
- 🚀 **[Render & Cloud Deployment Guide](docs/RENDER_DEPLOYMENT.md)**: Step-by-step production hosting walkthrough.
- 📮 **[Postman Master Collection](Artisan_Master_Postman_Collection.json)**: Ready-to-import API test suite.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
