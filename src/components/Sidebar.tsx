/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  MessageSquare,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  Key,
  Sliders,
  ShieldCheck,
  Sparkles,
  Volume2,
  Download,
  MoreVertical,
  Copy,
  FileText,
  FileJson,
  AlertTriangle,
  PanelLeftClose,
  Sun,
  Moon,
} from 'lucide-react';
import { ChatSession, AIProviderId, UserAccount, ThemeMode } from '../types';
import { AI_PROVIDERS } from '../data/providersAndModels';
import {
  exportChatMarkdown,
  exportChatJSON,
  exportChatText,
  copyChatToClipboard,
} from '../utils/exportChat';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onOpenProviderModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenRagasModal?: () => void;
  onOpenVoiceModal?: () => void;
  activeProvider: AIProviderId;
  activeModelId: string;
  isOpen: boolean;
  onToggleOpen: () => void;
  theme?: ThemeMode;
  actualTheme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onRenameSession,
  onOpenProviderModal,
  onOpenSettingsModal,
  onOpenRagasModal,
  onOpenVoiceModal,
  activeProvider,
  activeModelId,
  isOpen,
  onToggleOpen,
  theme = 'dark',
  actualTheme = 'dark',
  onToggleTheme,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [openMenuSessionId, setOpenMenuSessionId] = useState<string | null>(null);
  const [openExportSessionId, setOpenExportSessionId] = useState<string | null>(null);
  const [confirmDeleteSessionId, setConfirmDeleteSessionId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const chatsListRef = useRef<HTMLDivElement>(null);
  const savedScrollTopRef = useRef<number | null>(null);

  const currentProviderInfo =
    AI_PROVIDERS.find((p) => p.id === activeProvider) || AI_PROVIDERS[0];

  // Preserve scroll position when sessions change (especially on deletion)
  useEffect(() => {
    if (savedScrollTopRef.current !== null && chatsListRef.current) {
      chatsListRef.current.scrollTop = savedScrollTopRef.current;
      savedScrollTopRef.current = null;
    }
  }, [sessions]);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuSessionId(null);
        setOpenExportSessionId(null);
        setConfirmDeleteSessionId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleStartRename = (session: ChatSession, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setOpenMenuSessionId(null);
    setOpenExportSessionId(null);
    setConfirmDeleteSessionId(null);
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const handleSaveRename = (id: string, e: React.MouseEvent | React.FormEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
      showToast('Chat renamed');
    }
    setEditingId(null);
  };

  const handlePromptDelete = (sessionId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setOpenMenuSessionId(null);
    setOpenExportSessionId(null);
    setConfirmDeleteSessionId(sessionId);
  };

  const handleConfirmDelete = (sessionId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    // Blur any active element so the browser doesn't scroll to the bottom of the container
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    const currentScroll = chatsListRef.current ? chatsListRef.current.scrollTop : 0;
    savedScrollTopRef.current = currentScroll;
    setConfirmDeleteSessionId(null);
    setOpenMenuSessionId(null);
    setOpenExportSessionId(null);

    onDeleteSession(sessionId);
    showToast('Chat deleted');

    // Force restore scroll on subsequent animation frames to resist browser auto-scrolling
    requestAnimationFrame(() => {
      if (chatsListRef.current) {
        chatsListRef.current.scrollTop = currentScroll;
      }
    });
    setTimeout(() => {
      if (chatsListRef.current) {
        chatsListRef.current.scrollTop = currentScroll;
      }
    }, 50);
  };

  const handleExportMarkdown = (session: ChatSession, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setOpenMenuSessionId(null);
    setOpenExportSessionId(null);
    exportChatMarkdown(session);
    showToast('Exported as Markdown (.md)');
  };

  const handleExportJSON = (session: ChatSession, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setOpenMenuSessionId(null);
    setOpenExportSessionId(null);
    exportChatJSON(session);
    showToast('Exported as JSON (.json)');
  };

  const handleExportText = (session: ChatSession, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setOpenMenuSessionId(null);
    setOpenExportSessionId(null);
    exportChatText(session);
    showToast('Exported as Text (.txt)');
  };

  const handleCopyChat = async (session: ChatSession, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setOpenMenuSessionId(null);
    setOpenExportSessionId(null);
    const ok = await copyChatToClipboard(session);
    if (ok) {
      showToast('Chat copied to clipboard!');
    } else {
      showToast('Failed to copy chat');
    }
  };

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-200"
          onClick={onToggleOpen}
          aria-hidden="true"
        />
      )}
      <aside
        className={`h-full min-h-0 bg-[#1e1f20] border-r border-[#2d2f31] flex flex-col transition-all duration-200 shrink-0 select-none overflow-hidden ${
          isOpen
            ? 'fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] shadow-2xl md:relative md:w-64 md:z-10 md:shadow-none'
            : 'w-0 border-r-0 pointer-events-none md:pointer-events-auto'
        }`}
      >
        {/* Header / Brand */}
        <div className="p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#282a2c] flex items-center justify-center text-[#c4c7c5] shrink-0">
              <Sparkles className="w-4 h-4 text-[#8ab4f8]" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xs font-semibold text-[#e3e3e3] tracking-tight leading-tight truncate" title="Multi-Provider LLM Orchestration & RAGAS Benchmarking Engine">
                LLM Orchestration & RAGAS
              </h1>
              <div className="text-[10px] text-[#8e918f] font-mono truncate">
                Benchmarking Engine
              </div>
            </div>
          </div>
          <button
            onClick={onToggleOpen}
            className="p-1.5 text-[#8e918f] hover:text-[#e3e3e3] rounded-lg hover:bg-[#282a2c] transition-colors"
            title="Collapse sidebar (Ctrl+B)"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* Floating Toast Alert */}
        {toastMessage && (
          <div className="absolute top-16 left-3 right-3 z-40 px-3 py-1.5 rounded-lg bg-[#282a2c] border border-[#3c4043] text-[#8ab4f8] text-[11px] font-medium shadow-2xl flex items-center justify-between animate-in fade-in">
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="text-[#8e918f] hover:text-white">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* New Chat Button */}
        <div className="px-3 pb-2.5 shrink-0">
          <button
            onClick={() => {
              onNewChat();
              if (typeof window !== 'undefined' && window.innerWidth < 768) {
                onToggleOpen();
              }
            }}
            className="w-full flex items-center gap-2.5 py-2 px-3.5 bg-[#1e1f20] hover:bg-[#282a2c] border border-[#2d2f31]/80 text-[#e3e3e3] font-medium text-xs rounded-xl transition-colors group cursor-pointer touch-manipulation active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 text-[#8ab4f8]" />
            <span>New chat</span>
          </button>
        </div>

        {/* Search Chats */}
        {sessions.length > 3 && (
          <div className="px-3 pb-2 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#8e918f] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search chats"
                className="w-full pl-8 pr-3 py-1.5 bg-[#131314] border border-[#2d2f31] rounded-xl text-xs text-[#e3e3e3] placeholder-[#8e918f] focus:outline-none focus:border-[#444746]"
              />
            </div>
          </div>
        )}

        {/* Recent Chats Section */}
        <div
          className="flex-1 min-h-0 overflow-y-auto px-2 py-1 space-y-1 relative"
          ref={(node) => {
            chatsListRef.current = node;
            menuRef.current = node;
          }}
        >
          <div className="text-[11px] font-medium text-[#8e918f] px-3 py-1.5 flex items-center justify-between">
            <span>Recent</span>
            <span className="text-[10px] text-[#8e918f] font-mono">{sessions.length} chats</span>
          </div>

          {filteredSessions.map((session) => {
            const isActive = activeSessionId === session.id;
            const isEditing = editingId === session.id;
            const isMenuOpen = openMenuSessionId === session.id;
            const isExportOpen = openExportSessionId === session.id;
            const isConfirmingDelete = confirmDeleteSessionId === session.id;

            return (
              <div key={session.id} className="relative">
                {/* Regular Chat Row */}
                <div
                  onClick={() => {
                    onSelectSession(session.id);
                    if (typeof window !== 'undefined' && window.innerWidth < 768) {
                      onToggleOpen();
                    }
                  }}
                  className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-colors touch-manipulation active:scale-[0.99] ${
                    isActive
                      ? 'bg-[#282a2c] text-[#ffffff] font-medium'
                      : 'text-[#c4c7c5] hover:bg-[#282a2c]/60 hover:text-[#e3e3e3]'
                  }`}
                >
                  {isEditing ? (
                    <form
                      onSubmit={(e) => handleSaveRename(session.id, e)}
                      className="flex items-center gap-1 w-full"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="flex-1 bg-[#131314] border border-[#8ab4f8] rounded-md px-2 py-1 text-xs text-white focus:outline-none"
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="p-1 text-[#8ab4f8] hover:text-white"
                        title="Save name"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(null);
                        }}
                        className="p-1 text-[#8e918f] hover:text-white"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  ) : (
                    <>
                      <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-1">
                        <MessageSquare className="w-3.5 h-3.5 text-[#8e918f] shrink-0" />
                        <span className="truncate">{session.title}</span>
                      </div>

                      {/* Direct on-hover actions + 3-dots menu button */}
                      <div
                        className={`items-center gap-0.5 shrink-0 ml-1 transition-opacity ${
                          isActive || isMenuOpen || isExportOpen || isConfirmingDelete
                            ? 'flex opacity-100'
                            : 'hidden sm:flex opacity-0 group-hover:opacity-100'
                        }`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Quick Rename Icon */}
                        <button
                          type="button"
                          onClick={(e) => handleStartRename(session, e)}
                          className="p-1 text-[#8e918f] hover:text-[#e3e3e3] rounded hover:bg-[#37393b] transition-colors"
                          title="Rename chat"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>

                        {/* Quick Export Icon */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuSessionId(null);
                            setConfirmDeleteSessionId(null);
                            setOpenExportSessionId(isExportOpen ? null : session.id);
                          }}
                          className={`p-1 rounded transition-colors ${
                            isExportOpen
                              ? 'text-[#8ab4f8] bg-[#37393b]'
                              : 'text-[#8e918f] hover:text-[#e3e3e3] hover:bg-[#37393b]'
                          }`}
                          title="Export chat"
                        >
                          <Download className="w-3 h-3" />
                        </button>

                        {/* Quick Delete Icon */}
                        <button
                          type="button"
                          onClick={(e) => handlePromptDelete(session.id, e)}
                          className="p-1 text-[#8e918f] hover:text-[#f28b82] rounded hover:bg-[#37393b] transition-colors"
                          title="Delete chat"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>

                        {/* 3-dots Menu Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenExportSessionId(null);
                            setConfirmDeleteSessionId(null);
                            setOpenMenuSessionId(isMenuOpen ? null : session.id);
                          }}
                          className={`p-1 rounded transition-colors ${
                            isMenuOpen
                              ? 'text-white bg-[#37393b]'
                              : 'text-[#8e918f] hover:text-[#e3e3e3] hover:bg-[#37393b]'
                          }`}
                          title="Chat options"
                        >
                          <MoreVertical className="w-3 h-3" />
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Inline Delete Confirmation Popover */}
                {isConfirmingDelete && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1 p-2.5 rounded-xl bg-[#282a2c] border border-[#f28b82]/40 text-xs shadow-xl space-y-2 animate-in fade-in"
                  >
                    <div className="flex items-center gap-1.5 text-[#f28b82] font-medium text-[11px]">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Delete this conversation?</span>
                    </div>
                    <div className="flex items-center justify-end gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteSessionId(null);
                        }}
                        className="px-2.5 py-1 rounded-md text-[11px] text-[#c4c7c5] hover:text-white bg-[#1e1f20] hover:bg-[#333538] transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleConfirmDelete(session.id, e)}
                        className="px-2.5 py-1 rounded-md text-[11px] font-medium text-white bg-[#d93025] hover:bg-[#b31412] transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}

                {/* 3-Dots Options Dropdown Menu */}
                {isMenuOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 top-full mt-1 w-48 bg-[#1e1f20] border border-[#2d2f31] rounded-xl shadow-2xl py-1 z-50 text-xs text-[#c4c7c5] animate-in fade-in"
                  >
                    <button
                      type="button"
                      onClick={(e) => handleStartRename(session, e)}
                      className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-[#282a2c] hover:text-white transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-[#8e918f]" />
                      <span>Rename chat</span>
                    </button>

                    <div className="h-px bg-[#2d2f31] my-1" />

                    <div className="px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-[#8e918f]">
                      Export Options
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleExportMarkdown(session, e)}
                      className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-[#282a2c] hover:text-white transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#8ab4f8]" />
                      <span>Export as Markdown (.md)</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleExportJSON(session, e)}
                      className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-[#282a2c] hover:text-white transition-colors"
                    >
                      <FileJson className="w-3.5 h-3.5 text-[#81c995]" />
                      <span>Export as JSON (.json)</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleExportText(session, e)}
                      className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-[#282a2c] hover:text-white transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-[#c4c7c5]" />
                      <span>Export as Text (.txt)</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleCopyChat(session, e)}
                      className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-[#282a2c] hover:text-white transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5 text-[#8ab4f8]" />
                      <span>Copy to clipboard</span>
                    </button>

                    <div className="h-px bg-[#2d2f31] my-1" />

                    <button
                      type="button"
                      onClick={(e) => handlePromptDelete(session.id, e)}
                      className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-[#f28b82] hover:bg-[#f28b82]/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-[#f28b82]" />
                      <span>Delete chat</span>
                    </button>
                  </div>
                )}

                {/* Direct Export Formats Dropdown */}
                {isExportOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 top-full mt-1 w-48 bg-[#1e1f20] border border-[#2d2f31] rounded-xl shadow-2xl py-1 z-50 text-xs text-[#c4c7c5] animate-in fade-in"
                  >
                    <div className="px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-[#8e918f]">
                      Export Chat
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleExportMarkdown(session, e)}
                      className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-[#282a2c] hover:text-white transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#8ab4f8]" />
                      <span>Markdown (.md)</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleExportJSON(session, e)}
                      className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-[#282a2c] hover:text-white transition-colors"
                    >
                      <FileJson className="w-3.5 h-3.5 text-[#81c995]" />
                      <span>JSON (.json)</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleExportText(session, e)}
                      className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-[#282a2c] hover:text-white transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-[#c4c7c5]" />
                      <span>Plain Text (.txt)</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleCopyChat(session, e)}
                      className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-[#282a2c] hover:text-white transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5 text-[#8ab4f8]" />
                      <span>Copy to clipboard</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {sessions.length === 0 && (
            <div className="py-6 text-center text-[#8e918f] text-xs px-3">
              No conversations yet
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-3 pb-[max(0.75rem,calc(env(safe-area-inset-bottom,0px)+0.5rem))] border-t border-[#2d2f31] bg-[#1e1f20] space-y-1 text-xs shrink-0">
          {/* Theme Mode Toggle Button in Sidebar */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-[#282a2c] text-[#c4c7c5] hover:text-white transition-colors cursor-pointer touch-manipulation active:scale-[0.98]"
              title={`Switch to ${actualTheme === 'dark' ? 'Light' : 'Dark'} mode`}
            >
              <div className="flex items-center gap-2.5">
                {actualTheme === 'dark' ? (
                  <Sun className="w-3.5 h-3.5 text-[#f9ab00]" />
                ) : (
                  <Moon className="w-3.5 h-3.5 text-[#1a73e8]" />
                )}
                <span>Appearance</span>
              </div>
              <span className="text-[11px] font-medium text-[#8e918f] capitalize">
                {actualTheme === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </span>
            </button>
          )}

          {/* Change Voice Button in Sidebar */}
          {onOpenVoiceModal && (
            <button
              onClick={onOpenVoiceModal}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-[#282a2c] text-[#c4c7c5] hover:text-white transition-colors cursor-pointer touch-manipulation"
              title="Change speech synthesis voice and pitch"
            >
              <Volume2 className="w-3.5 h-3.5 text-[#8ab4f8]" />
              <span>Voice Settings</span>
            </button>
          )}

          {/* Active Model / Provider Summary */}
          <button
            onClick={onOpenProviderModal}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-[#282a2c] text-[#c4c7c5] hover:text-white transition-colors cursor-pointer touch-manipulation"
          >
            <div className="flex items-center gap-2 truncate">
              <Key className="w-3.5 h-3.5 text-[#8e918f]" />
              <div className="truncate">
                <span className="font-medium text-[#e3e3e3]">{currentProviderInfo.name}</span>
                <span className="text-[#8e918f] text-[11px] block truncate">{activeModelId}</span>
              </div>
            </div>
          </button>

          {/* Ragas Quality & Evals Button */}
          {onOpenRagasModal && (
            <button
              onClick={onOpenRagasModal}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-[#282a2c] text-[#c4c7c5] hover:text-white transition-colors cursor-pointer touch-manipulation"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#8e918f]" />
              <span>Ragas & Evaluation</span>
            </button>
          )}

          {/* Settings Button */}
          <button
            onClick={onOpenSettingsModal}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-[#282a2c] text-[#c4c7c5] hover:text-white transition-colors cursor-pointer touch-manipulation"
          >
            <Sliders className="w-3.5 h-3.5 text-[#8e918f]" />
            <span>Settings</span>
          </button>
        </div>
      </aside>
    </>
  );
};
