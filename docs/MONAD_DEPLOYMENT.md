# Monad Testnet Deployment Guide: Artisan Escrow

This guide provides step-by-step instructions to deploy the **`ArtisanEscrow.sol`** smart contract to the live **Monad Testnet**.

---

## 1. Network Configuration

| Parameter | Value |
| :--- | :--- |
| **Network Name** | Monad Testnet |
| **RPC URL** | `https://testnet-rpc.monad.xyz` |
| **Chain ID** | `10143` |
| **Currency Symbol** | `MON` |
| **Block Explorer** | `https://testnet.monadexplorer.com` |

---

## 2. Prerequisites

1. An EVM-compatible wallet (e.g. MetaMask, Rabby, or Coinbase Wallet).
2. Testnet `MON` tokens obtained from the official Monad Faucet.
3. Export your deployer wallet private key.

---

## 3. Environment Setup

Add your private key to your `.env` file in the root directory:

```env
# Monad Blockchain Settings
MONAD_RPC_URL="https://testnet-rpc.monad.xyz"
MONAD_CHAIN_ID=10143
DEPLOYER_PRIVATE_KEY="0x_your_private_key_here"
ESCROW_ARBITER_ADDRESS="0x_your_arbiter_wallet_address"
ESCROW_FEE_RECIPIENT="0x_your_fee_collector_address"
```

---

## 4. Compile & Deploy

Run the deployment script:

```bash
# 1. Compile the Solidity contract
npm run compile

# 2. Deploy to Monad Testnet
npm run deploy:escrow
```

The script will automatically:
1. Connect to Monad RPC.
2. Check your wallet balance.
3. Deploy `ArtisanEscrow.sol`.
4. Save deployment metadata to `src/config/contracts/deployment.json`.
5. Automatically update `ESCROW_CONTRACT_ADDRESS` in `.env`.

---

## 5. Live Deployment Verification & Links

The contract is live on Monad Testnet:

| Parameter | Value / Explorer Link |
| :--- | :--- |
| **Contract Address** | [`0x088D3083a2873BB4D72B6Fde542736A4dD8D55de`](https://testnet.monadvision.com/address/0x088D3083a2873BB4D72B6Fde542736A4dD8D55de) |
| **Deployment Tx Hash** | [`0x05e4a210f95e811d27e70ef24c7da2909928928fff780c27d4a62cc1f9e9a28f`](https://testnet.monadvision.com/tx/0x05e4a210f95e811d27e70ef24c7da2909928928fff780c27d4a62cc1f9e9a28f) |
| **MonadExplorer** | [testnet.monadexplorer.com](https://testnet.monadexplorer.com/address/0x088D3083a2873BB4D72B6Fde542736A4dD8D55de) |
| **Deployer / Arbiter** | [`0x9A979F4f6C24cBB96a2c4f7bd1fa2fdAb60173eB`](https://testnet.monadvision.com/address/0x9A979F4f6C24cBB96a2c4f7bd1fa2fdAb60173eB) |
| **Block Number** | `55585857` |

Run the automated Monad test suite:
```bash
npm run test:monad
```

