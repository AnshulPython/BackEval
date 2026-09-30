/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Square,
  Bot,
  User,
  Paperclip,
  RefreshCw,
  Copy,
  Check,
  Globe,
  Brain,
  Sliders,
  ChevronDown,
  ChevronUp,
  X,
  Volume2,
  VolumeX,
  ExternalLink,
  ShieldCheck,
  Menu,
  Sparkles,
  Key,
  Pause,
  Play,
  Mic,
  Settings2,
  AlertCircle,
  Zap,
  ArrowRight,
  Cpu,
  Download,
  FileText,
  FileJson,
  ImageIcon,
  Maximize2,
} from 'lucide-react';
import {
  AIModel,
  AIProviderId,
  ChatAttachment,
  ChatMessage,
  ChatSession,
  ModelCapabilitiesConfig,
  UserAccount,
  VoiceConfig,
} from '../types';
import { AI_PROVIDERS } from '../data/providersAndModels';
import { MarkdownRenderer } from './MarkdownRenderer';
import { CapabilitiesBar } from './CapabilitiesBar';
import { VoiceSelectorPopover } from './VoiceSelectorPopover';
import { ImageGenerationModal } from './ImageGenerationModal';
import {
  speakMessage,
  stopSpeaking,
  pauseSpeaking,
  resumeSpeaking,
  subscribeSpeechState,
  getStoredVoiceConfig,
  saveStoredVoiceConfig,
} from '../utils/speech';
import {
  exportChatMarkdown,
  exportChatJSON,
  exportChatText,
  copyChatToClipboard,
} from '../utils/exportChat';

interface ChatAreaProps {
  messages: ChatMessage[];
  currentSession?: ChatSession;
  isStreaming: boolean;
  onSendMessage: (content: string, attachments?: ChatAttachment[]) => void;
  onStopStreaming: () => void;
  onRegenerate: () => void;
  activeProvider: AIProviderId;
  activeModelId: string;
  capabilities: ModelCapabilitiesConfig;
  onChangeCapabilities: (newConfig: ModelCapabilitiesConfig) => void;
  onOpenProviderModal: () => void;
  onOpenModelModal: () => void;
  onOpenSettingsModal: () => void;
  onToggleSidebar: () => void;
  isKeyConnected: boolean;
  accountChecked?: boolean;
  totalAccountModels?: number;
  onRefreshAccountModels?: () => void;
  isRefreshingModels?: boolean;
  models?: AIModel[];
  onSelectModel?: (modelId: string) => void;
  onOpenSecretPromptModal: () => void;
  onOpenRagasModal: () => void;
  currentUser?: UserAccount | null;
  onOpenAccountModal?: () => void;
  onOpenGoogleSignIn?: () => void;
  onAddImageMessage?: (imageData: {
    url: string;
    prompt: string;
    aspectRatio: string;
    modelUsed: string;
  }) => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  currentSession,
  isStreaming,
  onSendMessage,
  onStopStreaming,
  onRegenerate,
  activeProvider,
  activeModelId,
  capabilities,
  onChangeCapabilities,
  onOpenProviderModal,
  onOpenModelModal,
  onOpenSettingsModal,
  onToggleSidebar,
  models = [],
  onSelectModel,
  onOpenSecretPromptModal,
  onOpenRagasModal,
  currentUser,
  onOpenAccountModal,
  onOpenGoogleSignIn,
  onAddImageMessage,
}) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Image Generation & Lightbox states
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imagePromptPrefill, setImagePromptPrefill] = useState('');
  const [lightboxImage, setLightboxImage] = useState<{ url: string; prompt: string } | null>(null);

  // Speech and Changeable Voice states
  const [activeSpeechMessageId, setActiveSpeechMessageId] = useState<string | null>(null);
  const [isSpeechPaused, setIsSpeechPaused] = useState<boolean>(false);
  const [isVoicePopoverOpen, setIsVoicePopoverOpen] = useState<boolean>(false);
  const [voiceConfig, setVoiceConfig] = useState<VoiceConfig>(() =>
    capabilities.voiceConfig || getStoredVoiceConfig()
  );

  const [expandedThinking, setExpandedThinking] = useState<Record<string, boolean>>({});
  const [showToolsBar, setShowToolsBar] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentProviderInfo =
    AI_PROVIDERS.find((p) => p.id === activeProvider) || AI_PROVIDERS[0];
  const isGoogleUser = currentUser?.authProvider === 'google';

  // Handle scroll to check if user has manually scrolled up
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 150;
  };

  // Subscribe to speech synthesis state updates
  useEffect(() => {
    const unsubscribe = subscribeSpeechState((msgId, isSpeaking, isPaused) => {
      setActiveSpeechMessageId(msgId);
      setIsSpeechPaused(isPaused);
    });
    return () => unsubscribe();
  }, []);

  // Optimized scrolling: avoid jerky smooth-scroll fighting during streaming
  useEffect(() => {
    if (isStreaming) {
      if (isNearBottomRef.current) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      }
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isStreaming]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        180
      )}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && attachments.length === 0) || isStreaming) return;
    const trimmed = input.trim();

    // Check if user entered an image generation command: /image or /imagine
    if (trimmed.startsWith('/image ') || trimmed.startsWith('/imagine ')) {
      const promptText = trimmed.replace(/^\/(image|imagine)\s+/, '');
      setImagePromptPrefill(promptText);
      setIsImageModalOpen(true);
      setInput('');
      return;
    }

    onSendMessage(trimmed, attachments);
    setInput('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Voice playback handler for a specific response message
  const handleToggleVoicePlayback = (messageId: string, content: string) => {
    if (activeSpeechMessageId === messageId) {
      if (isSpeechPaused) {
        resumeSpeaking();
      } else {
        stopSpeaking();
      }
    } else {
      speakMessage(content, {
        messageId,
        voiceConfig,
      });
    }
  };

  const handleVoiceConfigChange = (newConfig: VoiceConfig) => {
    setVoiceConfig(newConfig);
    saveStoredVoiceConfig(newConfig);
    onChangeCapabilities({
      ...capabilities,
      voiceConfig: newConfig,
    });
  };

  const toggleThinking = (id: string) => {
    setExpandedThinking((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      const isImage = file.type.startsWith('image/');
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setAttachments((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).substring(7),
            type: isImage ? ('image' as const) : ('text' as const),
            name: file.name,
            mimeType: file.type || 'application/octet-stream',
            dataUrl: isImage ? result : undefined,
            textPreview: !isImage ? result.slice(0, 500) : undefined,
            size: file.size,
          },
        ]);
      };
      if (isImage) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const starterPrompts = [
    {
      title: 'Analyze Code & Architecture',
      prompt: 'Review this architecture pattern and give me suggestions to optimize latency and modularity:',
    },
    {
      title: 'Explain Complex Topic',
      prompt: 'Explain how attention mechanisms in transformer models work with an intuitive analogy:',
    },
    {
      title: 'Draft Technical Documentation',
      prompt: 'Write clean, structured API documentation for a RESTful webhook endpoint:',
    },
    {
      title: 'Evaluate & Benchmark',
      prompt: 'Help me design a benchmark evaluation dataset to test factual faithfulness in LLM outputs:',
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#131314] overflow-hidden relative">
      {/* Top Header */}
      <header className="h-14 border-b border-[#2d2f31] bg-[#131314] px-4 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleSidebar}
            className="p-2 text-[#8e918f] hover:text-[#e3e3e3] rounded-full hover:bg-[#1e1f20] transition-colors"
            title="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          {/* Model Selector Dropdown */}
          <button
            onClick={onOpenModelModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-[#1e1f20] transition-colors text-sm font-medium text-[#e3e3e3]"
            title="Change model"
          >
            <span className="font-medium text-sm">{activeModelId}</span>
            <ChevronDown className="w-4 h-4 text-[#8e918f]" />
          </button>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-1.5">
          {/* Voice Settings Button in Header */}
          <button
            onClick={() => setIsVoicePopoverOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1e1f20] hover:bg-[#282a2c] text-xs text-[#8ab4f8] transition-colors border border-[#2d2f31]"
            title="Change response voice, speech rate, and pitch"
          >
            <Mic className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-medium">
              Voice: {voiceConfig.voiceName ? voiceConfig.voiceName.split(' ')[0] : 'Auto'}
            </span>
          </button>

          {/* Provider / Key Button */}
          <button
            onClick={onOpenProviderModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-[#1e1f20] text-xs text-[#c4c7c5] hover:text-white transition-colors"
            title="Configure API key"
          >
            <Key className="w-3.5 h-3.5 text-[#8e918f]" />
            <span className="hidden sm:inline">{currentProviderInfo.name}</span>
          </button>

          {/* Export Chat Button */}
          {currentSession && currentSession.messages.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                className={`p-2 rounded-full transition-colors ${
                  isExportMenuOpen
                    ? 'text-[#8ab4f8] bg-[#1e1f20]'
                    : 'text-[#8e918f] hover:text-[#e3e3e3] hover:bg-[#1e1f20]'
                }`}
                title="Export this conversation"
              >
                <Download className="w-4 h-4" />
              </button>

              {isExportMenuOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-full mt-1.5 w-52 bg-[#1e1f20] border border-[#2d2f31] rounded-2xl shadow-2xl p-1.5 z-50 text-xs text-[#c4c7c5] animate-in fade-in"
                >
                  <div className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-[#8e918f]">
                    Export Active Chat
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      exportChatMarkdown(currentSession);
                      setExportNotice('Exported as Markdown (.md)');
                      setTimeout(() => setExportNotice(null), 2500);
                    }}
                    className="w-full px-3 py-2 text-left rounded-xl flex items-center gap-2 hover:bg-[#282a2c] hover:text-white transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#8ab4f8]" />
                    <span>Markdown (.md)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      exportChatJSON(currentSession);
                      setExportNotice('Exported as JSON (.json)');
                      setTimeout(() => setExportNotice(null), 2500);
                    }}
                    className="w-full px-3 py-2 text-left rounded-xl flex items-center gap-2 hover:bg-[#282a2c] hover:text-white transition-colors cursor-pointer"
                  >
                    <FileJson className="w-3.5 h-3.5 text-[#81c995]" />
                    <span>JSON (.json)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      exportChatText(currentSession);
                      setExportNotice('Exported as Text (.txt)');
                      setTimeout(() => setExportNotice(null), 2500);
                    }}
                    className="w-full px-3 py-2 text-left rounded-xl flex items-center gap-2 hover:bg-[#282a2c] hover:text-white transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#c4c7c5]" />
                    <span>Plain Text (.txt)</span>
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setIsExportMenuOpen(false);
                      const ok = await copyChatToClipboard(currentSession);
                      setExportNotice(ok ? 'Copied chat to clipboard!' : 'Failed to copy');
                      setTimeout(() => setExportNotice(null), 2500);
                    }}
                    className="w-full px-3 py-2 text-left rounded-xl flex items-center gap-2 hover:bg-[#282a2c] hover:text-white transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5 text-[#8ab4f8]" />
                    <span>Copy to clipboard</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Ragas Quality & Evals */}
          <button
            onClick={onOpenRagasModal}
            className="p-2 text-[#8e918f] hover:text-[#e3e3e3] rounded-full hover:bg-[#1e1f20] transition-colors"
            title="Ragas quality evaluation & benchmarking"
          >
            <ShieldCheck className="w-4 h-4" />
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettingsModal}
            className="p-2 text-[#8e918f] hover:text-[#e3e3e3] rounded-full hover:bg-[#1e1f20] transition-colors"
            title="Settings & capabilities"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* GOOGLE SIGN IN / ACCOUNT BUTTON */}
          {currentUser ? (
            <button
              onClick={onOpenAccountModal}
              className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-full hover:bg-[#1e1f20] text-xs text-[#c4c7c5] hover:text-white transition-colors border border-[#2d2f31] ml-1"
              title={`Account & Keys (${currentUser.email})`}
            >
              <div className="relative">
                <div className="w-6 h-6 rounded-full bg-[#282a2c] border border-[#3c4043] flex items-center justify-center text-[#8ab4f8] font-semibold text-[10px]">
                  {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
                {isGoogleUser && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-white flex items-center justify-center p-0.5 shadow">
                    <svg className="w-2 h-2" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  </div>
                )}
              </div>
              <span className="hidden md:inline font-medium text-xs max-w-[120px] truncate text-[#e3e3e3]">
                {currentUser.displayName}
              </span>
            </button>
          ) : (
            <button
              onClick={onOpenGoogleSignIn}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-[#f1f3f4] text-[#1f1f1f] text-xs font-medium transition-colors shadow-xs"
            >
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Google Sign In</span>
            </button>
          )}
        </div>
      </header>

      {/* Export Feedback Toast */}
      {exportNotice && (
        <div className="bg-[#282a2c] text-[#8ab4f8] text-xs px-4 py-2 border-b border-[#3c4043] flex items-center justify-between animate-in fade-in">
          <span>{exportNotice}</span>
          <button onClick={() => setExportNotice(null)} className="text-[#8e918f] hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Message Stream */}
      <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {/* Welcome Empty State */}
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto py-12 px-4 text-center">
            <h2 className="text-3xl sm:text-4xl font-normal text-[#c4c7c5] tracking-tight mb-1">
              <span className="text-[#8ab4f8] font-medium">Hello</span>
            </h2>
            <h3 className="text-3xl sm:text-4xl font-normal text-[#e3e3e3] tracking-tight mb-8">
              How can I help you today?
            </h3>
            {/* Suggestions 2x2 Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
              {starterPrompts.map((sp, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInput(sp.prompt);
                    textareaRef.current?.focus();
                  }}
                  className="p-4 rounded-2xl bg-[#1e1f20] hover:bg-[#282a2c] border border-[#2d2f31] hover:border-[#37393b] text-left transition-colors group flex flex-col justify-between cursor-pointer"
                >
                  <div className="text-sm font-medium text-[#e3e3e3] mb-1">
                    {sp.title}
                  </div>
                  <p className="text-xs text-[#8e918f] line-clamp-2 leading-relaxed">
                    {sp.prompt}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages List */}
        {messages.map((message) => {
          const isUser = message.role === 'user';
          const isAssistant = message.role === 'assistant';
          const hasThinking = Boolean(message.thinking && message.thinking.trim());
          const isThinkingOpen = expandedThinking[message.id] ?? false;

          const isThisSpeaking = activeSpeechMessageId === message.id;

          return (
            <div
              key={message.id}
              className={`flex gap-3 max-w-3xl mx-auto group ${
                isUser ? 'justify-end' : 'justify-start'
              }`}
            >
              {/* Assistant Avatar */}
              {isAssistant && (
                <div className="w-8 h-8 rounded-full bg-[#1e1f20] border border-[#2d2f31] flex items-center justify-center text-[#8ab4f8] shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
              )}

              {/* Message Content Container */}
              <div
                className={`flex flex-col space-y-2 max-w-[88%] w-full ${
                  isUser ? 'items-end' : 'items-start'
                }`}
              >
                {/* User Attachments Preview */}
                {message.attachments && message.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-1">
                    {message.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="rounded-xl border border-[#2d2f31] overflow-hidden bg-[#1e1f20] max-w-[200px]"
                      >
                        {att.type === 'image' && att.dataUrl ? (
                          <img
                            src={att.dataUrl}
                            alt={att.name}
                            className="max-h-36 w-auto object-cover"
                          />
                        ) : (
                          <div className="p-2 text-xs text-[#c4c7c5] font-mono truncate">
                            {att.name}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* ======================================================== */}
                {/* VOICE BUTTON AT THE TOP OF EACH RESPONSE WITH CHANGEABLE VOICE */}
                {/* ======================================================== */}
                {isAssistant && !message.isStreaming && message.content && (
                  <div className="w-full flex items-center justify-between px-3 py-1.5 mb-1 rounded-xl bg-[#1e1f20] border border-[#2d2f31] text-xs">
                    {/* Left: Model Name & Audio Status */}
                    <div className="flex items-center gap-2 text-[#8e918f]">
                      <span className="font-medium text-[#c4c7c5] text-[11px]">
                        {message.modelUsed || activeModelId}
                      </span>
                      {isThisSpeaking && (
                        <div className="flex items-center gap-1.5 text-[#8ab4f8] font-medium text-[11px] animate-pulse">
                          {/* Animated sound wave bars */}
                          <span className="flex items-center gap-0.5 h-3">
                            <span className="w-0.5 h-2 bg-[#8ab4f8] rounded-full animate-bounce" />
                            <span className="w-0.5 h-3 bg-[#8ab4f8] rounded-full animate-bounce [animation-delay:0.15s]" />
                            <span className="w-0.5 h-1.5 bg-[#8ab4f8] rounded-full animate-bounce [animation-delay:0.3s]" />
                          </span>
                          <span>Playing audio...</span>
                        </div>
                      )}
                    </div>

                    {/* Right: The Voice Control Button + Changeable Voice Button */}
                    <div className="flex items-center gap-1.5">
                      {/* Primary Voice Action Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleVoicePlayback(message.id, message.content)}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-medium text-xs transition-all shadow-xs cursor-pointer ${
                          isThisSpeaking
                            ? 'bg-[#f28b82] hover:bg-[#e06666] text-[#131314]'
                            : 'bg-[#282a2c] hover:bg-[#333538] text-[#8ab4f8] hover:text-[#a8c7fa] border border-[#3c4043]'
                        }`}
                        title={
                          isThisSpeaking
                            ? 'Stop voice playback'
                            : `Read response aloud using ${voiceConfig.voiceName || 'chosen voice'}`
                        }
                      >
                        {isThisSpeaking ? (
                          <>
                            <Square className="w-3.5 h-3.5 fill-current" />
                            <span>Stop</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>Listen</span>
                          </>
                        )}
                      </button>

                      {/* Changeable Voice Selector Button */}
                      <button
                        type="button"
                        onClick={() => setIsVoicePopoverOpen(true)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#131314] hover:bg-[#282a2c] text-[11px] text-[#c4c7c5] hover:text-white border border-[#2d2f31] transition-colors cursor-pointer"
                        title="Change voice, speed, or pitch"
                      >
                        <Mic className="w-3 h-3 text-[#8ab4f8]" />
                        <span className="max-w-[110px] truncate font-medium">
                          {voiceConfig.voiceName ? voiceConfig.voiceName.split(' ')[0] : 'Voice'}
                        </span>
                        <ChevronDown className="w-3 h-3 text-[#8e918f]" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Reasoning / Thinking Disclosure */}
                {isAssistant && hasThinking && (
                  <div className="w-full rounded-xl bg-[#1e1f20] border border-[#2d2f31] overflow-hidden">
                    <button
                      onClick={() => toggleThinking(message.id)}
                      className="w-full px-3 py-2 flex items-center justify-between text-xs text-[#8e918f] hover:text-[#c4c7c5] transition-colors"
                    >
                      <span className="flex items-center gap-1.5 font-medium">
                        <Brain className="w-3.5 h-3.5 text-[#8ab4f8]" />
                        Thought process
                      </span>
                      {isThinkingOpen ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                    {isThinkingOpen && (
                      <div className="px-3.5 pb-3 text-xs text-[#8e918f] font-mono whitespace-pre-wrap leading-relaxed border-t border-[#2d2f31] pt-2">
                        {message.thinking}
                      </div>
                    )}
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`text-left leading-relaxed ${
                    isUser
                      ? 'bg-[#282a2c] text-[#e3e3e3] rounded-[22px] px-5 py-3 text-[14.5px]'
                      : 'w-full text-[#e3e3e3] text-[15px]'
                  }`}
                >
                  {isUser ? (
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  ) : (
                    <div>
                      {message.error ? (
                        message.isRateLimit ||
                        message.error.includes('429') ||
                        message.error.includes('quota') ||
                        message.error.includes('RESOURCE_EXHAUSTED') ? (
                          <div className="rounded-2xl bg-[#1e1f20] border border-[#f28b82]/40 p-4 space-y-3.5 text-left text-xs shadow-lg">
                            <div className="flex items-start gap-3">
                              <div className="p-2 rounded-xl bg-[#f28b82]/10 text-[#f28b82] shrink-0 mt-0.5">
                                <AlertCircle className="w-5 h-5" />
                              </div>
                              <div className="flex-1">
                                <div className="font-semibold text-sm text-[#f28b82] flex items-center gap-2">
                                  <span>Google Gemini Free Quota Exceeded (429)</span>
                                </div>
                                <p className="text-xs text-[#c4c7c5] mt-1 leading-relaxed">
                                  The shared Gemini environment API key has temporarily exceeded Google's requests limit for this model. Choose any quick option below to continue chatting immediately:
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-[#2d2f31]">
                              <button
                                type="button"
                                onClick={() => {
                                  onSelectModel?.('gemini-3.1-flash-lite');
                                  setTimeout(() => onRegenerate(), 100);
                                }}
                                className="p-3 rounded-xl bg-[#282a2c] hover:bg-[#333538] border border-[#444746] text-left transition-colors flex items-center justify-between group cursor-pointer"
                              >
                                <div>
                                  <div className="font-medium text-xs text-[#8ab4f8] flex items-center gap-1.5">
                                    <Zap className="w-3.5 h-3.5" />
                                    <span>Switch to Flash Lite & Retry</span>
                                  </div>
                                  <div className="text-[11px] text-[#8e918f] mt-0.5">
                                    Has separate high-limit quota pool
                                  </div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-[#8ab4f8] opacity-70 group-hover:translate-x-0.5 transition-transform shrink-0" />
                              </button>

                              <button
                                type="button"
                                onClick={onOpenProviderModal}
                                className="p-3 rounded-xl bg-[#282a2c] hover:bg-[#333538] border border-[#444746] text-left transition-colors flex items-center justify-between group cursor-pointer"
                              >
                                <div>
                                  <div className="font-medium text-xs text-[#81c995] flex items-center gap-1.5">
                                    <Key className="w-3.5 h-3.5" />
                                    <span>Enter Personal API Key</span>
                                  </div>
                                  <div className="text-[11px] text-[#8e918f] mt-0.5">
                                    Add your own free key (instant fix)
                                  </div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-[#81c995] opacity-70 group-hover:translate-x-0.5 transition-transform shrink-0" />
                              </button>

                              <button
                                type="button"
                                onClick={onOpenProviderModal}
                                className="p-3 rounded-xl bg-[#282a2c] hover:bg-[#333538] border border-[#444746] text-left transition-colors flex items-center justify-between group cursor-pointer"
                              >
                                <div>
                                  <div className="font-medium text-xs text-[#c4c7c5] flex items-center gap-1.5">
                                    <Cpu className="w-3.5 h-3.5 text-[#f28b82]" />
                                    <span>Switch Provider</span>
                                  </div>
                                  <div className="text-[11px] text-[#8e918f] mt-0.5">
                                    Try Groq, Anthropic Claude, or OpenAI
                                  </div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-[#c4c7c5] opacity-70 group-hover:translate-x-0.5 transition-transform shrink-0" />
                              </button>

                              <button
                                type="button"
                                onClick={onRegenerate}
                                className="p-3 rounded-xl bg-[#282a2c] hover:bg-[#333538] border border-[#444746] text-left transition-colors flex items-center justify-between group cursor-pointer"
                              >
                                <div>
                                  <div className="font-medium text-xs text-white flex items-center gap-1.5">
                                    <RefreshCw className="w-3.5 h-3.5 text-[#8ab4f8]" />
                                    <span>Retry Prompt</span>
                                  </div>
                                  <div className="text-[11px] text-[#8e918f] mt-0.5">
                                    Attempt request again
                                  </div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-white opacity-70 group-hover:translate-x-0.5 transition-transform shrink-0" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-[#f28b82] text-xs p-3 rounded-xl bg-[#1e1f20] border border-[#f28b82]/30">
                            {message.error}
                          </div>
                        )
                      ) : (
                        <div>
                          {message.content && <MarkdownRenderer content={message.content} />}

                          {/* Render AI Generated Image Card */}
                          {message.generatedImage && (
                            <div className="mt-3 rounded-2xl bg-[#1e1f20] border border-[#2d2f31] p-3 max-w-lg space-y-2.5 overflow-hidden">
                              <div
                                onClick={() =>
                                  setLightboxImage({
                                    url: message.generatedImage!.url,
                                    prompt: message.generatedImage!.prompt,
                                  })
                                }
                                className="relative group rounded-xl overflow-hidden cursor-zoom-in bg-black flex items-center justify-center max-h-96"
                              >
                                <img
                                  src={message.generatedImage.url}
                                  alt={message.generatedImage.prompt}
                                  className="w-full h-auto object-contain rounded-xl transition-transform duration-200 group-hover:scale-[1.01]"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs gap-1.5 font-medium">
                                  <Maximize2 className="w-4 h-4" />
                                  <span>Click to view full size</span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-xs pt-1">
                                <div className="flex items-center gap-1.5 text-[11px] text-[#8e918f]">
                                  <span className="px-2 py-0.5 rounded-full bg-[#c58af9]/15 text-[#c58af9] border border-[#c58af9]/30 font-medium">
                                    {message.generatedImage.aspectRatio || '1:1'}
                                  </span>
                                  <span className="font-mono text-[#c4c7c5] truncate max-w-[160px]">
                                    {message.generatedImage.modelUsed || 'Gemini Image'}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(message.generatedImage!.prompt);
                                      setCopiedId(message.id);
                                      setTimeout(() => setCopiedId(null), 2000);
                                    }}
                                    className="p-1.5 rounded-lg bg-[#282a2c] hover:bg-[#333538] text-[#c4c7c5] hover:text-white transition-colors cursor-pointer"
                                    title="Copy image prompt"
                                  >
                                    {copiedId === message.id ? (
                                      <Check className="w-3.5 h-3.5 text-[#81c995]" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      const a = document.createElement('a');
                                      a.href = message.generatedImage!.url;
                                      a.download = `gemini_image_${Date.now()}.png`;
                                      document.body.appendChild(a);
                                      a.click();
                                      document.body.removeChild(a);
                                    }}
                                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#282a2c] hover:bg-[#333538] text-xs font-medium text-[#8ab4f8] transition-colors cursor-pointer"
                                    title="Download generated image"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>Save</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {message.isStreaming && (
                        <span className="inline-block w-1.5 h-4 ml-1 bg-[#8ab4f8] animate-pulse align-middle" />
                      )}
                    </div>
                  )}

                  {/* Sources Grounding */}
                  {isAssistant && message.sources && message.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#2d2f31] space-y-1.5">
                      <div className="text-[11px] font-medium text-[#8e918f] flex items-center gap-1">
                        <Globe className="w-3 h-3 text-[#8ab4f8]" />
                        Sources:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {message.sources.map((src, i) => (
                          <a
                            key={i}
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#1e1f20] border border-[#2d2f31] hover:bg-[#282a2c] text-[11px] text-[#8ab4f8] transition-colors"
                          >
                            <span>{src.title || new URL(src.url).hostname}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Assistant Evaluation Result Pill */}
                {isAssistant && message.evaluation && (
                  <div
                    onClick={onOpenRagasModal}
                    className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#1e1f20] hover:bg-[#282a2c] border border-[#2d2f31] cursor-pointer transition-colors text-xs text-[#8e918f]"
                    title="Click to view full Ragas evaluation report"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-[#8ab4f8]" />
                    <span className="text-[#e3e3e3] font-medium">
                      Quality: {message.evaluation.overallScore}%
                    </span>
                    <span>•</span>
                    <span>Faithfulness: {Math.round(message.evaluation.scores.faithfulness * 100)}%</span>
                    <span>•</span>
                    <span>Relevancy: {Math.round(message.evaluation.scores.answerRelevancy * 100)}%</span>
                  </div>
                )}

                {/* Assistant Footer Actions */}
                {isAssistant && !message.isStreaming && (
                  <div className="flex items-center gap-1 text-xs text-[#8e918f] pt-1">
                    <button
                      onClick={() => handleCopyMessage(message.id, message.content)}
                      className="p-1.5 text-[#8e918f] hover:text-[#e3e3e3] rounded-full hover:bg-[#1e1f20] transition-colors"
                      title="Copy"
                    >
                      {copiedId === message.id ? (
                        <Check className="w-3.5 h-3.5 text-[#81c995]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleToggleVoicePlayback(message.id, message.content)}
                      className={`p-1.5 rounded-full hover:bg-[#1e1f20] transition-colors ${
                        isThisSpeaking ? 'text-[#f28b82]' : 'text-[#8e918f] hover:text-[#e3e3e3]'
                      }`}
                      title={isThisSpeaking ? 'Stop voice' : 'Listen with changeable voice'}
                    >
                      {isThisSpeaking ? (
                        <VolumeX className="w-3.5 h-3.5" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={onRegenerate}
                      className="p-1.5 text-[#8e918f] hover:text-[#e3e3e3] rounded-full hover:bg-[#1e1f20] transition-colors"
                      title="Retry"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={onOpenRagasModal}
                      className="p-1.5 text-[#8e918f] hover:text-[#e3e3e3] rounded-full hover:bg-[#1e1f20] transition-colors"
                      title="Evaluate with RAGAS"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Gemini Input Container */}
      <footer className="p-3 sm:pb-5 bg-gradient-to-t from-[#131314] via-[#131314] to-transparent">
        <div className="max-w-3xl mx-auto space-y-2">
          {showToolsBar && (
            <div className="p-2 rounded-2xl bg-[#1e1f20] border border-[#2d2f31] mb-2">
              <CapabilitiesBar
                config={capabilities}
                onChangeConfig={onChangeCapabilities}
                onOpenSettings={onOpenSettingsModal}
                activeModelId={activeModelId}
                models={models}
                onSelectModel={() => {}}
                onOpenModelModal={onOpenModelModal}
                onOpenSecretPromptModal={onOpenSecretPromptModal}
                onOpenRagasModal={onOpenRagasModal}
                onOpenVoiceModal={() => setIsVoicePopoverOpen(true)}
              />
            </div>
          )}

          {/* Pending Attachments */}
          {attachments.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="relative group rounded-xl border border-[#2d2f31] overflow-hidden bg-[#1e1f20] shrink-0"
                >
                  {att.type === 'image' && att.dataUrl ? (
                    <img
                      src={att.dataUrl}
                      alt={att.name}
                      className="h-14 w-14 object-cover"
                    />
                  ) : (
                    <div className="h-14 w-20 p-2 text-[10px] text-[#c4c7c5] font-mono truncate flex items-center justify-center">
                      {att.name}
                    </div>
                  )}
                  <button
                    onClick={() =>
                      setAttachments((prev) => prev.filter((a) => a.id !== att.id))
                    }
                    className="absolute top-1 right-1 p-0.5 rounded-full bg-black/70 text-[#c4c7c5] hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* The Iconic Gemini Prompt Box */}
          <form
            onSubmit={handleSubmit}
            className="relative flex flex-col bg-[#1e1f20] border border-[#2d2f31] rounded-[28px] p-3 shadow-lg focus-within:border-[#444746] focus-within:bg-[#202124] transition-all"
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything, formulate prompts, or benchmark models..."
              className="w-full bg-transparent text-sm text-[#e3e3e3] placeholder-[#8e918f] focus:outline-none resize-none py-1.5 px-2 max-h-[180px] leading-relaxed"
            />

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  multiple
                  accept="image/*,text/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-[#8e918f] hover:text-[#e3e3e3] rounded-full hover:bg-[#282a2c] transition-colors"
                  title="Add attachment"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsImageModalOpen(true)}
                  className="p-2 text-[#8e918f] hover:text-[#c58af9] rounded-full hover:bg-[#282a2c] transition-colors cursor-pointer"
                  title="Generate Image with AI (/image prompt)"
                >
                  <ImageIcon className="w-4 h-4 text-[#c58af9]" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onChangeCapabilities({
                      ...capabilities,
                      webSearch: !capabilities.webSearch,
                    })
                  }
                  className={`p-2 rounded-full transition-colors ${
                    capabilities.webSearch
                      ? 'text-[#8ab4f8] bg-[#282a2c]'
                      : 'text-[#8e918f] hover:text-[#e3e3e3] hover:bg-[#282a2c]'
                  }`}
                  title={`Web Search: ${capabilities.webSearch ? 'ON' : 'OFF'}`}
                >
                  <Globe className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onChangeCapabilities({
                      ...capabilities,
                      reasoning: !capabilities.reasoning,
                    })
                  }
                  className={`p-2 rounded-full transition-colors ${
                    capabilities.reasoning
                      ? 'text-[#8ab4f8] bg-[#282a2c]'
                      : 'text-[#8e918f] hover:text-[#e3e3e3] hover:bg-[#282a2c]'
                  }`}
                  title={`Thinking: ${capabilities.reasoning ? 'ON' : 'OFF'}`}
                >
                  <Brain className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsVoicePopoverOpen(true)}
                  className="p-2 rounded-full text-[#8e918f] hover:text-[#8ab4f8] hover:bg-[#282a2c] transition-colors"
                  title="Change voice settings"
                >
                  <Mic className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowToolsBar(!showToolsBar)}
                  className={`p-2 rounded-full transition-colors ${
                    showToolsBar
                      ? 'text-[#8ab4f8] bg-[#282a2c]'
                      : 'text-[#8e918f] hover:text-[#e3e3e3] hover:bg-[#282a2c]'
                  }`}
                  title="More tools"
                >
                  <Sliders className="w-4 h-4" />
                </button>
              </div>

              {isStreaming ? (
                <button
                  type="button"
                  onClick={onStopStreaming}
                  className="w-9 h-9 rounded-full bg-[#e3e3e3] text-[#131314] flex items-center justify-center transition-colors shadow hover:bg-white"
                  title="Stop"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim() && attachments.length === 0}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    input.trim() || attachments.length > 0
                      ? 'bg-[#e3e3e3] text-[#131314] hover:bg-white cursor-pointer shadow-sm'
                      : 'bg-[#282a2c] text-[#8e918f] opacity-40 cursor-not-allowed'
                  }`}
                  title="Send"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>

          <div className="text-center text-[11px] text-[#8e918f] pt-1">
            LLM Orchestration & RAGAS Benchmarking Engine may display inaccurate info, so double-check its responses.
          </div>
        </div>
      </footer>

      {/* Voice Selector Popover */}
      <VoiceSelectorPopover
        isOpen={isVoicePopoverOpen}
        onClose={() => setIsVoicePopoverOpen(false)}
        currentVoiceConfig={voiceConfig}
        onVoiceChange={handleVoiceConfigChange}
      />

      {/* AI Image Generation Modal */}
      <ImageGenerationModal
        isOpen={isImageModalOpen}
        onClose={() => {
          setIsImageModalOpen(false);
          setImagePromptPrefill('');
        }}
        defaultPrompt={imagePromptPrefill}
        activeProvider={activeProvider}
        onImageGenerated={(imageData) => {
          onAddImageMessage?.(imageData);
        }}
      />

      {/* Lightbox Fullscreen Modal */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in cursor-zoom-out"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[88vh] flex flex-col items-center"
          >
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={lightboxImage.url}
              alt={lightboxImage.prompt}
              className="max-h-[80vh] w-auto object-contain rounded-2xl shadow-2xl"
            />
            <div className="mt-3 flex items-center justify-between w-full text-xs text-white/80 px-2 gap-4">
              <span className="truncate max-w-md">{lightboxImage.prompt}</span>
              <button
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = lightboxImage.url;
                  a.download = `gemini_image_${Date.now()}.png`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 text-white font-medium transition-colors cursor-pointer shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save Artwork</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
