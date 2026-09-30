/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  X,
  Sliders,
  Globe,
  Brain,
  Code2,
  Eye,
  Volume2,
  RotateCcw,
  Lock,
  Mic,
} from 'lucide-react';
import { ModelCapabilitiesConfig } from '../types';
import { DEFAULT_CAPABILITIES, SYSTEM_PRESETS } from '../data/providersAndModels';

interface CapabilitiesSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ModelCapabilitiesConfig;
  onChangeConfig: (newConfig: ModelCapabilitiesConfig) => void;
  activeModelId: string;
  onOpenSecretPrompt?: () => void;
  onOpenVoiceModal?: () => void;
}

export const CapabilitiesSettingsModal: React.FC<CapabilitiesSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onChangeConfig,
  activeModelId,
  onOpenSecretPrompt,
  onOpenVoiceModal,
}) => {
  if (!isOpen) return null;

  const updateSetting = <K extends keyof ModelCapabilitiesConfig>(
    key: K,
    val: ModelCapabilitiesConfig[K]
  ) => {
    onChangeConfig({
      ...config,
      [key]: val,
    });
  };

  const handleResetDefaults = () => {
    onChangeConfig({ ...DEFAULT_CAPABILITIES });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-[#1e1f20] border border-[#2d2f31] rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2d2f31]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#282a2c] text-[#8ab4f8]">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-[#e3e3e3]">
                  Model Settings & Audio
                </h2>
                <span className="text-xs text-[#8e918f] font-mono">
                  ({activeModelId})
                </span>
              </div>
              <p className="text-xs text-[#8e918f]">
                Configure reasoning, web search, voice synthesis, and parameters.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetDefaults}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#c4c7c5] hover:text-white bg-[#282a2c] hover:bg-[#333538] rounded-full transition-colors"
              title="Reset defaults"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[#8e918f] hover:text-[#e3e3e3] rounded-lg hover:bg-[#282a2c] transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* SECTION 1: Capabilities */}
          <div className="space-y-3">
            <div className="text-xs font-medium uppercase tracking-wider text-[#8e918f]">
              Core Capabilities
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Web Search */}
              <div
                onClick={() => updateSetting('webSearch', !config.webSearch)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-colors flex items-start justify-between gap-3 ${
                  config.webSearch
                    ? 'bg-[#282a2c] border-[#444746]'
                    : 'bg-[#131314] hover:bg-[#282a2c]/50 border-[#2d2f31]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[#1e1f20] text-[#8ab4f8] shrink-0">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-[#e3e3e3]">
                      Live Web Search
                    </div>
                    <p className="text-[11px] text-[#8e918f] mt-0.5">
                      Ground responses with real-time web sources.
                    </p>
                  </div>
                </div>
                <div
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors shrink-0 mt-0.5 ${
                    config.webSearch ? 'bg-[#8ab4f8]' : 'bg-[#3c4043]'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      config.webSearch ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>

              {/* Reasoning */}
              <div
                onClick={() => updateSetting('reasoning', !config.reasoning)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-colors flex items-start justify-between gap-3 ${
                  config.reasoning
                    ? 'bg-[#282a2c] border-[#444746]'
                    : 'bg-[#131314] hover:bg-[#282a2c]/50 border-[#2d2f31]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[#1e1f20] text-[#8ab4f8] shrink-0">
                    <Brain className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-[#e3e3e3]">
                      Step-by-Step Reasoning
                    </div>
                    <p className="text-[11px] text-[#8e918f] mt-0.5">
                      Show reasoning process and thoughts.
                    </p>
                  </div>
                </div>
                <div
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors shrink-0 mt-0.5 ${
                    config.reasoning ? 'bg-[#8ab4f8]' : 'bg-[#3c4043]'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      config.reasoning ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>

              {/* Code Sandbox */}
              <div
                onClick={() => updateSetting('codeExecution', !config.codeExecution)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-colors flex items-start justify-between gap-3 ${
                  config.codeExecution
                    ? 'bg-[#282a2c] border-[#444746]'
                    : 'bg-[#131314] hover:bg-[#282a2c]/50 border-[#2d2f31]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[#1e1f20] text-[#8ab4f8] shrink-0">
                    <Code2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-[#e3e3e3]">
                      Code Sandbox
                    </div>
                    <p className="text-[11px] text-[#8e918f] mt-0.5">
                      Interactive HTML/JS code execution preview.
                    </p>
                  </div>
                </div>
                <div
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors shrink-0 mt-0.5 ${
                    config.codeExecution ? 'bg-[#8ab4f8]' : 'bg-[#3c4043]'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      config.codeExecution ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>

              {/* Auto Read Aloud */}
              <div
                onClick={() => updateSetting('ttsEnabled', !config.ttsEnabled)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-colors flex items-start justify-between gap-3 ${
                  config.ttsEnabled
                    ? 'bg-[#282a2c] border-[#444746]'
                    : 'bg-[#131314] hover:bg-[#282a2c]/50 border-[#2d2f31]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[#1e1f20] text-[#8ab4f8] shrink-0">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-[#e3e3e3]">
                      Auto Read Aloud
                    </div>
                    <p className="text-[11px] text-[#8e918f] mt-0.5">
                      Automatically play speech for every incoming response.
                    </p>
                  </div>
                </div>
                <div
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors shrink-0 mt-0.5 ${
                    config.ttsEnabled ? 'bg-[#8ab4f8]' : 'bg-[#3c4043]'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      config.ttsEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: Changeable Voice Option */}
          <div className="p-4 rounded-xl bg-[#131314] border border-[#2d2f31] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#1e1f20] text-[#8ab4f8] shrink-0">
                <Mic className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-medium text-[#e3e3e3]">
                  Change Voice & Speech Rate
                </div>
                <div className="text-[11px] text-[#8e918f] mt-0.5">
                  Current voice: <strong className="text-white">{config.voiceConfig?.voiceName || 'System Default'}</strong> ({(config.voiceConfig?.rate || 1).toFixed(2)}x speed)
                </div>
              </div>
            </div>
            {onOpenVoiceModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenVoiceModal();
                }}
                className="px-4 py-1.5 rounded-full text-xs font-medium text-[#131314] bg-[#8ab4f8] hover:bg-[#a8c7fa] transition-colors"
              >
                Change Voice
              </button>
            )}
          </div>

          {/* SECTION 3: Parameters */}
          <div className="space-y-4 pt-4 border-t border-[#2d2f31]">
            <div className="text-xs font-medium uppercase tracking-wider text-[#8e918f]">
              Generation Parameters
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Temperature */}
              <div className="p-4 rounded-xl bg-[#131314] border border-[#2d2f31] space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-[#c4c7c5]">Temperature</span>
                  <span className="font-mono text-[#e3e3e3]">{config.temperature}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.05"
                  value={config.temperature}
                  onChange={(e) => updateSetting('temperature', parseFloat(e.target.value))}
                  className="w-full accent-[#8ab4f8]"
                />
                <div className="flex justify-between text-[10px] text-[#8e918f]">
                  <span>Precise (0.0)</span>
                  <span>Creative (2.0)</span>
                </div>
              </div>

              {/* Max Output Tokens */}
              <div className="p-4 rounded-xl bg-[#131314] border border-[#2d2f31] space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-[#c4c7c5]">Max Tokens</span>
                  <span className="font-mono text-[#e3e3e3]">{config.maxTokens}</span>
                </div>
                <input
                  type="range"
                  min="512"
                  max="16384"
                  step="512"
                  value={config.maxTokens}
                  onChange={(e) => updateSetting('maxTokens', parseInt(e.target.value))}
                  className="w-full accent-[#8ab4f8]"
                />
                <div className="flex justify-between text-[10px] text-[#8e918f]">
                  <span>512</span>
                  <span>16,384</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#2d2f31] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-[#e3e3e3] hover:bg-white text-[#131314] font-medium text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
