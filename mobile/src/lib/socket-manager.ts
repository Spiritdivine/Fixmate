import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';
import { getSocketBaseUrl } from './network-config';
import { ACCESS_TOKEN_KEY } from './api-client';
import { queryClient } from './query-client';

class SocketManager {
  private static instance: SocketManager;
  private socket: Socket | null = null;
  private isConnecting = false;

  private constructor() {}

  static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  async connect(): Promise<Socket | null> {
    if (this.socket?.connected) return this.socket;
    if (this.isConnecting) return null;

    this.isConnecting = true;
    try {
      const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
      if (!token) {
        this.isConnecting = false;
        return null;
      }

      this.socket = io(getSocketBaseUrl(), {
        auth: { token: `Bearer ${token}` },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 15,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10000,
      });

      this.registerSystemListeners();
      return this.socket;
    } catch {
      return null;
    } finally {
      this.isConnecting = false;
    }
  }

  private registerSystemListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      // Connected
    });

    this.socket.on('disconnect', () => {
      // Disconnected
    });

    // Real-Time Contract & Milestone Cache Invalidation
    this.socket.on('contract_updated', (data: { contractId?: string }) => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      if (data?.contractId) {
        queryClient.invalidateQueries({ queryKey: ['contracts', data.contractId] });
      }
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    });

    // Incoming Urgent Job Dispatch for Artisans
    this.socket.on('urgent_lead_dispatched', () => {
      queryClient.invalidateQueries({ queryKey: ['jobs', 'incoming'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    });

    // New Proposal alert
    this.socket.on('new_proposal', () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    });
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketManager = SocketManager.getInstance();
