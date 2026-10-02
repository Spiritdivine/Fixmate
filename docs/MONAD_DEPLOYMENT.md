# Monad Deployment Guide: Artisan Escrow (Production & Mainnet Ready)

This guide provides instructions to deploy and operate the **`ArtisanEscrow.sol`** smart contract on **Monad Mainnet** and **Monad Testnet**.

---

## 1. Network Configuration Reference

| Parameter | Monad Testnet | Monad Mainnet |
| :--- | :--- | :--- |
| **Network Name** | Monad Testnet | Monad Mainnet |
| **RPC URL** | `https://testnet-rpc.monad.xyz` | `https://rpc.monad.xyz` (or private Infura/Alchemy endpoint) |
| **Chain ID** | `10143` | `143` *(or official mainnet chain ID upon launch)* |
| **Currency Symbol**| `MON` | `MON` |
| **Block Explorer** | `https://testnet.monadexplorer.com` | `https://monadexplorer.com` |
| **USDC Token** | Mintable `MockUSDC.sol` (Faucet) | Official Canonical Circle USDC (`6 decimals`) |

---

## 2. Smart Contract Architecture & SOLID Principles

The smart contract layer adheres to modern software engineering best practices:

* **Single Responsibility Principle (SRP):** [contracts/ArtisanEscrow.sol](file:///Users/mac/Artisan/contracts/ArtisanEscrow.sol) focuses strictly on escrow state transitions, safe token custody, and event emissions.
* **Interface Segregation Principle (ISP):** [contracts/interfaces/IArtisanEscrow.sol](file:///Users/mac/Artisan/contracts/interfaces/IArtisanEscrow.sol) cleanly isolates types, events, custom errors, and method signatures from contract storage.
* **Liskov Substitution Principle (LSP):** Powered by OpenZeppelin's `SafeERC20` (`safeTransfer`, `safeTransferFrom`), supporting any standard or non-standard compliant ERC-20 token seamlessly.
* **Dependency Inversion Principle (DIP):** Contracts depend on the `IERC20` abstraction rather than concrete implementations.
* **Two-Step Ownership (`Ownable2Step`):** Protects against catastrophic accidental transfers of contract ownership.
* **Reentrancy & Circuit Breakers:** OpenZeppelin `ReentrancyGuard` and `Pausable` for emergency operational controls.

---

## 3. Environment Setup

Configure your `.env` file according to the target network:

### For Monad Testnet:
```env
MONAD_NETWORK="testnet"
MONAD_RPC_URL="https://testnet-rpc.monad.xyz"
MONAD_CHAIN_ID=10143
DEPLOYER_PRIVATE_KEY="0x_your_private_key"
ESCROW_ARBITER_ADDRESS="0x_your_arbiter_wallet"
ESCROW_FEE_RECIPIENT="0x_your_fee_collector"
# Optional on testnet: leave empty to auto-deploy MockUSDC
STABLECOIN_CONTRACT_ADDRESS=""
```

### For Monad Mainnet (Production):
```env
MONAD_NETWORK="mainnet"
MONAD_RPC_URL="https://rpc.monad.xyz"
MONAD_CHAIN_ID=143
DEPLOYER_PRIVATE_KEY="0x_mainnet_deployer_key"
ESCROW_ARBITER_ADDRESS="0x_dedicated_arbiter_wallet"
ESCROW_FEE_RECIPIENT="0x_cold_multisig_vault"
# Mandatory on mainnet: Canonical Circle USDC address
STABLECOIN_CONTRACT_ADDRESS="0x_canonical_usdc_mainnet_address"
```

---

## 4. Compilation & Deployment

```bash
# 1. Compile with optimizer & OpenZeppelin resolution
npm run compile

# 2. Deploy to Monad (automatically detects testnet vs mainnet)
npm run deploy:escrow
```

The script will:
1. Validate connectivity and deployer MON gas balance.
2. If on Mainnet: Enforce canonical USDC presence and check `decimals() == 6`.
3. If on Testnet: Deploy or bind to existing testnet stablecoin.
4. Deploy `ArtisanEscrow.sol` with `Ownable2Step`, `ReentrancyGuard`, and `Pausable`.
5. Write receipt metadata to [src/config/contracts/deployment.json](file:///Users/mac/Artisan/src/config/contracts/deployment.json).
6. Update `ESCROW_CONTRACT_ADDRESS` and `STABLECOIN_CONTRACT_ADDRESS` in `.env`.

---

## 5. Verification & Test Suite

Verify complete end-to-end functionality:
```bash
npm run test:monad
```
