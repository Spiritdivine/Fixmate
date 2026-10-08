import { create } from 'zustand';

interface AiChatStoreState {
  isOpen: boolean;
  initialPrompt: string;
  initialAttachments: {
    photos?: File[];
    voice?: Blob | null;
  };
  openChat: (prompt?: string, attachments?: { photos?: File[]; voice?: Blob | null }) => void;
  closeChat: () => void;
  toggleChat: () => void;
}

export const useAiChatStore = create<AiChatStoreState>((set) => ({
  isOpen: false,
  initialPrompt: '',
  initialAttachments: {},
  openChat: (prompt = '', attachments = {}) =>
    set({
      isOpen: true,
      initialPrompt: prompt,
      initialAttachments: attachments,
    }),
  closeChat: () => set({ isOpen: false }),
  toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),
}));
