import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Send,
  Paperclip,
  Image,
  FileText,
  MoreVertical,
  BellOff,
  Bell,
  Trash2,
  Edit2,
  FileCheck,
  Briefcase,
  Check,
  CheckCheck,
  Search,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { useAuthStore } from '../../stores/authStore';
import { getSocket } from '../../lib/socket';
import { apiClient } from '../../lib/api-client';
import { formatDateTime, timeAgo } from '../../lib/formatters';
import { Conversation, Message } from '../../types';

export const ChatPage: React.FC = () => {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      setIsLoadingConversations(true);
      const { data } = await apiClient.get('/chat/conversations');
      setConversations(data.data || []);
      if (data.data && data.data.length > 0 && !activeConversation) {
        setActiveConversation(data.data[0]);
      }
    } catch (err) {
      console.error('Failed to load conversations', err);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const fetchMessages = async (convId: string) => {
    try {
      setIsLoadingMessages(true);
      const { data } = await apiClient.get(`/chat/conversations/${convId}/messages`);
      setMessages(data.data || []);
      scrollToBottom();
    } catch (err) {
      console.error('Failed to fetch messages', err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (!activeConversation) return;

    fetchMessages(activeConversation.id);

    const socket = getSocket();
    socket.emit('join_conversation', activeConversation.id);

    const handleNewMessage = (msg: Message) => {
      if (msg.conversationId === activeConversation.id) {
        setMessages((prev) => [...prev, msg]);
        scrollToBottom();
      }
    };

    const handleUserTyping = (data: { userId: string; conversationId: string }) => {
      if (data.conversationId === activeConversation.id && data.userId !== user?.id) {
        setIsOtherTyping(true);
      }
    };

    const handleUserStopTyping = (data: { userId: string; conversationId: string }) => {
      if (data.conversationId === activeConversation.id && data.userId !== user?.id) {
        setIsOtherTyping(false);
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_typing_stop', handleUserStopTyping);

    return () => {
      socket.emit('leave_conversation', activeConversation.id);
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_typing_stop', handleUserStopTyping);
    };
  }, [activeConversation?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeConversation) return;

    const body = messageInput.trim();
    setMessageInput('');

    const socket = getSocket();
    socket.emit('send_message', {
      conversationId: activeConversation.id,
      body,
      messageType: 'TEXT',
    });

    socket.emit('typing_stop', { conversationId: activeConversation.id });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    if (!activeConversation) return;

    const socket = getSocket();
    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing_start', { conversationId: activeConversation.id });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('typing_stop', { conversationId: activeConversation.id });
    }, 1500);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConversation) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'chat');

      const { data } = await apiClient.post('/upload/single', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const url = data.data.url;
      const isImg = file.type.startsWith('image/');

      const socket = getSocket();
      socket.emit('send_message', {
        conversationId: activeConversation.id,
        body: file.name,
        messageType: isImg ? 'IMAGE' : 'DOCUMENT',
        attachmentUrl: url,
      });
    } catch (err) {
      alert('File upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const getOtherParticipant = (conv: Conversation) => {
    const other = conv.participants?.find((p) => p.userId !== user?.id);
    return other?.user;
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row gap-4">
      {/* Left Sidebar: Conversations List */}
      <Card className="w-full md:w-80 flex flex-col p-0 overflow-hidden shrink-0">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Live Client Messages</h2>
          <p className="text-xs text-slate-400 mt-0.5">Real-time Socket.io channels</p>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
          {isLoadingConversations ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading chats...</div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No active conversations yet.</div>
          ) : (
            conversations.map((conv) => {
              const other = getOtherParticipant(conv);
              const isSelected = activeConversation?.id === conv.id;
              const name = other?.clientProfile
                ? `${other.clientProfile.firstName} ${other.clientProfile.lastName}`
                : other?.email || 'Client';

              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConversation(conv)}
                  className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-sky-50 dark:bg-sky-950/40 border-l-4 border-sky-500'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <Avatar src={other?.avatarUrl} name={name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {name}
                      </h4>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {timeAgo(conv.lastMessageAt)}
                      </span>
                    </div>

                    {conv.contract && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                        <FileCheck className="w-3 h-3" /> #{conv.contract.contractCode}
                      </span>
                    )}

                    {conv.job && !conv.contract && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-500 uppercase tracking-wider">
                        <Briefcase className="w-3 h-3" /> Job Inquiry
                      </span>
                    )}

                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {conv.messages?.[0]?.body || 'Start the conversation...'}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* Right Main Chat Window */}
      <Card className="flex-1 flex flex-col p-0 overflow-hidden">
        {activeConversation ? (
          <>
            {/* Chat Top Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <Avatar
                  src={getOtherParticipant(activeConversation)?.avatarUrl}
                  name={
                    getOtherParticipant(activeConversation)?.clientProfile?.firstName || 'Client'
                  }
                  size="md"
                />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {getOtherParticipant(activeConversation)?.clientProfile
                      ? `${getOtherParticipant(activeConversation)?.clientProfile?.firstName} ${
                          getOtherParticipant(activeConversation)?.clientProfile?.lastName
                        }`
                      : getOtherParticipant(activeConversation)?.email}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {activeConversation.contract
                      ? `Contract #${activeConversation.contract.contractCode} • ${activeConversation.contract.status}`
                      : 'Marketplace Direct Channel'}
                  </p>
                </div>
              </div>

              {activeConversation.contract && (
                <Link to={`/artisan/contracts/${activeConversation.contract.id}`}>
                  <Button variant="outline" size="sm">
                    View Contract
                  </Button>
                </Link>
              )}
            </div>

            {/* Messages Feed */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {isLoadingMessages ? (
                <div className="flex items-center justify-center p-8">
                  <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-xs text-slate-400 py-12">
                  No messages yet. Send a greeting or project update!
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId === user?.id;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-sm sm:max-w-md p-3.5 rounded-2xl text-xs space-y-1.5 shadow-xs ${
                          isMe
                            ? 'bg-sky-600 text-white rounded-br-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-xs'
                        }`}
                      >
                        {msg.messageType === 'IMAGE' && msg.attachmentUrl && (
                          <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer">
                            <img
                              src={msg.attachmentUrl}
                              alt="Attachment"
                              className="max-h-48 rounded-xl object-cover mb-1 border border-white/20"
                            />
                          </a>
                        )}

                        {msg.messageType === 'DOCUMENT' && msg.attachmentUrl && (
                          <a
                            href={msg.attachmentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 rounded-xl bg-black/10 hover:bg-black/20 transition-colors"
                          >
                            <FileText className="w-4 h-4" />
                            <span className="truncate font-semibold">{msg.body}</span>
                          </a>
                        )}

                        {msg.messageType === 'TEXT' && (
                          <p className="whitespace-pre-line">{msg.body}</p>
                        )}

                        <div
                          className={`text-[10px] flex items-center justify-end gap-1 ${
                            isMe ? 'text-sky-200' : 'text-slate-400'
                          }`}
                        >
                          <span>{timeAgo(msg.createdAt)}</span>
                          {isMe && <CheckCheck className="w-3 h-3" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {isOtherTyping && (
                <div className="flex items-center gap-2 text-xs text-slate-400 italic animate-pulse">
                  <span>Client is typing...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Box */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-white dark:bg-slate-900"
            >
              <label
                className="p-2.5 rounded-xl text-slate-400 hover:text-sky-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                title="Attach photo or document"
              >
                <Paperclip className="w-4 h-4" />
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>

              <Input
                placeholder="Type your message..."
                value={messageInput}
                onChange={handleInputChange}
                className="py-2"
              />

              <Button type="submit" size="sm" leftIcon={<Send className="w-4 h-4" />}>
                Send
              </Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
            Select a conversation from the left to start messaging.
          </div>
        )}
      </Card>
    </div>
  );
};
