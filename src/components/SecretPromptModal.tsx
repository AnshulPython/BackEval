/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Lock,
  Eye,
  EyeOff,
  Check,
  Copy,
  Trash2,
  X,
  ArrowRight,
} from 'lucide-react';
import { SECRET_PROMPT_PRESETS, SecretPromptPreset } from '../data/providersAndModels';

interface SecretPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  secretPrompt: string;
  isEnabled: boolean;
  onSave: (prompt: string, enabled: boolean) => void;
}

export const SecretPromptModal: React.FC<SecretPromptModalProps> = ({
  isOpen,
  onClose,
  secretPrompt: initialPrompt,
  isEnabled: initialEnabled,
  onSave,
}) => {
  const [prompt, setPrompt] = useState(initialPrompt || '');
  const [enabled, setEnabled] = useState(initialEnabled ?? false);
  const [isObscured, setIsObscured] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: SecretPromptPreset) => {
    setPrompt(preset.directive);
    setEnabled(true);
    setActivePresetId(preset.id);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setPrompt('');
    setEnabled(false);
    setActivePresetId(null);
  };

  const handleSave = () => {
    onSave(prompt.trim(), enabled && Boolean(prompt.trim()));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl max-h-[92vh] bg-[#1e1f20] border border-[#2d2f31] rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2d2f31]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#282a2c] text-[#8ab4f8]">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#e3e3e3]">
                System Directive
              </h2>
              <p className="text-xs text-[#8e918f]">
                Set instructions that guide all model responses in this session.
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
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="p-4 rounded-xl bg-[#131314] border border-[#2d2f31] flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-[#e3e3e3]">
                Enable Directive
              </div>
              <div className="text-[11px] text-[#8e918f]">
                When active, these instructions take priority for every message.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setEnabled(!enabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                enabled ? 'bg-[#8ab4f8]' : 'bg-[#3c4043]'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-[#c4c7c5]">
                Directive Instructions:
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsObscured(!isObscured)}
                  className="flex items-center gap-1 text-[11px] text-[#8e918f] hover:text-[#e3e3e3] px-2 py-0.5 rounded hover:bg-[#282a2c] transition-colors"
                >
                  {isObscured ? (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>Reveal</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Hide</span>
                    </>
                  )}
                </button>
                {prompt && (
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-[11px] text-[#8e918f] hover:text-[#e3e3e3] px-2 py-0.5 rounded hover:bg-[#282a2c] transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#81c995]" />
                        <span className="text-[#81c995]">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                )}
                {prompt && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="flex items-center gap-1 text-[11px] text-[#8e918f] hover:text-[#f28b82] px-2 py-0.5 rounded hover:bg-[#282a2c] transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                )}
              </div>
            </div>
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  if (e.target.value.trim() && !enabled) {
                    setEnabled(true);
                  }
                }}
                rows={5}
                placeholder="e.g. Always respond in concise, production-ready code with step-by-step explanations..."
                className={`w-full p-3.5 rounded-xl bg-[#131314] border border-[#2d2f31] text-xs font-mono transition-colors leading-relaxed resize-y focus:outline-none focus:border-[#444746] text-[#e3e3e3] ${
                  isObscured ? 'blur-xs select-none' : ''
                }`}
              />
              <div className="absolute right-3 bottom-3 text-[10px] text-[#8e918f] font-mono">
                {prompt.length} chars
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <div className="text-xs font-medium text-[#c4c7c5]">
              Templates:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SECRET_PROMPT_PRESETS.map((preset) => {
                const isSelected = activePresetId === preset.id || prompt === preset.directive;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleApplyPreset(preset)}
                    className={`p-3 rounded-xl border text-left transition-colors flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#282a2c] border-[#8ab4f8]'
                        : 'bg-[#1e1f20] hover:bg-[#282a2c]/60 border-[#2d2f31]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-medium text-[#e3e3e3]">
                          {preset.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8e918f] line-clamp-2 leading-relaxed">
                        {preset.description}
                      </p>
                    </div>
                    <div className="text-[10px] text-[#8ab4f8] mt-2 font-medium flex items-center gap-1">
                      <span>Apply</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#2d2f31]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-[#c4c7c5] hover:text-white bg-[#282a2c] hover:bg-[#333538] rounded-full transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-xs font-medium text-[#131314] bg-[#8ab4f8] hover:bg-[#a8c7fa] rounded-full transition-colors"
          >
            Save Directive
          </button>
        </div>
      </div>
    </div>
  );
};
