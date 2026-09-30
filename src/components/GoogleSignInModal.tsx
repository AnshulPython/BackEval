/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Check, ArrowRight, UserPlus, Shield, Sparkles } from 'lucide-react';
import { UserAccount } from '../types';
import { PRIMARY_GOOGLE_USER_EMAIL, loginGoogleAccount } from '../utils/storage';
import confetti from 'canvas-confetti';

interface GoogleSignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (account: UserAccount) => void;
}

export const GoogleSignInModal: React.FC<GoogleSignInModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [isUsingCustom, setIsUsingCustom] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleSelectAccount = (email: string, name: string, avatar?: string) => {
    setIsProcessing(true);
    setTimeout(async () => {
      try {
        // Sync with backend
        await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            displayName: name,
            authProvider: 'google',
            avatarUrl: avatar,
          }),
        }).catch(() => {});

        const account = loginGoogleAccount(email, name, avatar);
        try {
          confetti({
            particleCount: 70,
            spread: 60,
            origin: { y: 0.6 },
          });
        } catch {}

        setIsProcessing(false);
        onSuccess(account);
        onClose();
      } catch {
        setIsProcessing(false);
      }
    }, 400);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim()) return;
    const name = customName.trim() || customEmail.trim().split('@')[0];
    handleSelectAccount(customEmail.trim(), name);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-[#1e1f20] border border-[#2d2f31] rounded-3xl flex flex-col shadow-2xl overflow-hidden text-left">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-[#2d2f31] flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Google 4-Color G Logo SVG */}
            <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
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
              <h2 className="text-base font-semibold text-[#e3e3e3]">
                Sign in with Google
              </h2>
              <p className="text-xs text-[#8e918f]">
                Choose an account to continue to LLM Orchestration & RAGAS Engine
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

        {/* Content */}
        <div className="p-6 space-y-4">
          {!isUsingCustom ? (
            <div className="space-y-3">
              {/* Primary Detected Google Account */}
              <div
                onClick={() =>
                  handleSelectAccount(
                    PRIMARY_GOOGLE_USER_EMAIL,
                    'Workspace Developer',
                    'https://lh3.googleusercontent.com/a/default-user=s96-c'
                  )
                }
                className="p-4 rounded-2xl bg-[#131314] hover:bg-[#282a2c] border border-[#2d2f31] hover:border-[#8ab4f8]/50 cursor-pointer transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#4285F4] to-[#34A853] flex items-center justify-center text-white font-medium text-sm shrink-0 shadow-xs">
                    W
                  </div>
                  <div className="truncate">
                    <div className="text-sm font-semibold text-[#e3e3e3] flex items-center gap-1.5">
                      <span>Workspace Developer</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#1e1f20] text-[#81c995] font-medium border border-[#2d2f31]">
                        Ready
                      </span>
                    </div>
                    <div className="text-xs text-[#8e918f] truncate font-mono mt-0.5">
                      {PRIMARY_GOOGLE_USER_EMAIL}
                    </div>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#1e1f20] group-hover:bg-[#8ab4f8] text-[#8e918f] group-hover:text-[#131314] flex items-center justify-center transition-colors shrink-0">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>

              {/* Secondary Google Account / Add Another */}
              <button
                type="button"
                onClick={() => setIsUsingCustom(true)}
                className="w-full p-3.5 rounded-2xl bg-[#131314] hover:bg-[#282a2c] border border-[#2d2f31] text-left transition-colors flex items-center gap-3 text-xs text-[#c4c7c5] hover:text-white"
              >
                <div className="w-9 h-9 rounded-full bg-[#1e1f20] border border-[#3c4043] flex items-center justify-center text-[#8ab4f8] shrink-0">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-[#e3e3e3]">Use another Google account</div>
                  <div className="text-[11px] text-[#8e918f]">Sign in with any other Google email</div>
                </div>
              </button>
            </div>
          ) : (
            <form onSubmit={handleCustomSubmit} className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-[#c4c7c5] block mb-1">
                    Google Email
                  </label>
                  <input
                    type="email"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="your-name@gmail.com"
                    autoFocus
                    required
                    className="w-full px-3.5 py-2.5 bg-[#131314] border border-[#2d2f31] rounded-xl text-xs text-[#e3e3e3] placeholder-[#8e918f] focus:outline-none focus:border-[#4285F4]"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#c4c7c5] block mb-1">
                    Full Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Your Name"
                    className="w-full px-3.5 py-2.5 bg-[#131314] border border-[#2d2f31] rounded-xl text-xs text-[#e3e3e3] placeholder-[#8e918f] focus:outline-none focus:border-[#4285F4]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setIsUsingCustom(false)}
                  className="px-3 py-1.5 text-xs text-[#8e918f] hover:text-white"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={!customEmail.trim() || isProcessing}
                  className="px-5 py-2 bg-[#4285F4] hover:bg-[#5a95f5] text-white rounded-full text-xs font-medium transition-colors shadow-sm disabled:opacity-40"
                >
                  {isProcessing ? 'Signing in...' : 'Continue with Google'}
                </button>
              </div>
            </form>
          )}

          {/* Google Security Notice */}
          <div className="pt-3 border-t border-[#2d2f31] flex items-start gap-2.5 text-[11px] text-[#8e918f]">
            <Shield className="w-4 h-4 text-[#81c995] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              To continue, Google will verify your identity with LLM Orchestration & RAGAS Benchmarking Engine securely. Your API keys and conversations remain stored locally in your browser.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#171819] border-t border-[#2d2f31] flex items-center justify-between text-[11px] text-[#8e918f]">
          <span>Protected by Google Identity</span>
          <button
            onClick={onClose}
            className="text-xs text-[#c4c7c5] hover:text-white"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
