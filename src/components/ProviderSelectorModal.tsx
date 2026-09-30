/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Key,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  Eye,
  EyeOff,
  Trash2,
  ArrowRight,
  Server,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AIProviderId, StoredAPIKeys } from '../types';
import { AI_PROVIDERS } from '../data/providersAndModels';
import {
  getStoredApiKeys,
  saveStoredApiKey,
  clearStoredApiKey,
  setActiveProvider,
} from '../utils/storage';

interface ProviderSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProvider: AIProviderId;
  onProviderChanged: (providerId: AIProviderId) => void;
  hasGeminiEnvKey?: boolean;
}

export const ProviderSelectorModal: React.FC<ProviderSelectorModalProps> = ({
  isOpen,
  onClose,
  activeProvider,
  onProviderChanged,
  hasGeminiEnvKey = false,
}) => {
  const [selectedProvider, setSelectedProvider] = useState<AIProviderId>(activeProvider);
  const [storedKeys, setStoredKeys] = useState<StoredAPIKeys>(getStoredApiKeys());
  const [keyInput, setKeyInput] = useState<string>(storedKeys[activeProvider] || '');
  const [customBaseUrl, setCustomBaseUrl] = useState<string>(
    storedKeys.customBaseUrl || 'http://localhost:11434/v1'
  );
  const [showKey, setShowKey] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [validationStatus, setValidationStatus] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  if (!isOpen) return null;

  const currentProviderInfo =
    AI_PROVIDERS.find((p) => p.id === selectedProvider) || AI_PROVIDERS[0];

  const handleSelectProvider = (provId: AIProviderId) => {
    setSelectedProvider(provId);
    setKeyInput(storedKeys[provId] || '');
    setValidationStatus(null);
  };

  const handleValidateAndConnect = async () => {
    setIsValidating(true);
    setValidationStatus(null);
    try {
      const response = await fetch('/api/validate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider,
          apiKey: keyInput,
          customBaseUrl: selectedProvider === 'custom' ? customBaseUrl : undefined,
        }),
      });
      const data = await response.json();
      if (response.ok && data.valid) {
        saveStoredApiKey(selectedProvider, keyInput, customBaseUrl);
        const updated = getStoredApiKeys();
        setStoredKeys(updated);
        setActiveProvider(selectedProvider);
        onProviderChanged(selectedProvider);
        try {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 },
          });
        } catch {}
        setValidationStatus({
          success: true,
          message: data.message || `Successfully connected to ${currentProviderInfo.name}!`,
        });
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setValidationStatus({
          success: false,
          message: data.error || 'Failed to validate API key. Please check your credentials.',
        });
      }
    } catch (err: any) {
      setValidationStatus({
        success: false,
        message: err.message || 'Network error while validating key.',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleUseBuiltInGemini = async () => {
    setSelectedProvider('gemini');
    setKeyInput('');
    setIsValidating(true);
    setValidationStatus(null);
    try {
      const response = await fetch('/api/validate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'gemini', apiKey: '' }),
      });
      const data = await response.json();
      if (response.ok && data.valid) {
        saveStoredApiKey('gemini', '');
        setActiveProvider('gemini');
        onProviderChanged('gemini');
        try {
          confetti({ particleCount: 70, spread: 50, origin: { y: 0.6 } });
        } catch {}
        setValidationStatus({
          success: true,
          message: 'Connected using Built-In Google Gemini Environment!',
        });
        setTimeout(() => onClose(), 1000);
      } else {
        setValidationStatus({
          success: false,
          message: data.error || 'Could not verify server Gemini key.',
        });
      }
    } catch (err: any) {
      setValidationStatus({ success: false, message: err.message });
    } finally {
      setIsValidating(false);
    }
  };

  const handleClearKey = () => {
    clearStoredApiKey(selectedProvider);
    setStoredKeys(getStoredApiKeys());
    setKeyInput('');
    setValidationStatus({
      success: true,
      message: `Cleared saved key for ${currentProviderInfo.name}`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#1e1f20] border border-[#2d2f31] rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2d2f31]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#282a2c] text-[#8ab4f8]">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#e3e3e3] flex items-center gap-2">
                Connect AI Provider
              </h2>
              <p className="text-xs text-[#8e918f]">
                Provide your API key to check your account and retrieve all available models.
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
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-[#2d2f31]">
          {/* Provider List */}
          <div className="md:col-span-5 p-4 space-y-1.5 bg-[#1e1f20] overflow-y-auto max-h-[60vh] md:max-h-none">
            <div className="px-2 py-1 text-[11px] font-medium uppercase tracking-wider text-[#8e918f]">
              Providers
            </div>
            {AI_PROVIDERS.map((provider) => {
              const isSelected = selectedProvider === provider.id;
              const hasSaved = Boolean(storedKeys[provider.id] || (provider.id === 'gemini' && hasGeminiEnvKey));
              const isActive = activeProvider === provider.id;

              return (
                <button
                  key={provider.id}
                  onClick={() => handleSelectProvider(provider.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-colors flex items-center justify-between group ${
                    isSelected
                      ? 'bg-[#282a2c] border-[#444746] text-white'
                      : 'bg-transparent hover:bg-[#282a2c]/50 border-transparent text-[#c4c7c5]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: provider.color }}
                    />
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-[#e3e3e3] truncate">
                          {provider.name}
                        </span>
                        {isActive && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#131314] text-[#81c995] font-medium">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#8e918f] truncate">
                        {provider.badge}
                      </div>
                    </div>
                  </div>
                  {hasSaved && (
                    <div className="flex items-center gap-1 text-[11px] font-medium text-[#81c995] shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Saved</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Configuration */}
          <div className="md:col-span-7 p-6 space-y-6 flex flex-col justify-between bg-[#1e1f20]">
            <div className="space-y-5">
              <div className="flex items-start justify-between pb-3 border-b border-[#2d2f31]">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-[#e3e3e3]">
                      {currentProviderInfo.name}
                    </h3>
                  </div>
                  <p className="text-xs text-[#8e918f] mt-1">
                    {currentProviderInfo.tagline}
                  </p>
                </div>
                <a
                  href={currentProviderInfo.keyHelpUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-[#8ab4f8] hover:underline transition-colors shrink-0"
                >
                  <span>Get API Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {selectedProvider === 'gemini' && hasGeminiEnvKey && (
                <div className="p-3.5 rounded-xl bg-[#131314] border border-[#2d2f31] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-[#8ab4f8] shrink-0" />
                    <div>
                      <div className="text-xs font-medium text-[#e3e3e3]">
                        AI Studio Key Detected
                      </div>
                      <div className="text-[11px] text-[#8e918f]">
                        Use the pre-configured Gemini environment.
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleUseBuiltInGemini}
                    disabled={isValidating}
                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#8ab4f8] hover:bg-[#a8c7fa] text-[#131314] transition-colors shrink-0"
                  >
                    Use Built-in
                  </button>
                </div>
              )}

              {selectedProvider === 'custom' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#c4c7c5] flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-[#8e918f]" />
                    Custom Base URL:
                  </label>
                  <input
                    type="text"
                    value={customBaseUrl}
                    onChange={(e) => setCustomBaseUrl(e.target.value)}
                    placeholder="http://localhost:11434/v1"
                    className="w-full px-3.5 py-2.5 bg-[#131314] border border-[#2d2f31] rounded-xl text-xs text-white placeholder-[#8e918f] focus:outline-none focus:border-[#444746] font-mono"
                  />
                  <p className="text-[11px] text-[#8e918f]">
                    Supports Ollama, LM Studio, vLLM, LocalAI or custom proxies.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-medium text-[#c4c7c5] flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-[#8e918f]" />
                    {currentProviderInfo.name} API Key:
                  </span>
                  {storedKeys[selectedProvider] && (
                    <button
                      onClick={handleClearKey}
                      className="text-[11px] text-[#f28b82] hover:underline flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remove Key
                    </button>
                  )}
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={keyInput}
                    onChange={(e) => {
                      setKeyInput(e.target.value);
                      setValidationStatus(null);
                    }}
                    placeholder={
                      selectedProvider === 'gemini' && hasGeminiEnvKey
                        ? 'Leave empty for built-in or enter custom key...'
                        : `Enter your ${currentProviderInfo.name} API key...`
                    }
                    className="w-full pl-3.5 pr-20 py-2.5 bg-[#131314] border border-[#2d2f31] rounded-xl text-xs text-white placeholder-[#8e918f] focus:outline-none focus:border-[#444746] font-mono"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="p-1.5 text-[#8e918f] hover:text-[#e3e3e3] transition-colors"
                      title={showKey ? 'Hide key' : 'Show key'}
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#8e918f] pt-0.5">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#81c995]" />
                    Stored locally in your browser session.
                  </span>
                </div>
              </div>

              {validationStatus && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 animate-in fade-in ${
                    validationStatus.success
                      ? 'bg-[#1e1f20] border-[#81c995]/40 text-[#81c995]'
                      : 'bg-[#1e1f20] border-[#f28b82]/40 text-[#f28b82]'
                  }`}
                >
                  {validationStatus.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-[#81c995] mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-[#f28b82] mt-0.5" />
                  )}
                  <div className="flex-1">{validationStatus.message}</div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#2d2f31]">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-[#c4c7c5] hover:text-white bg-[#282a2c] hover:bg-[#333538] rounded-full transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleValidateAndConnect}
                disabled={isValidating || (!keyInput.trim() && selectedProvider !== 'gemini' && selectedProvider !== 'custom')}
                className="flex items-center gap-2 px-5 py-2 text-xs font-medium text-[#131314] bg-[#8ab4f8] hover:bg-[#a8c7fa] disabled:opacity-40 disabled:cursor-not-allowed rounded-full transition-colors"
              >
                {isValidating ? (
                  <>
                    <div className="w-3 h-3 border-2 border-[#131314] border-t-transparent rounded-full animate-spin" />
                    <span>Validating...</span>
                  </>
                ) : (
                  <>
                    <span>Connect & Load Models</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
