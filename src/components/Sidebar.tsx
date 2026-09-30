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
  LogOut,
  Volume2,
  Download,
  MoreVertical,
  Copy,
  FileText,
  FileJson,
  AlertTriangle,
  Share2,
} from 'lucide-react';
import { ChatSession, AIProviderId, UserAccount } from '../types';
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
  currentUser?: UserAccount | null;
  onOpenAccountModal?: () => void;
  onLogout?: () => void;
  activeProvider: AIProviderId;
  activeModelId: string;
  isOpen: boolean;
  onToggleOpen: () => void;
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
  currentUser,
  onOpenAccountModal,
  onLogout,
  activeProvider,
  activeModelId,
  isOpen,
  onToggleOpen,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [openMenuSessionId, setOpenMenuSessionId] = useState<string | null>(null);
  const [openExportSessionId, setOpenExportSessionId] = useState<string | null>(null);
  const [confirmDeleteSessionId, setConfirmDeleteSessionId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  const currentProviderInfo =
    AI_PROVIDERS.find((p) => p.id === activeProvider) || AI_PROVIDERS[0];
  const isGoogleUser = currentUser?.authProvider === 'google';

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
    setConfirmDeleteSessionId(null);
    onDeleteSession(sessionId);
    showToast('Chat deleted');
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
      {isOpen && (
        <div
          onClick={onToggleOpen}
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-[#1e1f20] border-r border-[#2d2f31] flex flex-col transition-all duration-200 shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-0 md:border-r-0 md:overflow-hidden'
        }`}
      >
        {/* Header / Brand */}
        <div className="p-4 flex items-center justify-between">
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
            className="md:hidden p-1.5 text-[#8e918f] hover:text-[#e3e3e3] rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="px-3 pb-3">
          <button
            onClick={onNewChat}
            className="w-full flex items-center gap-2.5 py-2.5 px-4 bg-[#282a2c] hover:bg-[#333538] text-[#e3e3e3] font-medium text-xs rounded-full transition-colors group cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#8ab4f8]" />
            <span>New chat</span>
          </button>
        </div>

        {/* Search Chats */}
        {sessions.length > 3 && (
          <div className="px-3 pb-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#8e918f] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search chats"
                className="w-full pl-8 pr-3 py-1.5 bg-[#131314] border border-[#2d2f31] rounded-full text-xs text-[#e3e3e3] placeholder-[#8e918f] focus:outline-none focus:border-[#444746]"
              />
            </div>
          </div>
        )}

        {/* Toast Alert */}
        {toastMessage && (
          <div className="mx-3 mb-2 px-3 py-1.5 rounded-lg bg-[#282a2c] border border-[#3c4043] text-[#8ab4f8] text-[11px] font-medium animate-in fade-in flex items-center justify-between">
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="text-[#8e918f] hover:text-white">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Recent Chats Section */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1 relative" ref={menuRef}>
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
                  onClick={() => onSelectSession(session.id)}
                  className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-colors ${
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
        <div className="p-3 border-t border-[#2d2f31] bg-[#1e1f20] space-y-1.5 text-xs">
          {/* User Account Quick Card */}
          {currentUser && (
            <div className="p-2 rounded-xl bg-[#131314] border border-[#2d2f31] flex items-center justify-between mb-1">
              <button
                type="button"
                onClick={onOpenAccountModal}
                className="flex items-center gap-2 min-w-0 flex-1 text-left hover:opacity-85 transition-opacity cursor-pointer"
                title={`Account & API Keys (${currentUser.email})`}
              >
                <div className="relative">
                  <div className="w-7 h-7 rounded-full bg-[#282a2c] border border-[#3c4043] flex items-center justify-center text-[#8ab4f8] font-semibold text-[11px] shrink-0">
                    {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  {isGoogleUser && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-white flex items-center justify-center p-0.5 shadow">
                      <svg className="w-2.5 h-2.5" viewBox="0 0 24 24">
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
                <div className="truncate">
                  <div className="font-medium text-[#e3e3e3] truncate text-[11.5px] flex items-center gap-1">
                    <span>{currentUser.displayName}</span>
                    {isGoogleUser && (
                      <span className="text-[9px] text-[#81c995] font-normal">
                        (Google)
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-[#8e918f] truncate font-mono">
                    {currentUser.email}
                  </div>
                </div>
              </button>
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="p-1.5 text-[#8e918f] hover:text-[#f28b82] rounded-lg hover:bg-[#282a2c] transition-colors shrink-0 cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Change Voice Button in Sidebar */}
          {onOpenVoiceModal && (
            <button
              onClick={onOpenVoiceModal}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-[#282a2c] text-[#c4c7c5] hover:text-white transition-colors cursor-pointer"
              title="Change speech synthesis voice and pitch"
            >
              <Volume2 className="w-3.5 h-3.5 text-[#8ab4f8]" />
              <span>Voice Settings</span>
            </button>
          )}

          {/* Active Model / Provider Summary */}
          <button
            onClick={onOpenProviderModal}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-[#282a2c] text-[#c4c7c5] hover:text-white transition-colors cursor-pointer"
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
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-[#282a2c] text-[#c4c7c5] hover:text-white transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#8e918f]" />
              <span>Ragas & Evaluation</span>
            </button>
          )}

          {/* Settings Button */}
          <button
            onClick={onOpenSettingsModal}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-[#282a2c] text-[#c4c7c5] hover:text-white transition-colors cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-[#8e918f]" />
            <span>Settings</span>
          </button>
        </div>
      </aside>
    </>
  );
};
