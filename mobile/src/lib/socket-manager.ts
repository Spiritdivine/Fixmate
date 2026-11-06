import { io, Socket } from 'socket.io-client';
import { Storage } from './storage';
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
      const token = await Storage.getItem(ACCESS_TOKEN_KEY);
      if (!token) {
        this.isConnecting = false;
        return null;
      }

      this.socket = io(getSocketBaseUrl(), {
        auth: { token },
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
      queryClient.invalidateQueries({ queryKey: ['marketplace-jobs'] });
    });

    // New Proposal Alert & Reactive Bid Cache Updates
    this.socket.on('new_proposal', () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['client-jobs'] });
    });

    // Domain Event: Proposal Received by Client
    this.socket.on('job:proposal_received', (data: { jobId?: string; proposalId?: string; bidAmount?: number }) => {
      queryClient.invalidateQueries({ queryKey: ['client-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job-details'] });
      if (data?.jobId) {
        queryClient.invalidateQueries({ queryKey: ['job-proposals', data.jobId] });
        queryClient.invalidateQueries({ queryKey: ['job-details', data.jobId] });
      }
    });

    // Domain Event: Proposal Status Changed (Shortlisted / Rejected / Accepted)
    this.socket.on('job:proposal_status_changed', (data: { jobId?: string; proposalId?: string; status?: string }) => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.invalidateQueries({ queryKey: ['my-proposals'] });
      if (data?.jobId) {
        queryClient.invalidateQueries({ queryKey: ['job-proposals', data.jobId] });
      }
    });

    // Domain Event: Direct Job Invitation Received by Artisan
    this.socket.on('job:invitation_received', () => {
      queryClient.invalidateQueries({ queryKey: ['artisan-invitations'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-jobs'] });
    });

    // Domain Event: Direct Job Invitation Responded (Client notified)
    this.socket.on('job:invitation_responded', () => {
      queryClient.invalidateQueries({ queryKey: ['client-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['client-open-jobs-for-invite'] });
    });

    // Domain Event: Contract Created upon Proposal Acceptance
    this.socket.on('job:contract_created', (data: { contractId?: string; jobId?: string }) => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      if (data?.contractId) {
        queryClient.invalidateQueries({ queryKey: ['contracts', data.contractId] });
      }
      if (data?.jobId) {
        queryClient.invalidateQueries({ queryKey: ['job-proposals', data.jobId] });
      }
      queryClient.invalidateQueries({ queryKey: ['client-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
    });

    // Domain Event: Job Cancelled or Removed
    this.socket.on('job:cancelled', (data: { jobId?: string }) => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['saved-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['my-proposals'] });
      queryClient.invalidateQueries({ queryKey: ['client-my-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['client-jobs'] });
      if (data?.jobId) {
        queryClient.invalidateQueries({ queryKey: ['job-details', data.jobId] });
        queryClient.invalidateQueries({ queryKey: ['job-proposals', data.jobId] });
      }
    });

    this.socket.on('marketplace:job_removed', (data: { jobId?: string }) => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-jobs'] });
      if (data?.jobId) {
        queryClient.invalidateQueries({ queryKey: ['job-details', data.jobId] });
      }
    });

    // Domain Event: Job Updated
    this.socket.on('job:updated', (data: { jobId?: string }) => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['saved-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['client-my-jobs'] });
      if (data?.jobId) {
        queryClient.invalidateQueries({ queryKey: ['job-details', data.jobId] });
        queryClient.invalidateQueries({ queryKey: ['job-proposals', data.jobId] });
      }
    });
  }

  joinConversation(conversationId: string) {
    if (this.socket?.connected) {
      this.socket.emit('join_conversation', conversationId);
    }
  }

  leaveConversation(conversationId: string) {
    if (this.socket?.connected) {
      this.socket.emit('leave_conversation', conversationId);
    }
  }

  sendTyping(conversationId: string, isTyping: boolean) {
    if (this.socket?.connected) {
      this.socket.emit(isTyping ? 'typing_start' : 'typing_stop', { conversationId });
    }
  }

  markRead(conversationId: string) {
    if (this.socket?.connected) {
      this.socket.emit('mark_as_read', { conversationId });
    }
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
