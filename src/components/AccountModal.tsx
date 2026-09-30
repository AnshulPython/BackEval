/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  User,
  Key,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Trash2,
  LogOut,
  RefreshCw,
  Plus,
  ShieldCheck,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { UserAccount, StoredAPIKeys, AIProviderId } from '../types';
import { AI_PROVIDERS } from '../data/providersAndModels';
import {
  getUserAccounts,
  updateAccountKeys,
  setCurrentUser,
} from '../utils/storage';
import { GoogleSignInModal } from './GoogleSignInModal';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  onLogout: () => void;
  onSwitchAccount: (account: UserAccount) => void;
  hasGeminiEnvKey?: boolean;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogout,
  onSwitchAccount,
  hasGeminiEnvKey = false,
}) => {
  const [editingProvider, setEditingProvider] = useState<AIProviderId | null>(null);
  const [keyInput, setKeyInput] = useState('');
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [validatingProvider, setValidatingProvider] = useState<AIProviderId | null>(null);
  const [validationResults, setValidationResults] = useState<
    Record<string, { success: boolean; message: string }>
  >({});
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

  if (!isOpen) return null;

  const accounts = getUserAccounts();
  const currentKeys = currentUser.apiKeys || {};
  const isGoogle = currentUser.authProvider === 'google';

  const handleSaveKey = (providerId: AIProviderId) => {
    const nextKeys: StoredAPIKeys = {
      ...currentUser.apiKeys,
      [providerId]: keyInput.trim(),
    };
    const updated = updateAccountKeys(currentUser.id, nextKeys);
    if (updated) {
      setCurrentUser(updated);
    }
    setEditingProvider(null);
    setKeyInput('');
  };

  const handleRemoveKey = (providerId: AIProviderId) => {
    const nextKeys = { ...currentUser.apiKeys };
    delete nextKeys[providerId];
    const updated = updateAccountKeys(currentUser.id, nextKeys);
    if (updated) {
      setCurrentUser(updated);
    }
  };

  const handleValidateKey = async (providerId: AIProviderId, keyVal: string) => {
    setValidatingProvider(providerId);
    try {
      const res = await fetch('/api/validate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: providerId, apiKey: keyVal }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setValidationResults((prev) => ({
          ...prev,
          [providerId]: { success: true, message: data.message || 'Key verified!' },
        }));
      } else {
        setValidationResults((prev) => ({
          ...prev,
          [providerId]: { success: false, message: data.error || 'Verification failed.' },
        }));
      }
    } catch (err: any) {
      setValidationResults((prev) => ({
        ...prev,
        [providerId]: { success: false, message: err.message },
      }));
    } finally {
      setValidatingProvider(null);
    }
  };

  const maskKey = (key?: string) => {
    if (!key) return '';
    if (key.length <= 8) return '••••••••';
    return `${key.slice(0, 4)}••••••••${key.slice(-4)}`;
  };

  const connectedCount = Object.keys(currentKeys).filter(
    (k) => k !== 'customBaseUrl' && Boolean((currentKeys as any)[k])
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#1e1f20] border border-[#2d2f31] rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2d2f31]">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-[#282a2c] border border-[#3c4043] flex items-center justify-center text-[#8ab4f8] font-semibold text-sm">
                {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
              </div>
              {isGoogle && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white flex items-center justify-center p-0.5 shadow">
                  <svg className="w-3 h-3" viewBox="0 0 24 24">
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
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-[#e3e3e3]">
                  {currentUser.displayName}
                </h2>
                {isGoogle && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#131314] text-[#81c995] font-medium border border-[#2d2f31] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-[#81c995]" />
                    Google Verified
                  </span>
                )}
              </div>
              <p className="text-xs text-[#8e918f] font-mono">
                {currentUser.email}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8e918f] hover:text-[#e3e3e3] rounded-lg hover:bg-[#282a2c] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Google Auth Status Box */}
          <div className="p-4 rounded-xl bg-[#131314] border border-[#2d2f31] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
              <div>
                <div className="text-xs font-medium text-[#e3e3e3]">
                  {isGoogle ? 'Signed in with Google Account' : 'Connect Google Account'}
                </div>
                <div className="text-[11px] text-[#8e918f]">
                  {isGoogle
                    ? `Authenticated as ${currentUser.email}`
                    : 'Sign in with your Google account to sync preferences across sessions'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsGoogleModalOpen(true)}
              className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-[#282a2c] hover:bg-[#333538] text-[#8ab4f8] transition-colors shrink-0"
            >
              {isGoogle ? 'Switch Google Account' : 'Sign in with Google'}
            </button>
          </div>

          {/* Connected Keys Overview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium uppercase tracking-wider text-[#8e918f] flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-[#8ab4f8]" />
                <span>Account API Keys ({connectedCount} / {AI_PROVIDERS.length})</span>
              </div>
            </div>

            <div className="space-y-2">
              {AI_PROVIDERS.map((prov) => {
                const isEditing = editingProvider === prov.id;
                const savedKey = (currentKeys as any)[prov.id] as string | undefined;
                const isConnected = Boolean(savedKey && savedKey.trim());
                const isGeminiBuiltIn =
                  prov.id === 'gemini' && hasGeminiEnvKey && !isConnected;
                const isShowing = showKeys[prov.id] ?? false;
                const isValidating = validatingProvider === prov.id;
                const validation = validationResults[prov.id];

                return (
                  <div
                    key={prov.id}
                    className="p-3 rounded-xl bg-[#131314] border border-[#2d2f31] text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: prov.color }}
                        />
                        <span className="font-medium text-[#e3e3e3]">{prov.name}</span>
                        {isConnected ? (
                          <span className="text-[10px] text-[#81c995] flex items-center gap-0.5 ml-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Connected
                          </span>
                        ) : isGeminiBuiltIn ? (
                          <span className="text-[10px] text-[#8ab4f8] flex items-center gap-0.5 ml-1">
                            <Sparkles className="w-3 h-3" />
                            Server Ready
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#8e918f] ml-1">
                            Not set
                          </span>
                        )}
                      </div>
                      {!isEditing && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProvider(prov.id);
                            setKeyInput(savedKey || '');
                          }}
                          className="px-2.5 py-0.5 rounded-full bg-[#282a2c] hover:bg-[#333538] text-[#c4c7c5] hover:text-white text-[11px]"
                        >
                          {isConnected ? 'Change' : 'Add Key'}
                        </button>
                      )}
                    </div>

                    {/* Masked Key Display */}
                    {isConnected && !isEditing && (
                      <div className="flex items-center justify-between p-2 rounded-lg bg-[#1e1f20] font-mono text-[11px]">
                        <span className="text-[#c4c7c5] truncate mr-2">
                          {isShowing ? savedKey : maskKey(savedKey)}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              setShowKeys((prev) => ({ ...prev, [prov.id]: !prev[prov.id] }))
                            }
                            className="p-1 text-[#8e918f] hover:text-[#e3e3e3]"
                          >
                            {isShowing ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleValidateKey(prov.id, savedKey || '')}
                            disabled={isValidating}
                            className="px-2 py-0.5 text-[10px] rounded bg-[#282a2c] hover:bg-[#333538] text-[#8ab4f8]"
                          >
                            {isValidating ? 'Testing...' : 'Test'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveKey(prov.id)}
                            className="p-1 text-[#8e918f] hover:text-[#f28b82]"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Inline edit */}
                    {isEditing && (
                      <div className="flex gap-2 pt-1">
                        <input
                          type="password"
                          value={keyInput}
                          onChange={(e) => setKeyInput(e.target.value)}
                          placeholder={prov.placeholderKey}
                          className="flex-1 px-3 py-1 bg-[#1e1f20] border border-[#2d2f31] rounded-lg text-xs font-mono text-white focus:outline-none"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveKey(prov.id)}
                          className="px-3 py-1 bg-[#8ab4f8] hover:bg-[#a8c7fa] text-[#131314] rounded-lg font-medium text-xs"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingProvider(null)}
                          className="px-2 py-1 text-xs text-[#8e918f] hover:text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    {validation && (
                      <div
                        className={`text-[10px] p-1.5 rounded ${
                          validation.success
                            ? 'text-[#81c995] bg-[#1e1f20]'
                            : 'text-[#f28b82] bg-[#1e1f20]'
                        }`}
                      >
                        {validation.message}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Switch Accounts section */}
          {accounts.length > 1 && (
            <div className="space-y-2 pt-2 border-t border-[#2d2f31]">
              <div className="text-xs font-medium uppercase tracking-wider text-[#8e918f]">
                Switch Account
              </div>
              <div className="space-y-1.5">
                {accounts
                  .filter((a) => a.id !== currentUser.id)
                  .map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => {
                        onSwitchAccount(acc);
                        onClose();
                      }}
                      className="w-full p-2.5 rounded-xl bg-[#131314] hover:bg-[#282a2c] border border-[#2d2f31] flex items-center justify-between text-left text-xs transition-colors"
                    >
                      <div>
                        <div className="font-medium text-[#e3e3e3]">{acc.displayName}</div>
                        <div className="text-[11px] text-[#8e918f]">{acc.email}</div>
                      </div>
                      <span className="text-[10px] text-[#8ab4f8]">Switch</span>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#2d2f31] flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-[#f28b82] hover:bg-[#282a2c] transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-medium text-[#131314] bg-[#e3e3e3] hover:bg-white rounded-full transition-colors"
          >
            Done
          </button>
        </div>
      </div>

      <GoogleSignInModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        onSuccess={(acc) => {
          onSwitchAccount(acc);
        }}
      />
    </div>
  );
};
