/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Check,
  Brain,
  Globe,
  Code2,
  Layers,
  RefreshCw,
  Key,
  ShieldCheck,
  Zap,
  Crown,
  Lock,
  Sparkles,
  Filter,
  AlertCircle,
  ImageIcon,
} from 'lucide-react';
import { AIModel, AIProviderId, CapabilityType, ApiPlanTier } from '../types';
import { AI_PROVIDERS, PLAN_TIERS } from '../data/providersAndModels';
import {
  getProviderPlan,
  setProviderPlan,
  getFilterOnlyAvailableModels,
  setFilterOnlyAvailableModels,
} from '../utils/storage';

interface ModelSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: AIProviderId;
  models: AIModel[];
  activeModelId: string;
  onSelectModel: (modelId: string) => void;
  onOpenProviderModal: () => void;
  onRefreshAccountModels?: () => void;
  isRefreshing?: boolean;
  accountChecked?: boolean;
  totalAccountModels?: number;
  onPlanChanged?: (plan: ApiPlanTier) => void;
}

export const ModelSelectorModal: React.FC<ModelSelectorModalProps> = ({
  isOpen,
  onClose,
  provider,
  models,
  activeModelId,
  onSelectModel,
  onOpenProviderModal,
  onRefreshAccountModels,
  isRefreshing = false,
  onPlanChanged,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCap, setFilterCap] = useState<CapabilityType | 'all'>('all');
  const [currentPlan, setCurrentPlanState] = useState<ApiPlanTier>('free');
  const [onlyAvailable, setOnlyAvailableState] = useState<boolean>(true);
  const [planUpgradePrompt, setPlanUpgradePrompt] = useState<{
    model: AIModel;
    requiredPlan: ApiPlanTier;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const plan = getProviderPlan(provider);
      setCurrentPlanState(plan);
      setOnlyAvailableState(getFilterOnlyAvailableModels());
      setPlanUpgradePrompt(null);
    }
  }, [isOpen, provider]);

  if (!isOpen) return null;

  const currentProviderInfo =
    AI_PROVIDERS.find((p) => p.id === provider) || AI_PROVIDERS[0];

  const handlePlanSelect = (plan: ApiPlanTier) => {
    setCurrentPlanState(plan);
    setProviderPlan(provider, plan);
    onPlanChanged?.(plan);
    setPlanUpgradePrompt(null);
  };

  const handleToggleOnlyAvailable = (enabled: boolean) => {
    setOnlyAvailableState(enabled);
    setFilterOnlyAvailableModels(enabled);
  };

  const isModelAvailableForPlan = (model: AIModel, plan: ApiPlanTier): boolean => {
    if (model.supportedPlans && Array.isArray(model.supportedPlans)) {
      return model.supportedPlans.includes(plan);
    }
    if (model.minPlanTier) {
      if (model.minPlanTier === 'free') return true;
      if (model.minPlanTier === 'tier1') return plan === 'tier1' || plan === 'pro' || plan === 'enterprise';
      if (model.minPlanTier === 'pro') return plan === 'pro' || plan === 'enterprise';
      if (model.minPlanTier === 'enterprise') return plan === 'enterprise';
    }
    if (model.isPaid) {
      return plan !== 'free';
    }
    return true;
  };

  const filteredModels = models.filter((model) => {
    const matchesSearch =
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (model.description && model.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCap =
      filterCap === 'all' || (model.capabilities && model.capabilities.includes(filterCap));

    if (onlyAvailable) {
      const available = isModelAvailableForPlan(model, currentPlan);
      return matchesSearch && matchesCap && available;
    }

    return matchesSearch && matchesCap;
  });

  const availableCount = models.filter((m) => isModelAvailableForPlan(m, currentPlan)).length;
  const currentPlanInfo = PLAN_TIERS.find((p) => p.id === currentPlan) || PLAN_TIERS[0];

  const handleModelCardClick = (model: AIModel) => {
    const isAvailable = isModelAvailableForPlan(model, currentPlan);
    if (!isAvailable) {
      const requiredPlan: ApiPlanTier = model.minPlanTier || 'tier1';
      setPlanUpgradePrompt({ model, requiredPlan });
      return;
    }
    onSelectModel(model.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#1e1f20] border border-[#2d2f31] rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#2d2f31]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#282a2c] text-[#8ab4f8]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-[#e3e3e3]">
                  Models ({currentProviderInfo.name})
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#282a2c] text-[#8ab4f8] border border-[#3c4043]">
                  {currentPlanInfo.label}
                </span>
              </div>
              <p className="text-xs text-[#8e918f]">
                Select the AI model for your conversations. Filtered by your active API plan.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onRefreshAccountModels && (
              <button
                onClick={onRefreshAccountModels}
                disabled={isRefreshing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#282a2c] hover:bg-[#333538] text-xs text-[#c4c7c5] hover:text-white transition-colors cursor-pointer"
                title="Re-check models directly on the provider API"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#8ab4f8]' : ''}`}
                />
                <span className="hidden sm:inline">
                  {isRefreshing ? 'Checking...' : 'Refresh'}
                </span>
              </button>
            )}
            <button
              onClick={() => {
                onClose();
                onOpenProviderModal();
              }}
              className="text-xs text-[#c4c7c5] hover:text-white px-3 py-1.5 rounded-full bg-[#282a2c] hover:bg-[#333538] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Key className="w-3 h-3" />
              API Key
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[#8e918f] hover:text-[#e3e3e3] rounded-lg hover:bg-[#282a2c] transition-colors ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* API Account Plan Selector Bar */}
        <div className="px-5 sm:px-6 py-3 bg-[#18191a] border-b border-[#2d2f31] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-xs font-medium text-[#8e918f] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#8ab4f8]" />
              Account Plan:
            </span>
            <div className="flex items-center gap-1.5 bg-[#1e1f20] p-1 rounded-xl border border-[#2d2f31]">
              {PLAN_TIERS.map((tier) => {
                const isActive = currentPlan === tier.id;
                return (
                  <button
                    key={tier.id}
                    onClick={() => handlePlanSelect(tier.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-[#282a2c] text-white shadow-xs border border-[#444746]'
                        : 'text-[#8e918f] hover:text-[#c4c7c5]'
                    }`}
                  >
                    {tier.id === 'free' && (
                      <span className="w-2 h-2 rounded-full bg-[#81c995]" />
                    )}
                    {tier.id === 'tier1' && (
                      <Zap className="w-3 h-3 text-[#8ab4f8]" />
                    )}
                    {tier.id === 'pro' && (
                      <Crown className="w-3 h-3 text-[#c58af9]" />
                    )}
                    <span>{tier.shortLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Toggle: Only show available models for this plan */}
          <div className="flex items-center justify-between sm:justify-end gap-3 pt-1 md:pt-0">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={(e) => handleToggleOnlyAvailable(e.target.checked)}
                className="w-3.5 h-3.5 accent-[#8ab4f8] rounded cursor-pointer"
              />
              <span className="text-xs text-[#c4c7c5] font-medium">
                Only show available models for this plan
              </span>
            </label>
            <span className="text-[11px] font-mono text-[#8ab4f8] bg-[#282a2c] px-2 py-0.5 rounded-full border border-[#3c4043]">
              {availableCount} / {models.length} available
            </span>
          </div>
        </div>

        {/* Upgrade Plan Prompt Notification (when user clicked an unavailable model) */}
        {planUpgradePrompt && (
          <div className="mx-5 sm:mx-6 mt-3 p-3 rounded-xl bg-[#282a2c] border border-[#8ab4f8]/40 flex items-center justify-between gap-3 text-xs animate-in fade-in">
            <div className="flex items-center gap-2 text-[#c4c7c5]">
              <AlertCircle className="w-4 h-4 text-[#8ab4f8] shrink-0" />
              <span>
                <strong>{planUpgradePrompt.model.name}</strong> requires a{' '}
                <strong className="text-[#8ab4f8]">
                  {planUpgradePrompt.requiredPlan === 'tier1' ? 'Pay-As-You-Go (Tier 1)' : 'Pro / Enterprise'}
                </strong>{' '}
                plan with billing enabled.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  handlePlanSelect(planUpgradePrompt.requiredPlan);
                  onSelectModel(planUpgradePrompt.model.id);
                  onClose();
                }}
                className="px-3 py-1 rounded-full bg-[#8ab4f8] hover:bg-[#aecbfa] text-[#131314] font-medium transition-colors cursor-pointer"
              >
                Switch Plan & Select
              </button>
              <button
                type="button"
                onClick={() => setPlanUpgradePrompt(null)}
                className="p-1 text-[#8e918f] hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="px-5 sm:px-6 py-3 border-b border-[#2d2f31] bg-[#1e1f20] flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#8e918f] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search models..."
              className="w-full pl-9 pr-3 py-1.5 bg-[#131314] border border-[#2d2f31] rounded-full text-xs text-[#e3e3e3] placeholder-[#8e918f] focus:outline-none focus:border-[#444746]"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <button
              onClick={() => setFilterCap('all')}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                filterCap === 'all'
                  ? 'bg-[#e3e3e3] text-[#131314]'
                  : 'bg-[#282a2c] text-[#c4c7c5] hover:text-white'
              }`}
            >
              All ({filteredModels.length})
            </button>
            <button
              onClick={() => setFilterCap('imageGeneration')}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer ${
                filterCap === 'imageGeneration'
                  ? 'bg-[#e3e3e3] text-[#131314]'
                  : 'bg-[#282a2c] text-[#c4c7c5] hover:text-white'
              }`}
            >
              <ImageIcon className="w-3 h-3 text-[#c58af9]" />
              Image Gen
            </button>
            <button
              onClick={() => setFilterCap('reasoning')}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer ${
                filterCap === 'reasoning'
                  ? 'bg-[#e3e3e3] text-[#131314]'
                  : 'bg-[#282a2c] text-[#c4c7c5] hover:text-white'
              }`}
            >
              <Brain className="w-3 h-3 text-[#8ab4f8]" />
              Reasoning
            </button>
            <button
              onClick={() => setFilterCap('webSearch')}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer ${
                filterCap === 'webSearch'
                  ? 'bg-[#e3e3e3] text-[#131314]'
                  : 'bg-[#282a2c] text-[#c4c7c5] hover:text-white'
              }`}
            >
              <Globe className="w-3 h-3 text-[#81c995]" />
              Search
            </button>
            <button
              onClick={() => setFilterCap('codeExecution')}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer ${
                filterCap === 'codeExecution'
                  ? 'bg-[#e3e3e3] text-[#131314]'
                  : 'bg-[#282a2c] text-[#c4c7c5] hover:text-white'
              }`}
            >
              <Code2 className="w-3 h-3 text-[#f28b82]" />
              Code
            </button>
          </div>
        </div>

        {/* Model Cards Grid */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredModels.map((model, idx) => {
            const isSelected = activeModelId === model.id;
            const isAvailable = isModelAvailableForPlan(model, currentPlan);
            const isImageModel = model.capabilities?.includes('imageGeneration');

            return (
              <div
                key={`${model.id}_${idx}`}
                onClick={() => handleModelCardClick(model)}
                className={`p-4 rounded-2xl border text-left cursor-pointer transition-all flex flex-col justify-between group relative ${
                  isSelected
                    ? 'bg-[#282a2c] border-[#8ab4f8] shadow-md'
                    : isAvailable
                    ? 'bg-[#1e1f20] hover:bg-[#282a2c]/70 border-[#2d2f31]'
                    : 'bg-[#18191a] border-[#2d2f31]/60 opacity-60 hover:opacity-90'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-semibold text-[#e3e3e3]">
                        {model.name}
                      </span>
                      {model.recommended && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#81c995]/15 text-[#81c995] border border-[#81c995]/30">
                          Recommended
                        </span>
                      )}
                      {isImageModel && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#c58af9]/15 text-[#c58af9] border border-[#c58af9]/30 flex items-center gap-1">
                          <ImageIcon className="w-2.5 h-2.5" />
                          Image Gen
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isSelected && (
                        <span className="text-xs font-medium text-[#8ab4f8] flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          Selected
                        </span>
                      )}
                      {!isAvailable && (
                        <span className="text-[11px] font-medium text-[#f28b82] bg-[#f28b82]/10 border border-[#f28b82]/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          Requires {model.minPlanTier === 'pro' ? 'Pro' : 'Tier 1'}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-[#8e918f] line-clamp-2 leading-relaxed mb-3">
                    {model.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#2d2f31] flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[#c4c7c5]">{model.contextWindow}</span>
                    <span className="text-[#8e918f]">•</span>
                    <span className="text-[#8ab4f8] font-medium">{model.speed}</span>
                  </div>

                  {/* Plan Tier Badge on card */}
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      model.minPlanTier === 'pro'
                        ? 'bg-[#c58af9]/15 text-[#c58af9] border border-[#c58af9]/30'
                        : model.minPlanTier === 'tier1' || model.isPaid
                        ? 'bg-[#8ab4f8]/15 text-[#8ab4f8] border border-[#8ab4f8]/30'
                        : 'bg-[#81c995]/15 text-[#81c995] border border-[#81c995]/30'
                    }`}
                  >
                    {model.minPlanTier === 'pro'
                      ? 'Pro Plan'
                      : model.minPlanTier === 'tier1' || model.isPaid
                      ? 'Pay-As-You-Go'
                      : 'Free Plan'}
                  </span>
                </div>
              </div>
            );
          })}

          {filteredModels.length === 0 && (
            <div className="col-span-2 py-12 text-center text-[#8e918f] space-y-2">
              <p className="text-sm font-medium text-[#e3e3e3]">
                No models match your current plan or search filter.
              </p>
              <p className="text-xs text-[#8e918f]">
                {onlyAvailable
                  ? `Try turning off "Only show available models for this plan" or switch your plan to Pay-As-You-Go.`
                  : 'Try clearing your search query.'}
              </p>
              {onlyAvailable && (
                <button
                  type="button"
                  onClick={() => handleToggleOnlyAvailable(false)}
                  className="mt-2 px-4 py-1.5 rounded-full bg-[#282a2c] hover:bg-[#333538] text-xs text-[#8ab4f8] transition-colors cursor-pointer"
                >
                  Show all models
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 bg-[#18191a] border-t border-[#2d2f31] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#8e918f]">
          <div className="flex items-center gap-2">
            <span>Active Model:</span>
            <strong className="text-[#e3e3e3] font-mono">{activeModelId}</strong>
            <span className="text-[11px] text-[#8ab4f8]">({currentPlanInfo.label})</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-[#e3e3e3] hover:bg-white text-[#131314] font-medium transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
