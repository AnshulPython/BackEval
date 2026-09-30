/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Globe,
  Brain,
  Code2,
  Eye,
  Volume2,
  Sliders,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { AIModel, ModelCapabilitiesConfig } from '../types';

interface CapabilitiesBarProps {
  config: ModelCapabilitiesConfig;
  onChangeConfig: (newConfig: ModelCapabilitiesConfig) => void;
  onOpenSettings: () => void;
  activeModelId?: string;
  models?: AIModel[];
  onSelectModel?: (modelId: string) => void;
  onOpenModelModal?: () => void;
  onOpenSecretPromptModal?: () => void;
  onOpenRagasModal?: () => void;
  onOpenVoiceModal?: () => void;
}

export const CapabilitiesBar: React.FC<CapabilitiesBarProps> = ({
  config,
  onChangeConfig,
  onOpenSettings,
  onOpenSecretPromptModal,
  onOpenRagasModal,
  onOpenVoiceModal,
}) => {
  const toggle = (key: keyof ModelCapabilitiesConfig) => {
    onChangeConfig({
      ...config,
      [key]: !config[key],
    });
  };

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto py-1 text-xs select-none scrollbar-none">
      {/* Web Search */}
      <button
        type="button"
        onClick={() => toggle('webSearch')}
        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 ${
          config.webSearch
            ? 'bg-[#282a2c] text-[#8ab4f8] border border-[#3c4043]'
            : 'text-[#8e918f] hover:text-[#c4c7c5] hover:bg-[#282a2c]/50'
        }`}
        title="Toggle web search grounding"
      >
        <Globe className="w-3.5 h-3.5" />
        <span>Search</span>
      </button>

      {/* Deep Thinking / Reasoning */}
      <button
        type="button"
        onClick={() => toggle('reasoning')}
        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 ${
          config.reasoning
            ? 'bg-[#282a2c] text-[#8ab4f8] border border-[#3c4043]'
            : 'text-[#8e918f] hover:text-[#c4c7c5] hover:bg-[#282a2c]/50'
        }`}
        title="Toggle step-by-step thinking & reasoning traces"
      >
        <Brain className="w-3.5 h-3.5" />
        <span>Thinking</span>
      </button>

      {/* Code Sandbox */}
      <button
        type="button"
        onClick={() => toggle('codeExecution')}
        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 ${
          config.codeExecution
            ? 'bg-[#282a2c] text-[#8ab4f8] border border-[#3c4043]'
            : 'text-[#8e918f] hover:text-[#c4c7c5] hover:bg-[#282a2c]/50'
        }`}
        title="Toggle code execution & preview"
      >
        <Code2 className="w-3.5 h-3.5" />
        <span>Code</span>
      </button>

      {/* Vision */}
      <button
        type="button"
        onClick={() => toggle('visionEnabled')}
        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 ${
          config.visionEnabled
            ? 'bg-[#282a2c] text-[#8ab4f8] border border-[#3c4043]'
            : 'text-[#8e918f] hover:text-[#c4c7c5] hover:bg-[#282a2c]/50'
        }`}
        title="Toggle multimodal vision"
      >
        <Eye className="w-3.5 h-3.5" />
        <span>Vision</span>
      </button>

      {/* Speech / Changeable Voice */}
      {onOpenVoiceModal ? (
        <button
          type="button"
          onClick={onOpenVoiceModal}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-[#8ab4f8] hover:bg-[#282a2c] transition-colors shrink-0"
          title="Configure response audio voice"
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>Voice: {config.voiceConfig?.voiceName ? config.voiceConfig.voiceName.split(' ')[0] : 'Auto'}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => toggle('ttsEnabled')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 ${
            config.ttsEnabled
              ? 'bg-[#282a2c] text-[#8ab4f8] border border-[#3c4043]'
              : 'text-[#8e918f] hover:text-[#c4c7c5] hover:bg-[#282a2c]/50'
          }`}
          title="Toggle automatic text-to-speech reading"
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>Read Aloud</span>
        </button>
      )}

      {/* Secret Prompt / Directive */}
      {onOpenSecretPromptModal && (
        <button
          type="button"
          onClick={onOpenSecretPromptModal}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 ${
            config.secretPromptEnabled && config.secretPrompt?.trim()
              ? 'bg-[#282a2c] text-[#8ab4f8] border border-[#3c4043]'
              : 'text-[#8e918f] hover:text-[#c4c7c5] hover:bg-[#282a2c]/50'
          }`}
          title="Configure System Directives"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Directive</span>
        </button>
      )}

      {/* Ragas Evaluation Quick Tool */}
      {onOpenRagasModal && (
        <button
          type="button"
          onClick={onOpenRagasModal}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-[#8e918f] hover:text-[#c4c7c5] hover:bg-[#282a2c]/50 transition-colors shrink-0"
          title="Open RAGAS Quality Evaluation & Benchmarking"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Evaluation</span>
        </button>
      )}

      {/* Settings Dialog */}
      <button
        type="button"
        onClick={onOpenSettings}
        className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-[#8e918f] hover:text-[#c4c7c5] hover:bg-[#282a2c]/50 transition-colors shrink-0 ml-auto"
        title="Open detailed capabilities settings"
      >
        <Sliders className="w-3.5 h-3.5" />
        <span>Configure</span>
      </button>
    </div>
  );
};
