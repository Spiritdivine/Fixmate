import { PrivyClient } from '@privy-io/server-auth';
import { env } from '../config/env.js';
import { ApiError } from '../utils/api-error.js';

/**
 * Service responsible strictly for communicating with Privy Server API,
 * validating Privy authentication tokens, and resolving embedded wallet addresses.
 * Adheres strictly to the Single Responsibility Principle (SRP).
 */
export class PrivyService {
  static client = null;

  /**
   * Checks whether Privy server credentials are configured in the environment
   * @returns {boolean}
   */
  static isConfigured() {
    return Boolean(
      env.PRIVY_APP_ID &&
      env.PRIVY_APP_SECRET &&
      env.PRIVY_APP_ID.length > 5 &&
      !env.PRIVY_APP_ID.includes('your-privy-app-id')
    );
  }

  /**
   * Lazy-initializes and caches the PrivyClient singleton
   * @returns {PrivyClient}
   */
  static getClient() {
    if (!this.client) {
      if (!this.isConfigured()) {
        throw ApiError.internal('Privy App ID or App Secret is not configured in backend environment.');
      }
      this.client = new PrivyClient(env.PRIVY_APP_ID, env.PRIVY_APP_SECRET);
    }
    return this.client;
  }

  /**
   * Verifies a Privy authorization bearer token from frontend requests
   * @param {string} authToken
   * @returns {Promise<any>} Verified claims object
   */
  static async verifyAuthToken(authToken) {
    if (!this.isConfigured()) {
      return null;
    }
    try {
      const client = this.getClient();
      const verifiedClaims = await client.verifyAuthToken(authToken);
      return verifiedClaims;
    } catch (err) {
      throw ApiError.unauthorized(`Invalid or expired Privy session token: ${err.message}`);
    }
  }

  /**
   * Fetches user profile data from Privy by their Privy DID
   * @param {string} did - e.g. "did:privy:clxyz..."
   * @returns {Promise<any>}
   */
  static async getUser(did) {
    if (!this.isConfigured() || !did) {
      return null;
    }
    try {
      const client = this.getClient();
      const user = await client.getUser(did);
      return user;
    } catch (err) {
      console.warn(`[PrivyService] Failed to fetch user ${did}:`, err.message);
      return null;
    }
  }

  /**
   * Resolves the user's primary embedded EVM wallet address from their Privy user record
   * @param {string} did - Privy DID
   * @returns {Promise<string|null>} 0x... EVM address or null
   */
  static async getEmbeddedWalletAddress(did) {
    const user = await this.getUser(did);
    if (!user || !user.linkedAccounts) {
      return null;
    }

    const embeddedWallet = user.linkedAccounts.find(
      (acc) => acc.type === 'wallet' && acc.walletClientType === 'privy'
    );

    return embeddedWallet?.address || null;
  }

  /**
   * Programmatically provisions a server-side wallet for non-interactive users
   * Requires Privy Wallet API to be active on the dashboard.
   * @returns {Promise<{ id: string, address: string, chainType: string } | null>}
   */
  static async createServerWallet() {
    if (!this.isConfigured()) {
      return null;
    }
    try {
      const client = this.getClient();
      if (client.walletApi) {
        const createFn = client.walletApi.create || client.walletApi.createWallet;
        if (typeof createFn === 'function') {
          const wallet = await createFn.call(client.walletApi, { chainType: 'ethereum' });
          return {
            id: wallet.id,
            address: wallet.address,
            chainType: wallet.chainType,
          };
        }
      }
      return null;
    } catch (err) {
      console.warn('[PrivyService] Programmatic wallet creation skipped or unavailable:', err.message);
      return null;
    }
  }
}

export default PrivyService;
