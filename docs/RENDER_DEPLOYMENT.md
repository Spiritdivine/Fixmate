# 🚀 Deploying Fixmate Backend to Render

This guide provides step-by-step instructions for deploying the **Fixmate Backend API** to [Render](https://render.com).

---

## 🛠️ Prerequisites

1. A **Render Account** ([render.com](https://render.com)).
2. A **PostgreSQL Database** (Render PostgreSQL, [Supabase](https://supabase.com), or [Neon](https://neon.tech)).
3. Access to your GitHub repository ([github.com/Spiritdivine/Fixmate](https://github.com/Spiritdivine/Fixmate)).

---

## Option A: Deploy via Render Web Service (Recommended & Simplest)

### Step 1: Create a PostgreSQL Database (if you don't already have one)
1. On Render Dashboard, click **New +** -> **PostgreSQL**.
2. Name: `fixmate-db`.
3. Plan: **Free** or **Starter**.
4. Once created, copy the **Internal Database URL** (or External Database URL).

---

### Step 2: Create the Web Service
1. On Render Dashboard, click **New +** -> **Web Service**.
2. Connect your GitHub repository: `Spiritdivine/Fixmate`.
3. Configure the service settings:
   - **Name:** `fixmate-backend`
   - **Region:** Same region as your database (e.g., `Oregon (US West)` or `Frankfurt (EU)`)
   - **Branch:** `main`
   - **Root Directory:** *(leave blank)*
   - **Runtime:** `Node`
   - **Build Command:**
     ```bash
     npm install && npm run build
     ```
   - **Start Command:**
     ```bash
     npx prisma migrate deploy && npm start
     ```
   - **Instance Type:** `Free` or `Starter`

---

### Step 3: Configure Environment Variables
Under **Environment Variables**, add the following keys:

| Key | Value / Description | Required? |
| :--- | :--- | :---: |
| `NODE_ENV` | `production` | ✅ Yes |
| `DATABASE_URL` | Your PostgreSQL connection string (from Supabase/Neon/Render) | ✅ Yes |
| `CLIENT_URL` | `*` (or your frontend domain, e.g. `https://fixmate.vercel.app`) | ✅ Yes |
| `JWT_ACCESS_SECRET` | A strong 64-char random string | ✅ Yes |
| `JWT_ACCESS_EXPIRES_IN` | `15m` | ✅ Yes |
| `JWT_REFRESH_SECRET` | Another strong 64-char random string | ✅ Yes |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | ✅ Yes |
| `ESCROW_FEE_PERCENT` | `5.00` | ✅ Yes |
| `MONAD_RPC_URL` | `https://testnet-rpc.monad.xyz` | ✅ Yes |
| `MONAD_CHAIN_ID` | `10143` | ✅ Yes |
| `DEPLOYER_PRIVATE_KEY` | `0x...` (Wallet private key for on-chain interactions) | ⚡ Optional / Web3 |
| `ESCROW_CONTRACT_ADDRESS` | `0x088D3083a2873BB4D72B6Fde542736A4dD8D55de` | ⚡ Optional / Web3 |
| `PAYSTACK_SECRET_KEY` | `sk_live_...` or `sk_test_...` | ⚡ Optional / Fiat |
| `PAYSTACK_PUBLIC_KEY` | `pk_live_...` or `pk_test_...` | ⚡ Optional / Fiat |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary Cloud Name | ⚡ Optional / Media |
| `CLOUDINARY_API_KEY` | Your Cloudinary API Key | ⚡ Optional / Media |
| `CLOUDINARY_API_SECRET` | Your Cloudinary API Secret | ⚡ Optional / Media |
| `RESEND_API_KEY` | Your Resend API key for live emails | ⚡ Optional / Email |

---

### Step 4: Health Check & Deploy
1. Expand **Advanced** -> **Health Check Path** and set it to:
   ```
   /api/v1/health
   ```
2. Click **Create Web Service**.
3. Render will pull your repo, install dependencies, generate Prisma client, compile contracts, run migrations, and launch the server.
4. Your API will be live at:
   ```
   https://fixmate-backend.onrender.com
   ```

---

## Option B: Deploy via Render Blueprint (`render.yaml`)

1. Go to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** -> **Blueprint**.
3. Connect `Spiritdivine/Fixmate`.
4. Render will read [`render.yaml`](file:///Users/mac/Artisan/render.yaml) automatically.
5. Fill in the missing secret keys (`DATABASE_URL`, etc.) and click **Apply**.

---

## 🧪 Post-Deployment Verification

Once deployed, verify your service by running:

```bash
# 1. Check API Health
curl https://<your-render-subdomain>.onrender.com/api/v1/health

# 2. Check Socket.IO Handshake
curl "https://<your-render-subdomain>.onrender.com/socket.io/?EIO=4&transport=polling"
```
