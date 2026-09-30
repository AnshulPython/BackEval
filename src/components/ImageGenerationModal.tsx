/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  ImageIcon,
  Sparkles,
  Download,
  Copy,
  Check,
  RefreshCw,
  ArrowRight,
  Maximize2,
  AlertCircle,
  Zap,
  CreditCard,
  ExternalLink,
} from 'lucide-react';
import { AIProviderId, ApiPlanTier } from '../types';
import { getStoredApiKeys, getProviderPlan, setProviderPlan } from '../utils/storage';

interface ImageGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageGenerated: (imageData: {
    url: string;
    prompt: string;
    aspectRatio: string;
    modelUsed: string;
  }) => void;
  activeProvider: AIProviderId;
  defaultPrompt?: string;
}

const EXAMPLE_PROMPTS = [
  'Futuristic eco-city with bioluminescent vertical gardens at dusk, photorealistic, 8k',
  'Cute fluffy red panda sitting in a cup of matcha latte, digital art, soft pastel lighting',
  'Cyberpunk retro alleyway with neon signs reflecting in rain puddles, cinematic composition',
  'Minimalist 3D isometric glass cube with a miniature desert oasis inside, octane render',
  'Astronaut floating above Earth surrounded by glowing crystalline aurora, hyperdetailed',
];

const ASPECT_RATIOS = [
  { id: '1:1', label: '1:1', desc: 'Square' },
  { id: '16:9', label: '16:9', desc: 'Landscape' },
  { id: '9:16', label: '9:16', desc: 'Portrait' },
  { id: '4:3', label: '4:3', desc: 'Standard' },
  { id: '3:4', label: '3:4', desc: 'Vertical' },
];

export const ImageGenerationModal: React.FC<ImageGenerationModalProps> = ({
  isOpen,
  onClose,
  onImageGenerated,
  activeProvider,
  defaultPrompt = '',
}) => {
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [selectedModel, setSelectedModel] = useState('gemini-3.1-flash-lite-image');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isQuotaError, setIsQuotaError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [plan, setPlan] = useState<ApiPlanTier>(() => getProviderPlan(activeProvider));

  React.useEffect(() => {
    if (defaultPrompt) {
      setPrompt(defaultPrompt);
    }
  }, [defaultPrompt]);

  React.useEffect(() => {
    setPlan(getProviderPlan(activeProvider));
  }, [activeProvider, isOpen]);

  if (!isOpen) return null;

  const handleSwitchToPayAsYouGo = () => {
    setProviderPlan(activeProvider, 'tier1');
    setPlan('tier1');
    setErrorMessage(null);
    setIsQuotaError(false);
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setErrorMessage(null);
    setIsQuotaError(false);
    setGeneratedImageUrl(null);

    const keys = getStoredApiKeys();
    const apiKey = keys[activeProvider] || '';

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          aspectRatio,
          model: selectedModel,
          provider: activeProvider,
          apiKey,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (data.isQuotaError || response.status === 429) {
          setIsQuotaError(true);
        }
        throw new Error(data.error || `Server error (${response.status})`);
      }

      setGeneratedImageUrl(data.imageUrl);

      // Notify parent to add image directly to chat session
      onImageGenerated({
        url: data.imageUrl,
        prompt: prompt.trim(),
        aspectRatio,
        modelUsed: data.modelUsed || selectedModel,
      });
    } catch (err: any) {
      console.error('Image generation failed:', err);
      const msg = err.message || 'Failed to generate image. Please check your API key or model quota.';
      setErrorMessage(msg);
      if (msg.includes('429') || msg.includes('quota') || msg.includes('limit: 0')) {
        setIsQuotaError(true);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!generatedImageUrl) return;
    const a = document.createElement('a');
    a.href = generatedImageUrl;
    a.download = `createai_image_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-[#1e1f20] border border-[#2d2f31] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2d2f31]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#282a2c] text-[#c58af9]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#e3e3e3] flex items-center gap-2">
                <span>Gemini Image Generation</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#c58af9]/20 text-[#c58af9] font-medium border border-[#c58af9]/30">
                  Visual AI
                </span>
              </h2>
              <p className="text-xs text-[#8e918f]">
                Generate stunning visuals directly using Gemini image models.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8e918f] hover:text-[#e3e3e3] rounded-lg hover:bg-[#282a2c] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Plan Tier Advisory Banner */}
          {plan === 'free' && (
            <div className="p-3.5 rounded-xl bg-[#c58af9]/10 border border-[#c58af9]/30 text-xs flex items-start justify-between gap-3 text-[#e3e3e3]">
              <div className="flex items-start gap-2.5">
                <CreditCard className="w-4 h-4 text-[#c58af9] shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-semibold text-white">
                    Image generation requires a Pay-As-You-Go / Tier 1+ account
                  </div>
                  <div className="text-[11px] text-[#c4c7c5]">
                    Google AI Studio free-tier API keys have a quota limit of 0 for image models. If your key has billing enabled, switch your plan tier to unlock image synthesis.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSwitchToPayAsYouGo}
                className="shrink-0 px-2.5 py-1.5 rounded-lg bg-[#c58af9] hover:bg-[#b072ea] text-[#131314] font-medium text-[11px] transition-colors cursor-pointer"
              >
                Set Plan to Tier 1
              </button>
            </div>
          )}

          {/* Prompt Form */}
          <form onSubmit={handleGenerate} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-[#c4c7c5] mb-1.5 flex items-center justify-between">
                <span>Visual Description / Prompt</span>
                <span className="text-[10px] text-[#8e918f]">Be descriptive with style, lighting & mood</span>
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the image you want to generate in detail..."
                rows={3}
                className="w-full px-3.5 py-2.5 bg-[#131314] border border-[#2d2f31] rounded-xl text-xs text-[#e3e3e3] placeholder-[#8e918f] focus:outline-none focus:border-[#c58af9] transition-colors resize-none"
              />
            </div>

            {/* Quick Inspiration Chips */}
            <div>
              <div className="text-[11px] text-[#8e918f] mb-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#c58af9]" />
                Prompt Inspiration:
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {EXAMPLE_PROMPTS.map((ex, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPrompt(ex)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-[#282a2c] hover:bg-[#333538] text-[#c4c7c5] hover:text-white transition-colors truncate max-w-full text-left cursor-pointer"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio & Model Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-[#8e918f] mb-1.5">
                  Aspect Ratio:
                </label>
                <div className="grid grid-cols-5 gap-1">
                  {ASPECT_RATIOS.map((ratio) => (
                    <button
                      key={ratio.id}
                      type="button"
                      onClick={() => setAspectRatio(ratio.id)}
                      className={`py-1.5 px-1 rounded-lg text-center text-xs transition-colors border cursor-pointer ${
                        aspectRatio === ratio.id
                          ? 'bg-[#282a2c] text-[#c58af9] border-[#c58af9]'
                          : 'bg-[#131314] text-[#8e918f] border-[#2d2f31] hover:text-[#c4c7c5]'
                      }`}
                    >
                      <div className="font-semibold">{ratio.label}</div>
                      <div className="text-[9px] opacity-75">{ratio.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8e918f] mb-1.5">
                  Generation Model:
                </label>
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setSelectedModel('gemini-3.1-flash-lite-image')}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors flex items-center justify-between border cursor-pointer ${
                      selectedModel === 'gemini-3.1-flash-lite-image'
                        ? 'bg-[#282a2c] text-white border-[#c58af9]'
                        : 'bg-[#131314] text-[#8e918f] border-[#2d2f31]'
                    }`}
                  >
                    <div>
                      <div className="font-medium text-[#e3e3e3]">Flash Lite Image</div>
                      <div className="text-[10px] text-[#8e918f]">Fast & high efficiency</div>
                    </div>
                    {selectedModel === 'gemini-3.1-flash-lite-image' && (
                      <Check className="w-3.5 h-3.5 text-[#c58af9]" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedModel('gemini-3.1-flash-image')}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors flex items-center justify-between border cursor-pointer ${
                      selectedModel === 'gemini-3.1-flash-image'
                        ? 'bg-[#282a2c] text-white border-[#c58af9]'
                        : 'bg-[#131314] text-[#8e918f] border-[#2d2f31]'
                    }`}
                  >
                    <div>
                      <div className="font-medium text-[#e3e3e3]">Flash Image (HQ)</div>
                      <div className="text-[10px] text-[#8e918f]">High quality details & textures</div>
                    </div>
                    {selectedModel === 'gemini-3.1-flash-image' && (
                      <Check className="w-3.5 h-3.5 text-[#c58af9]" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Error Message with Quota Resolution */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-[#f28b82]/10 border border-[#f28b82]/30 text-xs text-[#f28b82] space-y-2 animate-in fade-in">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="leading-relaxed font-medium">{errorMessage}</div>
                </div>

                {isQuotaError && (
                  <div className="pl-6 pt-1 text-[11px] text-[#e3e3e3] border-t border-[#f28b82]/20 flex flex-wrap items-center justify-between gap-2">
                    <span>
                      Need image generation? Set your API plan to Tier 1+ or provide a billing-enabled key.
                    </span>
                    <button
                      type="button"
                      onClick={handleSwitchToPayAsYouGo}
                      className="px-2.5 py-1 rounded bg-[#8ab4f8] text-[#131314] font-medium hover:bg-[#aecbfa] transition-colors cursor-pointer"
                    >
                      Update Account Plan to Tier 1
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={!prompt.trim() || isGenerating}
                className="w-full py-2.5 rounded-xl font-medium text-xs text-[#131314] bg-linear-to-r from-[#c58af9] to-[#8ab4f8] hover:opacity-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Synthesizing Image with Gemini...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Artwork</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Generated Image Result Card */}
          {generatedImageUrl && (
            <div className="mt-4 p-3 rounded-2xl bg-[#131314] border border-[#2d2f31] space-y-3 animate-in fade-in">
              <div className="relative rounded-xl overflow-hidden bg-black flex items-center justify-center group">
                <img
                  src={generatedImageUrl}
                  alt={prompt}
                  className="max-h-[380px] w-auto object-contain rounded-lg shadow-lg"
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyPrompt}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#282a2c] hover:bg-[#333538] text-[#c4c7c5] hover:text-white transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#81c995]" />
                        <span>Prompt Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Prompt</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#282a2c] hover:bg-[#333538] text-[#c4c7c5] hover:text-white transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PNG</span>
                  </button>
                </div>

                <button
                  onClick={onClose}
                  className="px-4 py-1.5 rounded-lg bg-[#c58af9] hover:bg-[#b072ea] text-[#131314] font-medium transition-colors cursor-pointer"
                >
                  Insert & Continue Chat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
