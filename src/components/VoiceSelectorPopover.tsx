/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Volume2,
  Check,
  Play,
  Square,
  RotateCcw,
  Sparkles,
  Sliders,
  X,
  Gauge,
  Music2,
  Mic,
  Search,
  Globe2,
  Languages,
} from 'lucide-react';
import { VoiceConfig } from '../types';
import {
  getAvailableVoices,
  getStoredVoiceConfig,
  saveStoredVoiceConfig,
  speakMessage,
  stopSpeaking,
  getLanguageSamplePhrase,
  getLanguageDisplayName,
} from '../utils/speech';

interface VoiceSelectorPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  currentVoiceConfig: VoiceConfig;
  onVoiceChange: (newConfig: VoiceConfig) => void;
}

const TOP_LANGUAGES = [
  { code: 'all', label: 'All Voices' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'it', label: 'Italiano' },
  { code: 'pt', label: 'Português' },
  { code: 'ja', label: '日本語' },
  { code: 'zh', label: '中文' },
  { code: 'ko', label: '한국어' },
  { code: 'ru', label: 'Русский' },
  { code: 'ar', label: 'العربية' },
  { code: 'hi', label: 'हिन्दी' },
];

export const VoiceSelectorPopover: React.FC<VoiceSelectorPopoverProps> = ({
  isOpen,
  onClose,
  currentVoiceConfig,
  onVoiceChange,
}) => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedURI, setSelectedURI] = useState<string>(currentVoiceConfig.voiceURI);
  const [rate, setRate] = useState<number>(currentVoiceConfig.rate || 1.0);
  const [pitch, setPitch] = useState<number>(currentVoiceConfig.pitch || 1.0);
  const [autoMatchLanguage, setAutoMatchLanguage] = useState<boolean>(
    currentVoiceConfig.autoMatchLanguage ?? true
  );
  const [respondInVoiceLanguage, setRespondInVoiceLanguage] = useState<boolean>(
    currentVoiceConfig.respondInVoiceLanguage ?? true
  );
  const [filterLang, setFilterLang] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [testingURI, setTestingURI] = useState<string | null>(null);

  useEffect(() => {
    getAvailableVoices().then((list) => {
      setVoices(list);
      if (!selectedURI && list.length > 0) {
        const preferred =
          list.find((v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha'))) ||
          list.find((v) => v.lang.startsWith('en')) ||
          list[0];
        if (preferred) {
          setSelectedURI(preferred.voiceURI);
        }
      }
    });
  }, []);

  useEffect(() => {
    setSelectedURI(currentVoiceConfig.voiceURI);
    setRate(currentVoiceConfig.rate || 1.0);
    setPitch(currentVoiceConfig.pitch || 1.0);
    setAutoMatchLanguage(currentVoiceConfig.autoMatchLanguage ?? true);
    setRespondInVoiceLanguage(currentVoiceConfig.respondInVoiceLanguage ?? true);
  }, [currentVoiceConfig]);

  if (!isOpen) return null;

  const currentVoiceObj = voices.find((v) => v.voiceURI === selectedURI) || voices[0];

  const filteredVoices = voices.filter((v) => {
    const matchesLang =
      filterLang === 'all' || v.lang.toLowerCase().startsWith(filterLang.toLowerCase());

    const query = searchQuery.trim().toLowerCase();
    const langName = getLanguageDisplayName(v.lang).toLowerCase();
    const matchesSearch =
      !query ||
      v.name.toLowerCase().includes(query) ||
      v.lang.toLowerCase().includes(query) ||
      langName.includes(query);

    return matchesLang && matchesSearch;
  });

  const handleSelectVoice = (v: SpeechSynthesisVoice) => {
    setSelectedURI(v.voiceURI);
    const updated: VoiceConfig = {
      voiceURI: v.voiceURI,
      voiceName: v.name,
      lang: v.lang,
      rate,
      pitch,
      volume: 1.0,
      autoMatchLanguage,
      respondInVoiceLanguage,
      nativeSampleText: getLanguageSamplePhrase(v.lang),
    };
    saveStoredVoiceConfig(updated);
    onVoiceChange(updated);
  };

  const handleRateChange = (newRate: number) => {
    setRate(newRate);
    const updated: VoiceConfig = {
      ...currentVoiceConfig,
      voiceURI: selectedURI,
      rate: newRate,
    };
    saveStoredVoiceConfig(updated);
    onVoiceChange(updated);
  };

  const handlePitchChange = (newPitch: number) => {
    setPitch(newPitch);
    const updated: VoiceConfig = {
      ...currentVoiceConfig,
      voiceURI: selectedURI,
      pitch: newPitch,
    };
    saveStoredVoiceConfig(updated);
    onVoiceChange(updated);
  };

  const handleToggleAutoMatch = () => {
    const nextVal = !autoMatchLanguage;
    setAutoMatchLanguage(nextVal);
    const updated: VoiceConfig = {
      ...currentVoiceConfig,
      autoMatchLanguage: nextVal,
    };
    saveStoredVoiceConfig(updated);
    onVoiceChange(updated);
  };

  const handleToggleRespondInVoiceLang = () => {
    const nextVal = !respondInVoiceLanguage;
    setRespondInVoiceLanguage(nextVal);
    const updated: VoiceConfig = {
      ...currentVoiceConfig,
      respondInVoiceLanguage: nextVal,
    };
    saveStoredVoiceConfig(updated);
    onVoiceChange(updated);
  };

  const handlePlayVoiceSample = (v: SpeechSynthesisVoice, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (testingURI === v.voiceURI) {
      stopSpeaking();
      setTestingURI(null);
      return;
    }

    stopSpeaking();
    setTestingURI(v.voiceURI);

    // Speak in that voice's authentic native language!
    const sampleText = getLanguageSamplePhrase(v.lang);

    speakMessage(sampleText, {
      isVoiceTest: true,
      voiceConfig: {
        voiceURI: v.voiceURI,
        voiceName: v.name,
        lang: v.lang,
        rate,
        pitch,
        volume: 1.0,
      },
      onEnd: () => setTestingURI(null),
      onError: () => setTestingURI(null),
    });
  };

  const handleReset = () => {
    setRate(1.0);
    setPitch(1.0);
    const updated: VoiceConfig = {
      ...currentVoiceConfig,
      rate: 1.0,
      pitch: 1.0,
    };
    saveStoredVoiceConfig(updated);
    onVoiceChange(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-[#1e1f20] border border-[#2d2f31] rounded-2xl flex flex-col shadow-2xl overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#2d2f31] bg-[#1e1f20]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#282a2c] text-[#8ab4f8]">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#e3e3e3] flex items-center gap-2">
                <span>Natural Voice & Language Studio</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#282a2c] text-[#8ab4f8] font-medium font-mono">
                  {voices.length} voices
                </span>
              </h3>
              <p className="text-[11px] text-[#8e918f]">
                Voices in other languages speak naturally in their native language instead of English with an accent.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopSpeaking();
              onClose();
            }}
            className="p-1.5 text-[#8e918f] hover:text-[#e3e3e3] rounded-lg hover:bg-[#282a2c] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-left">
          {/* Active Voice Spotlight Banner */}
          {currentVoiceObj && (
            <div className="p-3.5 rounded-xl bg-linear-to-r from-[#282a2c] to-[#1e1f20] border border-[#3c4043] flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-semibold text-[#8ab4f8] uppercase tracking-wider flex items-center gap-1">
                    <Globe2 className="w-3.5 h-3.5" />
                    Selected Voice:
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#131314] text-[#c4c7c5] font-medium">
                    {getLanguageDisplayName(currentVoiceObj.lang)}
                  </span>
                </div>
                <div className="text-sm font-semibold text-white truncate">
                  {currentVoiceObj.name}
                </div>
                <div className="text-[11px] text-[#9aa0a6] mt-0.5 italic truncate">
                  "{getLanguageSamplePhrase(currentVoiceObj.lang)}"
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => handlePlayVoiceSample(currentVoiceObj, e)}
                className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all shadow-xs cursor-pointer ${
                  testingURI === currentVoiceObj.voiceURI
                    ? 'bg-[#f28b82] text-[#131314]'
                    : 'bg-[#8ab4f8] text-[#131314] hover:bg-[#aecbfa]'
                }`}
              >
                {testingURI === currentVoiceObj.voiceURI ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Stop Preview</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Listen in {getLanguageDisplayName(currentVoiceObj.lang).split(' ')[0]}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Controls: Speed, Pitch & Language Options */}
          <div className="p-3.5 rounded-xl bg-[#131314] border border-[#2d2f31] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#c4c7c5] flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-[#8ab4f8]" />
                Speaking Speed: <strong className="text-white font-mono">{rate.toFixed(2)}x</strong>
              </span>
              <div className="flex items-center gap-1">
                {[0.8, 1.0, 1.25, 1.5].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => handleRateChange(preset)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                      Math.abs(rate - preset) < 0.05
                        ? 'bg-[#8ab4f8] text-[#131314] font-medium'
                        : 'bg-[#282a2c] text-[#8e918f] hover:text-[#e3e3e3]'
                    }`}
                  >
                    {preset}x
                  </button>
                ))}
              </div>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={rate}
              onChange={(e) => handleRateChange(parseFloat(e.target.value))}
              className="w-full accent-[#8ab4f8] h-1.5 bg-[#282a2c] rounded-lg cursor-pointer"
            />

            <div className="flex items-center justify-between pt-1 border-t border-[#2d2f31]">
              <span className="text-xs font-medium text-[#c4c7c5] flex items-center gap-1.5">
                <Music2 className="w-3.5 h-3.5 text-[#8ab4f8]" />
                Pitch & Tone: <strong className="text-white font-mono">{pitch.toFixed(2)}</strong>
              </span>
              <button
                onClick={handleReset}
                className="text-[11px] text-[#8e918f] hover:text-[#e3e3e3] flex items-center gap-1 cursor-pointer"
                title="Reset speed and pitch to default"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            </div>
            <input
              type="range"
              min="0.6"
              max="1.4"
              step="0.05"
              value={pitch}
              onChange={(e) => handlePitchChange(parseFloat(e.target.value))}
              className="w-full accent-[#8ab4f8] h-1.5 bg-[#282a2c] rounded-lg cursor-pointer"
            />

            {/* Language & Accent Prevention Preferences */}
            <div className="pt-2 border-t border-[#2d2f31] grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label
                onClick={handleToggleRespondInVoiceLang}
                className="flex items-start gap-2 p-2 rounded-lg bg-[#1e1f20] border border-[#2d2f31] hover:border-[#3c4043] cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={respondInVoiceLanguage}
                  onChange={() => {}}
                  className="mt-0.5 accent-[#8ab4f8] cursor-pointer"
                />
                <div className="text-[11px]">
                  <div className="font-medium text-[#e3e3e3]">AI responds in voice language</div>
                  <div className="text-[#8e918f]">Speaks in native language rather than English in an accent</div>
                </div>
              </label>

              <label
                onClick={handleToggleAutoMatch}
                className="flex items-start gap-2 p-2 rounded-lg bg-[#1e1f20] border border-[#2d2f31] hover:border-[#3c4043] cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={autoMatchLanguage}
                  onChange={() => {}}
                  className="mt-0.5 accent-[#8ab4f8] cursor-pointer"
                />
                <div className="text-[11px]">
                  <div className="font-medium text-[#e3e3e3]">Auto-match voice to text</div>
                  <div className="text-[#8e918f]">Uses a voice matching the text's native language</div>
                </div>
              </label>
            </div>
          </div>

          {/* Search & Language Filters */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8e918f]" />
              <input
                type="text"
                placeholder="Search voices by name (e.g., Jorge, Amélie, Kyoko) or language..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[#131314] border border-[#2d2f31] rounded-xl text-xs text-[#e3e3e3] placeholder-[#8e918f] focus:outline-none focus:border-[#8ab4f8]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8e918f] hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Language Pills Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
              {TOP_LANGUAGES.map((lang) => {
                const count =
                  lang.code === 'all'
                    ? voices.length
                    : voices.filter((v) => v.lang.toLowerCase().startsWith(lang.code)).length;

                if (count === 0 && lang.code !== 'all' && lang.code !== 'en') return null;

                const isSelected = filterLang === lang.code;
                return (
                  <button
                    key={lang.code}
                    onClick={() => setFilterLang(lang.code)}
                    className={`px-3 py-1 rounded-full shrink-0 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#8ab4f8] text-[#131314] font-medium'
                        : 'bg-[#282a2c] text-[#8e918f] hover:text-[#e3e3e3]'
                    }`}
                  >
                    <span>{lang.label}</span>
                    <span className={`text-[10px] opacity-75 font-mono`}>({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Voices List */}
          <div className="space-y-2 max-h-[38vh] overflow-y-auto pr-1">
            {filteredVoices.map((v, idx) => {
              const isSelected = selectedURI === v.voiceURI;
              const isPlayingThis = testingURI === v.voiceURI;
              const isNatural =
                v.name.includes('Natural') ||
                v.name.includes('Google') ||
                v.name.includes('Neural') ||
                v.name.includes('Samantha');
              const nativeSample = getLanguageSamplePhrase(v.lang);
              const langName = getLanguageDisplayName(v.lang);

              return (
                <div
                  key={`${v.voiceURI || v.name}_${v.lang}_${idx}`}
                  onClick={() => handleSelectVoice(v)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between group ${
                    isSelected
                      ? 'bg-[#282a2c] border-[#8ab4f8] shadow-sm'
                      : 'bg-[#131314] hover:bg-[#282a2c]/60 border-[#2d2f31]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <button
                      type="button"
                      title={`Listen to sample in ${langName}`}
                      onClick={(e) => handlePlayVoiceSample(v, e)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0 transition-colors cursor-pointer ${
                        isPlayingThis
                          ? 'bg-[#f28b82] text-[#131314] animate-pulse'
                          : isSelected
                          ? 'bg-[#8ab4f8] text-[#131314] hover:bg-[#aecbfa]'
                          : 'bg-[#1e1f20] text-[#8e918f] group-hover:text-white group-hover:bg-[#333538]'
                      }`}
                    >
                      {isPlayingThis ? (
                        <Square className="w-3.5 h-3.5 fill-current" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current" />
                      )}
                    </button>

                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-[#e3e3e3] truncate">
                          {v.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-[#1e1f20] text-[#8ab4f8] font-medium shrink-0">
                          {langName}
                        </span>
                        {isNatural && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#1e1f20] text-[#81c995] font-medium shrink-0">
                            Natural
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-[#9aa0a6] truncate italic mt-0.5">
                        "{nativeSample}"
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isSelected ? (
                      <div className="flex items-center gap-1 text-[#8ab4f8] text-xs font-semibold px-2 py-1 rounded-full bg-[#8ab4f8]/10 border border-[#8ab4f8]/30">
                        <Check className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline text-[11px]">Selected</span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-[#8e918f] opacity-0 group-hover:opacity-100 transition-opacity">
                        Choose
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredVoices.length === 0 && (
              <div className="p-8 text-center text-xs text-[#8e918f]">
                No voices found matching "{searchQuery}".
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#2d2f31] flex items-center justify-between text-xs text-[#8e918f]">
          <span className="truncate max-w-[280px]">
            Active: <strong className="text-white">{currentVoiceObj?.name || 'Default'}</strong>{' '}
            ({getLanguageDisplayName(currentVoiceObj?.lang || '')})
          </span>
          <button
            onClick={() => {
              stopSpeaking();
              onClose();
            }}
            className="px-5 py-1.5 rounded-full bg-[#e3e3e3] hover:bg-white text-[#131314] font-semibold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
