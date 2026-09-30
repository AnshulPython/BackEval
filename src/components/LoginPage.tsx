/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Key,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Plus,
  ArrowRight,
  LogIn,
  Check,
  RefreshCw,
  Trash2,
  Shield,
  ShieldCheck,
} from 'lucide-react';
import { AIProviderId, StoredAPIKeys, UserAccount } from '../types';
import { AI_PROVIDERS } from '../data/providersAndModels';
import {
  getUserAccounts,
  loginAccount,
  loginGoogleAccount,
  updateAccountKeys,
  PRIMARY_GOOGLE_USER_EMAIL,
} from '../utils/storage';
import { GoogleSignInModal } from './GoogleSignInModal';

interface LoginPageProps {
  onLogin: (account: UserAccount) => void;
  hasGeminiEnvKey?: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLogin,
  hasGeminiEnvKey = false,
}) => {
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [isNewAccountTab, setIsNewAccountTab] = useState(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

  // Form states
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Key editing states
  const [editingProviderKey, setEditingProviderKey] = useState<AIProviderId | null>(null);
  const [tempKeyValue, setTempKeyValue] = useState('');
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [validatingProvider, setValidatingProvider] = useState<AIProviderId | null>(null);
  const [validationResults, setValidationResults] = useState<
    Record<string, { success: boolean; message: string }>
  >({});

  useEffect(() => {
    const list = getUserAccounts();
    setAccounts(list);
    if (list.length > 0) {
      setSelectedAccountId(list[0].id);
      setEmailInput(list[0].email);
      setNameInput(list[0].displayName);
    } else {
      setEmailInput(PRIMARY_GOOGLE_USER_EMAIL);
      setNameInput('Workspace Developer');
    }
  }, []);

  const selectedAccount =
    accounts.find((a) => a.id === selectedAccountId) || accounts[0] || null;
  const currentKeys: StoredAPIKeys = selectedAccount?.apiKeys || {};

  const connectedKeysCount = Object.keys(currentKeys).filter(
    (k) => k !== 'customBaseUrl' && Boolean((currentKeys as any)[k])
  ).length;

  const handleSelectAccount = (account: UserAccount) => {
    setSelectedAccountId(account.id);
    setEmailInput(account.email);
    setNameInput(account.displayName);
    setIsNewAccountTab(false);
    setAuthError(null);
  };

  const handleSignIn = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!emailInput.trim()) {
      setAuthError('Please enter a valid email address.');
      return;
    }
    try {
      const isGoogle = emailInput.trim().toLowerCase().includes('gmail');
      const loggedAccount = isGoogle
        ? loginGoogleAccount(emailInput.trim(), nameInput.trim())
        : loginAccount(emailInput.trim(), nameInput.trim());
      onLogin(loggedAccount);
    } catch (err: any) {
      setAuthError(err.message || 'Login failed.');
    }
  };

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setAuthError('Email is required.');
      return;
    }
    try {
      const isGoogle = emailInput.trim().toLowerCase().includes('gmail');
      const created = isGoogle
        ? loginGoogleAccount(emailInput.trim(), nameInput.trim())
        : loginAccount(
            emailInput.trim(),
            nameInput.trim() || emailInput.trim().split('@')[0]
          );
      setAccounts(getUserAccounts());
      setSelectedAccountId(created.id);
      onLogin(created);
    } catch (err: any) {
      setAuthError(err.message || 'Failed to create account.');
    }
  };

  const handleSaveKeyForAccount = (providerId: AIProviderId) => {
    if (!selectedAccount) return;
    const nextKeys: StoredAPIKeys = {
      ...selectedAccount.apiKeys,
      [providerId]: tempKeyValue.trim(),
    };
    const updated = updateAccountKeys(selectedAccount.id, nextKeys);
    if (updated) {
      setAccounts(getUserAccounts());
    }
    setEditingProviderKey(null);
    setTempKeyValue('');
  };

  const handleRemoveKeyForAccount = (providerId: AIProviderId) => {
    if (!selectedAccount) return;
    const nextKeys = { ...selectedAccount.apiKeys };
    delete nextKeys[providerId];
    const updated = updateAccountKeys(selectedAccount.id, nextKeys);
    if (updated) {
      setAccounts(getUserAccounts());
    }
  };

  const handleValidateKey = async (providerId: AIProviderId, keyVal: string) => {
    setValidatingProvider(providerId);
    setValidationResults((prev) => {
      const copy = { ...prev };
      delete copy[providerId];
      return copy;
    });
    try {
      const res = await fetch('/api/validate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: providerId,
          apiKey: keyVal,
        }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setValidationResults((prev) => ({
          ...prev,
          [providerId]: {
            success: true,
            message: data.message || 'Key connected & verified!',
          },
        }));
      } else {
        setValidationResults((prev) => ({
          ...prev,
          [providerId]: {
            success: false,
            message: data.error || 'Verification failed.',
          },
        }));
      }
    } catch (err: any) {
      setValidationResults((prev) => ({
        ...prev,
        [providerId]: {
          success: false,
          message: err.message || 'Network error.',
        },
      }));
    } finally {
      setValidatingProvider(null);
    }
  };

  const toggleShowKey = (provId: string) => {
    setShowKeys((prev) => ({ ...prev, [provId]: !prev[provId] }));
  };

  const maskKey = (key?: string) => {
    if (!key) return '';
    if (key.length <= 8) return '••••••••';
    const prefix = key.slice(0, 4);
    const suffix = key.slice(-4);
    return `${prefix}••••••••${suffix}`;
  };

  return (
    <div className="min-h-screen w-screen bg-[#131314] text-[#e3e3e3] flex flex-col justify-between overflow-y-auto antialiased">
      {/* Top Header */}
      <header className="h-16 px-6 sm:px-10 flex items-center justify-between border-b border-[#2d2f31] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#282a2c] flex items-center justify-center text-[#8ab4f8]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-sm tracking-tight text-[#e3e3e3]">
              LLM Orchestration & RAGAS
            </span>
            <span className="text-[11px] text-[#8e918f] ml-2 hidden sm:inline">
              Benchmarking Engine & API Vault
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-[#8e918f]">
          {hasGeminiEnvKey && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1e1f20] border border-[#2d2f31] text-[#81c995]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#81c995]" />
              <span>Google Gemini Server Ready</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Login View Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8 flex flex-col justify-center">
        {/* Welcome Kicker */}
        <div className="text-center max-w-xl mx-auto mb-8 space-y-2">
          <h1 className="text-2xl sm:text-3xl font-medium text-[#e3e3e3] tracking-tight">
            Sign in to LLM Orchestration & RAGAS Engine
          </h1>
          <p className="text-xs sm:text-sm text-[#8e918f]">
            Access your AI models, RAGAS evaluations, voice studio, and connected API credentials.
          </p>
        </div>

        {/* Two-Column Grid: Left Account Access & Right Connected Keys Vault */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: Account Sign In / Select (5 Cols) */}
          <div className="lg:col-span-5 bg-[#1e1f20] border border-[#2d2f31] rounded-2xl p-6 shadow-xl space-y-5">
            {/* OFFICIAL GOOGLE LOGIN BUTTON */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setIsGoogleModalOpen(true)}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-[#f1f3f4] text-[#1f1f1f] font-medium text-xs sm:text-sm rounded-full transition-all shadow-md cursor-pointer border border-[#dadce0] active:scale-[0.99]"
              >
                {/* Authentic 4-color Google G Icon */}
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
                <span className="font-semibold text-[#3c4043] tracking-wide">
                  Sign in with Google
                </span>
              </button>

              <div className="flex items-center gap-3 pt-2">
                <div className="flex-1 h-px bg-[#2d2f31]" />
                <span className="text-[11px] text-[#8e918f] uppercase font-mono">
                  or email sign in
                </span>
                <div className="flex-1 h-px bg-[#2d2f31]" />
              </div>
            </div>

            {/* Account Switcher Tabs */}
            <div className="flex items-center p-1 bg-[#131314] rounded-xl border border-[#2d2f31] text-xs font-medium">
              <button
                type="button"
                onClick={() => setIsNewAccountTab(false)}
                className={`flex-1 py-2 text-center rounded-lg transition-colors ${
                  !isNewAccountTab
                    ? 'bg-[#282a2c] text-white shadow-xs'
                    : 'text-[#8e918f] hover:text-[#c4c7c5]'
                }`}
              >
                Saved Accounts
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsNewAccountTab(true);
                  setEmailInput('');
                  setNameInput('');
                  setAuthError(null);
                }}
                className={`flex-1 py-2 text-center rounded-lg transition-colors ${
                  isNewAccountTab
                    ? 'bg-[#282a2c] text-white shadow-xs'
                    : 'text-[#8e918f] hover:text-[#c4c7c5]'
                }`}
              >
                New Account
              </button>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-[#131314] border border-[#f28b82]/40 text-[#f28b82] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {!isNewAccountTab ? (
              /* Existing Accounts Mode */
              <div className="space-y-4">
                <div className="text-xs font-medium text-[#8e918f] uppercase tracking-wider flex items-center justify-between">
                  <span>Choose Account</span>
                  <span className="text-[11px] lowercase text-[#8ab4f8]">
                    {accounts.length} available
                  </span>
                </div>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {accounts.map((acc) => {
                    const isSelected = selectedAccountId === acc.id;
                    const isGoogle = acc.authProvider === 'google';
                    const keyCount = Object.keys(acc.apiKeys || {}).filter(
                      (k) => k !== 'customBaseUrl' && Boolean((acc.apiKeys as any)[k])
                    ).length;

                    return (
                      <div
                        key={acc.id}
                        onClick={() => handleSelectAccount(acc)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#282a2c] border-[#8ab4f8] shadow-xs'
                            : 'bg-[#131314] hover:bg-[#282a2c]/60 border-[#2d2f31]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative">
                            <div className="w-9 h-9 rounded-full bg-[#1e1f20] border border-[#3c4043] flex items-center justify-center text-[#8ab4f8] font-medium text-xs shrink-0">
                              {acc.displayName ? acc.displayName.charAt(0).toUpperCase() : 'U'}
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
                          <div className="truncate">
                            <div className="text-xs font-semibold text-[#e3e3e3] truncate flex items-center gap-1.5">
                              <span>{acc.displayName}</span>
                              {isGoogle && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#1e1f20] text-[#8ab4f8] border border-[#2d2f31]">
                                  Google
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#8e918f] truncate font-mono">
                              {acc.email}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1e1f20] border border-[#2d2f31] text-[#8ab4f8]">
                            {keyCount} {keyCount === 1 ? 'key' : 'keys'}
                          </span>
                          {isSelected && <Check className="w-4 h-4 text-[#8ab4f8]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Primary Launch Action */}
                <button
                  type="button"
                  onClick={() => handleSignIn()}
                  className="w-full py-3 px-4 bg-[#8ab4f8] hover:bg-[#a8c7fa] text-[#131314] font-medium text-xs rounded-full transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer mt-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>
                    Continue as {selectedAccount?.displayName || 'User'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Create Account Mode */
              <form onSubmit={handleCreateAccount} className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-[#c4c7c5] block mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="e.g. Alex Hunter"
                      className="w-full px-3.5 py-2.5 bg-[#131314] border border-[#2d2f31] rounded-xl text-xs text-[#e3e3e3] placeholder-[#8e918f] focus:outline-none focus:border-[#444746]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#c4c7c5] block mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full px-3.5 py-2.5 bg-[#131314] border border-[#2d2f31] rounded-xl text-xs text-[#e3e3e3] placeholder-[#8e918f] focus:outline-none focus:border-[#444746]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#c4c7c5] block mb-1">
                      Password (Optional)
                    </label>
                    <input
                      type="password"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 bg-[#131314] border border-[#2d2f31] rounded-xl text-xs text-[#e3e3e3] placeholder-[#8e918f] focus:outline-none focus:border-[#444746]"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-[#8ab4f8] hover:bg-[#a8c7fa] text-[#131314] font-medium text-xs rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Account & Continue</span>
                </button>
              </form>
            )}

            {/* Quick Fast Access */}
            <div className="pt-2 border-t border-[#2d2f31] flex items-center justify-between text-xs text-[#8e918f]">
              <span>Primary Google User:</span>
              <button
                type="button"
                onClick={() => {
                  const googleUser = loginGoogleAccount(PRIMARY_GOOGLE_USER_EMAIL, 'Workspace Developer');
                  onLogin(googleUser);
                }}
                className="text-[#8ab4f8] hover:text-[#a8c7fa] hover:underline"
              >
                Sign in as {PRIMARY_GOOGLE_USER_EMAIL}
              </button>
            </div>
          </div>

          {/* RIGHT: Connected API Keys for Account (7 Cols) */}
          <div className="lg:col-span-7 bg-[#1e1f20] border border-[#2d2f31] rounded-2xl p-6 shadow-xl space-y-5">
            {/* Header for Keys Vault */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#2d2f31]">
              <div>
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-[#8ab4f8]" />
                  <h2 className="text-sm font-semibold text-[#e3e3e3]">
                    Connected API Keys
                  </h2>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#282a2c] text-[#8ab4f8] font-mono">
                    {connectedKeysCount} / {AI_PROVIDERS.length} Connected
                  </span>
                </div>
                <p className="text-[11px] text-[#8e918f] mt-0.5">
                  Account:{' '}
                  <span className="text-[#e3e3e3] font-medium">
                    {selectedAccount?.email || emailInput || 'Guest'}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleSignIn()}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#e3e3e3] hover:bg-white text-[#131314] rounded-full text-xs font-medium transition-colors shrink-0 shadow-xs cursor-pointer"
              >
                <span>Launch Chat</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Provider Key Items List */}
            <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
              {AI_PROVIDERS.map((prov) => {
                const isEditing = editingProviderKey === prov.id;
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
                    className="p-3.5 rounded-xl bg-[#131314] border border-[#2d2f31] text-xs transition-all space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: prov.color }}
                        />
                        <div className="truncate">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-[#e3e3e3]">
                              {prov.name}
                            </span>
                            <span className="text-[10px] text-[#8e918f]">
                              {prov.badge}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isConnected ? (
                          <div className="flex items-center gap-1 text-[#81c995] text-[11px] font-medium bg-[#1e1f20] px-2 py-0.5 rounded-full border border-[#2d2f31]">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Connected</span>
                          </div>
                        ) : isGeminiBuiltIn ? (
                          <div className="flex items-center gap-1 text-[#8ab4f8] text-[11px] font-medium bg-[#1e1f20] px-2 py-0.5 rounded-full border border-[#2d2f31]">
                            <Sparkles className="w-3 h-3" />
                            <span>Server Ready</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#8e918f]">
                            Not configured
                          </span>
                        )}
                        {!isEditing && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProviderKey(prov.id);
                              setTempKeyValue(savedKey || '');
                            }}
                            className="px-2.5 py-1 rounded-full bg-[#282a2c] hover:bg-[#333538] text-[#c4c7c5] hover:text-white text-[11px] transition-colors"
                          >
                            {isConnected ? 'Edit' : 'Add Key'}
                          </button>
                        )}
                      </div>
                    </div>

                    {isConnected && !isEditing && (
                      <div className="flex items-center justify-between p-2 rounded-lg bg-[#1e1f20] border border-[#2d2f31] font-mono text-[11px]">
                        <span className="text-[#c4c7c5] truncate mr-2">
                          {isShowing ? savedKey : maskKey(savedKey)}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => toggleShowKey(prov.id)}
                            className="p-1 text-[#8e918f] hover:text-[#e3e3e3] rounded"
                            title={isShowing ? 'Hide' : 'Reveal'}
                          >
                            {isShowing ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleValidateKey(prov.id, savedKey || '')}
                            disabled={isValidating}
                            className="px-2 py-0.5 text-[10px] rounded bg-[#282a2c] hover:bg-[#333538] text-[#8ab4f8] transition-colors flex items-center gap-1"
                          >
                            {isValidating && (
                              <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                            )}
                            <span>{isValidating ? 'Testing...' : 'Test'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveKeyForAccount(prov.id)}
                            className="p-1 text-[#8e918f] hover:text-[#f28b82] rounded"
                            title="Remove key"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {isEditing && (
                      <div className="p-3 rounded-xl bg-[#1e1f20] border border-[#444746] space-y-2 mt-2">
                        <div className="flex items-center justify-between text-[11px] text-[#8e918f]">
                          <span>Enter {prov.name} API Key:</span>
                          <a
                            href={prov.keyHelpUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#8ab4f8] hover:underline"
                          >
                            Get key
                          </a>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="password"
                            value={tempKeyValue}
                            onChange={(e) => setTempKeyValue(e.target.value)}
                            placeholder={prov.placeholderKey}
                            className="flex-1 px-3 py-1.5 bg-[#131314] border border-[#2d2f31] rounded-lg text-xs font-mono text-[#e3e3e3] placeholder-[#8e918f] focus:outline-none focus:border-[#8ab4f8]"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveKeyForAccount(prov.id)}
                            className="px-3 py-1.5 bg-[#8ab4f8] hover:bg-[#a8c7fa] text-[#131314] rounded-lg text-xs font-medium transition-colors"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingProviderKey(null)}
                            className="px-2.5 py-1.5 text-xs text-[#8e918f] hover:text-[#e3e3e3]"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {validation && (
                      <div
                        className={`text-[11px] p-2 rounded-lg ${
                          validation.success
                            ? 'bg-[#1e1f20] text-[#81c995] border border-[#81c995]/30'
                            : 'bg-[#1e1f20] text-[#f28b82] border border-[#f28b82]/30'
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
        </div>
      </main>

      {/* Google Sign In Modal */}
      <GoogleSignInModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        onSuccess={(acc) => {
          setAccounts(getUserAccounts());
          onLogin(acc);
        }}
      />

      {/* Footer */}
      <footer className="h-12 border-t border-[#2d2f31] px-6 flex items-center justify-between text-[11px] text-[#8e918f] shrink-0">
        <div>Multi-Provider LLM Orchestration & RAGAS Benchmarking Engine</div>
        <div>All API keys remain local and encrypted in your browser session</div>
      </footer>
    </div>
  );
};
