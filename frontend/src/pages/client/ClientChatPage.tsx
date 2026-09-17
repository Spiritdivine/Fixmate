import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Send,
  Paperclip,
  Search,
  MessageSquare,
  FileCheck,
  Briefcase,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { useAuthStore } from '../../stores/authStore';
import { getSocket } from '../../lib/socket';
import { Conversation, Message, ApiResponse } from '../../types';
import { formatDate, formatCurrency } from '../../lib/formatters';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';

export const ClientChatPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeConversationId = searchParams.get('conversationId');
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Client's Conversations
  const { data: conversationsData = [], isLoading: loadingConversations } = useQuery<Conversation[]>({
    queryKey: ['client-conversations'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Conversation[] | { conversations: Conversation[] }>>(
        '/chat/conversations'
      );
      return (Array.isArray(data.data) ? data.data : (data.data as any)?.conversations) || [];
    },
    refetchInterval: 10000,
  });

  const conversations = conversationsData;
  const activeConversation = conversations.find((c) => c.id === activeConversationId) || conversations[0];

  // Auto-set first conversation in URL if none selected
  useEffect(() => {
    if (!activeConversationId && conversations.length > 0) {
      setSearchParams({ conversationId: conversations[0].id });
    }
  }, [activeConversationId, conversations, setSearchParams]);

  // 2. Fetch Messages for Active Conversation
  const { data: messagesData = [], isLoading: loadingMessages } = useQuery<Message[]>({
    queryKey: ['conversation-messages', activeConversation?.id],
    queryFn: async () => {
      if (!activeConversation?.id) return [];
      const { data } = await apiClient.get<ApiResponse<Message[] | { messages: Message[] }>>(
        `/chat/conversations/${activeConversation.id}/messages`
      );
      return (Array.isArray(data.data) ? data.data : (data.data as any)?.messages) || [];
    },
    enabled: !!activeConversation?.id,
  });

  // 3. Socket real-time listener for incoming messages
  useEffect(() => {
    const socket = getSocket();
    const handleNewMessage = (msg: Message) => {
      if (msg.conversationId === activeConversation?.id) {
        queryClient.setQueryData(
          ['conversation-messages', activeConversation.id],
          (old: Message[] | undefined) => [...(old || []), msg]
        );
      }
      queryClient.invalidateQueries({ queryKey: ['client-conversations'] });
    };

    socket.on('new_message', handleNewMessage);
    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [activeConversation?.id, queryClient]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesData]);

  // 4. Send Message Mutation
  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      if (!messageText.trim() || !activeConversation?.id) return;
      const body = messageText.trim();
      setMessageText('');
      const { data } = await apiClient.post<ApiResponse<Message | { message: Message }>>(
        `/chat/conversations/${activeConversation.id}/messages`,
        { body }
      );
      return (data.data as any)?.id ? (data.data as Message) : (data.data as any)?.message;
    },
    onSuccess: (newMsg) => {
      if (newMsg) {
        queryClient.setQueryData(
          ['conversation-messages', activeConversation?.id],
          (old: Message[] | undefined) => [...(old || []), newMsg]
        );
        queryClient.invalidateQueries({ queryKey: ['client-conversations'] });
      }
    },
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessageMutation.mutate();
    }
  };

  const filteredConversations = conversations.filter((c) => {
    const otherParticipant = c.participants.find((p) => p.userId !== user?.id)?.user;
    const name = otherParticipant?.artisanProfile?.businessName || otherParticipant?.email || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const otherParticipant = activeConversation?.participants.find((p) => p.userId !== user?.id)?.user;
  const otherName =
    otherParticipant?.artisanProfile?.businessName || otherParticipant?.email?.split('@')[0] || 'Artisan';

  return (
    <div className="space-y-6 pb-16 font-dashboard">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Messages &amp; Direct Chat
        </h1>
        <p className="text-sm text-slate-500">
          Real-time coordination, project clarifications, and file exchanges with artisans.
        </p>
      </div>

      {/* Main 2-Panel Chat Layout */}
      <div className="bg-white rounded-[24px] border border-slate-200/80 shadow-sm overflow-hidden h-[calc(100vh-230px)] min-h-[550px] flex flex-col md:flex-row">
        {/* Left Panel: Conversations List */}
        <div className="w-full md:w-80 border-r border-slate-200 flex flex-col bg-white">
          {/* Search bar */}
          <div className="p-3.5 border-b border-slate-100">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-9 pr-4 py-2 rounded-full bg-slate-50 border border-slate-200/80 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 outline-none transition-all"
              />
            </div>
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loadingConversations ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading chats...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No active conversations yet.
              </div>
            ) : (
              filteredConversations.map((c) => {
                const participant = c.participants.find((p) => p.userId !== user?.id)?.user;
                const name =
                  participant?.artisanProfile?.businessName || participant?.email?.split('@')[0] || 'Artisan';
                const isSelected = c.id === activeConversation?.id;

                return (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => setSearchParams({ conversationId: c.id })}
                    className={`w-full p-4 flex items-start gap-3.5 text-left transition-all ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-950 border-l-4 border-emerald-700'
                        : 'hover:bg-slate-50/80 text-slate-700'
                    }`}
                  >
                    <Avatar
                      src={participant?.avatarUrl}
                      name={name}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-xs font-bold truncate ${isSelected ? 'text-emerald-900' : 'text-slate-900'}`}>
                          {name}
                        </p>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {formatDate(c.lastMessageAt)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5 font-medium">
                        {c.job?.title ? `Job: ${c.job.title}` : c.contract?.contractCode ? `Contract: ${c.contract.contractCode}` : 'Direct chat'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel: Active Chat Thread */}
        <div className="flex-1 flex flex-col bg-slate-50/40 min-w-0">
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 px-6 border-b border-slate-200 bg-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={otherParticipant?.avatarUrl}
                    name={otherName}
                    size="sm"
                  />
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{otherName}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium">
                      {otherParticipant?.email}
                    </p>
                  </div>
                </div>

                {activeConversation.contract && (
                  <Link
                    to={`/client/contracts/${activeConversation.contract.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-700 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200 transition-all"
                  >
                    <span>Contract Workspace</span>
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                )}
              </div>

              {/* Message History */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
                {loadingMessages ? (
                  <div className="text-center text-xs text-slate-400 py-8">Loading history...</div>
                ) : (messagesData || []).length === 0 ? (
                  <div className="text-center py-16 space-y-2">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">
                      Say hello to {otherName}!
                    </p>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">
                      Discuss schedule, specific tool requirements, or site access.
                    </p>
                  </div>
                ) : (
                  messagesData?.map((msg) => {
                    const isMe = msg.senderId === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-md p-4 rounded-2xl text-xs leading-relaxed ${
                            isMe
                              ? 'bg-emerald-800 text-white rounded-br-none shadow-sm'
                              : 'bg-white border border-slate-200/80 text-slate-800 rounded-bl-none shadow-sm'
                          }`}
                        >
                          {msg.body}
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium mt-1 px-1">
                          {formatDate(msg.createdAt)}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Composer */}
              <div className="p-3.5 bg-white border-t border-slate-200 flex items-center gap-2.5">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message... (Press Enter to send)"
                  className="flex-1 px-4 py-2.5 rounded-full bg-slate-50 border border-slate-200/80 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 outline-none transition-all"
                />

                <button
                  type="button"
                  onClick={() => sendMessageMutation.mutate()}
                  disabled={!messageText.trim() || sendMessageMutation.isPending}
                  className="p-2.5 rounded-full bg-emerald-800 hover:bg-emerald-700 text-white shadow-md shadow-emerald-900/15 transition-all disabled:opacity-50"
                  title="Send Message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-center text-xs text-slate-400 font-medium">
              Select a conversation from the left to start messaging.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
