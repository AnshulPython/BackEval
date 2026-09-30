/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { VoiceConfig } from '../types';
import { DEFAULT_VOICE_CONFIG } from '../data/providersAndModels';

const VOICE_CONFIG_STORAGE_KEY = 'createai_voice_config_v1';

let currentUtterance: SpeechSynthesisUtterance | null = null;
let activeSpeakingMessageId: string | null = null;
let speechListeners: Array<(messageId: string | null, isSpeaking: boolean, isPaused: boolean) => void> = [];

export const LANGUAGE_SAMPLE_PHRASES: Record<string, string> = {
  en: "Hello! I am your chosen voice for the LLM Orchestration Engine. You can adjust my speed, pitch, and tone anytime.",
  es: "¡Hola! Soy tu voz en español para el motor de orquestación LLM. Te responderé con total fluidez, claridad y pronunciación natural.",
  fr: "Bonjour ! Je suis votre voix française pour le moteur d'orchestration LLM. Je m'exprime naturellement avec une élocution fluide et précise.",
  de: "Hallo! Ich bin Ihre deutsche Stimme für die LLM-Orchestrierungs-Engine. Ich spreche fließend und mit klarer, natürlicher Aussprache.",
  it: "Ciao! Sono la tua voce italiana per l'engine di orchestrazione LLM. Ti risponderò in modo chiaro, fluido e completamente naturale.",
  pt: "Olá! Sou sua voz em português para o motor de orquestração LLM. Posso conversar com você com pronúncia clara, fluida e natural.",
  ja: "こんにちは！LLMオーケストレーションエンジンの日本語音声アシスタントです。自然な発音とイントネーションでお話しします。",
  zh: "你好！我是你的多模型编排引擎语音助手。我可以用地道流利、自然清晰的中文与您交流。",
  ko: "안녕하세요! LLM 오케스트레이션 엔진을 위한 한국어 음성입니다. 자연스럽고 또렷한 목소리로 친절하게 답변해 드릴게요.",
  ru: "Здравствуйте! Я ваш русский голос для платформы оркестрации LLM. Я говорю чётко, грамотно и с естественной интонацией.",
  ar: "مرحباً! أنا صوتك باللغة العربية لمحرك تنسيق النماذج اللغوية. أتحدث معك بطلاقة ووضوح وبلهجة طبيعية.",
  hi: "नमस्ते! मैं आपके एलएलएम ऑर्केस्ट्रेशन इंजन के लिए चुनी गई आवाज़ हूँ। मैं आपके साथ धाराप्रवाह और स्वाभाविक रूप से बात कर सकता हूँ।",
  nl: "Hallo! Ik ben jouw gekozen Nederlandse stem voor de LLM Orchestration Engine. Ik spreek vloeiend en natuurlijk met je.",
  pl: "Cześć! Jestem Twoim polskim głosem dla silnika orkiestracji LLM. Będę mówić płynnie, wyraźnie i z naturalną dykcją.",
  tr: "Merhaba! LLM orkestrasyon motoru için seçtiğiniz Türkçe ses benim. Sizinle akıcı, anlaşılır ve doğal bir Türkçe ile konuşabilirim.",
  sv: "Hej! Jag är din svenska röst för LLM-orkestreringsmotorn. Jag talar flytande, klart och helt naturligt med dig.",
  uk: "Привіт! Я ваш український голос для рушія оркестрації LLM. Спілкуюся з вами вільно, виразно та з природною інтонацією.",
  vi: "Xin chào! Tôi là giọng đọc tiếng Việt của bạn trên công cụ điều phối LLM, phát âm rõ ràng, chuẩn xác và tự nhiên.",
  id: "Halo! Saya suara bahasa Indonesia Anda untuk mesin orkestrasi LLM. Saya dapat bertutur dengan lancar, jelas, dan alami.",
  th: "สวัสดีครับ! ผมคือเสียงภาษาไทยของคุณสำหรับระบบจัดสรร LLM พูดคุยได้อย่างเป็นธรรมชาติและชัดเจน",
  el: "Γεια σας! Είμαι η ελληνική φωνή σας για τη μηχανή ενορχήστρωσης LLM. Μιλώ με φυσικότητα, άνεση και καθαρή άρθρωση.",
  da: "Hej! Jeg er din danske stemme til LLM-orkestreringsmotoren. Jeg taler flydende, behageligt og helt naturligt med dig.",
  fi: "Hei! Olen suomenkielinen äänesi LLM-orkestrointimoottorissa. Puhun kanssasi sujuvasti, selkeästi ja luontevasti.",
  cs: "Dobrý den! Jsem váš český hlas pro orchestrační modul LLM. Mohu s vámi mluvit plynulou, srozumitelnou a přirozenou češtinou.",
  no: "Hei! Jeg er din norske stemme for LLM-orkestreringsmotoren. Jeg snakker flytende, tydelig og naturlig med deg.",
  he: "שלום! אני הקול הנבחר שלך עבור מנוע התזמור של מודלי השפה. אני אדבר איתך בעברית שוטפת וטבעית.",
  ro: "Bună! Sunt vocea ta în limba română pentru motorul de orchestrare LLM. Vorbesc fluent, clar și natural.",
  hu: "Helló! Én vagyok az LLM vezérlőmotor magyar hangja. Folyékonyan és természetesen beszélek veled.",
};

export const LANGUAGE_DISPLAY_NAMES: Record<string, string> = {
  en: 'English',
  es: 'Spanish (Español)',
  fr: 'French (Français)',
  de: 'German (Deutsch)',
  it: 'Italian (Italiano)',
  pt: 'Portuguese (Português)',
  ja: 'Japanese (日本語)',
  zh: 'Chinese (中文)',
  ko: 'Korean (한국어)',
  ru: 'Russian (Русский)',
  ar: 'Arabic (العربية)',
  hi: 'Hindi (हिन्दी)',
  nl: 'Dutch (Nederlands)',
  pl: 'Polish (Polski)',
  tr: 'Turkish (Türkçe)',
  sv: 'Swedish (Svenska)',
  uk: 'Ukrainian (Українська)',
  vi: 'Vietnamese (Tiếng Việt)',
  id: 'Indonesian (Bahasa Indonesia)',
  th: 'Thai (ภาษาไทย)',
  el: 'Greek (Ελληνικά)',
  da: 'Danish (Dansk)',
  fi: 'Finnish (Suomi)',
  cs: 'Czech (Čeština)',
  no: 'Norwegian (Norsk)',
  he: 'Hebrew (עברית)',
  ro: 'Romanian (Română)',
  hu: 'Hungarian (Magyar)',
};

/**
 * Returns a native sample phrase for the given language code so foreign voices speak
 * their native tongue instead of reading English in an accent.
 */
export function getLanguageSamplePhrase(langCode: string): string {
  if (!langCode) return LANGUAGE_SAMPLE_PHRASES.en;
  const prefix = langCode.toLowerCase().split(/[-_]/)[0];
  return LANGUAGE_SAMPLE_PHRASES[prefix] || LANGUAGE_SAMPLE_PHRASES.en;
}

/**
 * Returns user-friendly language name
 */
export function getLanguageDisplayName(langCode: string): string {
  if (!langCode) return 'Default';
  const prefix = langCode.toLowerCase().split(/[-_]/)[0];
  return LANGUAGE_DISPLAY_NAMES[prefix] || langCode;
}

/**
 * Lightweight, fast client-side language detection based on scripts and stopwords
 */
export function detectTextLanguage(rawText: string): string {
  if (!rawText || rawText.trim().length === 0) return 'en';
  const text = rawText.slice(0, 1000);

  // Script detection
  if (/[\u3040-\u30ff]/.test(text)) return 'ja'; // Japanese Hiragana/Katakana
  if (/[\u4e00-\u9fa5]/.test(text)) return 'zh'; // Chinese Hanzi
  if (/[\uac00-\ud7af]/.test(text)) return 'ko'; // Korean Hangul
  if (/[\u0400-\u04ff]/.test(text)) return 'ru'; // Cyrillic (Russian/Ukrainian)
  if (/[\u0600-\u06ff]/.test(text)) return 'ar'; // Arabic
  if (/[\u0900-\u097f]/.test(text)) return 'hi'; // Devanagari (Hindi)
  if (/[\u0370-\u03ff]/.test(text)) return 'el'; // Greek
  if (/[\u0e00-\u0e7f]/.test(text)) return 'th'; // Thai
  if (/[\u0590-\u05ff]/.test(text)) return 'he'; // Hebrew

  // Latin script languages detection via distinctive keywords & diacritics
  const lower = ` ${text.toLowerCase()} `;

  // Spanish indicators
  if (/[¿¡ñ]/.test(lower) || /\b(el|la|los|las|de|en|un|una|unos|unas|por|para|con|como|este|esta|esto|pero|más|que)\b/i.test(lower)) {
    const spanishMatches = (lower.match(/\b(el|la|los|las|en|del|por|para|con|como|pero|más|que|es|son|un|una)\b/gi) || []).length;
    const englishMatches = (lower.match(/\b(the|is|and|of|to|in|that|it|you|for|with|on|this|are|have|from)\b/gi) || []).length;
    if (spanishMatches > englishMatches && spanishMatches >= 2) return 'es';
  }

  // French indicators
  if (/[çœ]/.test(lower) || /\b(le|la|les|du|des|et|en|dans|pour|avec|est|sont|ce|cette|ces|une|un|qui|que)\b/i.test(lower)) {
    const frenchMatches = (lower.match(/\b(le|la|les|du|des|et|dans|pour|avec|est|sont|cette|une|qui|que)\b/gi) || []).length;
    const englishMatches = (lower.match(/\b(the|is|and|of|to|in|that|it|you|for|with|on|this|are)\b/gi) || []).length;
    if (frenchMatches > englishMatches && frenchMatches >= 2) return 'fr';
  }

  // German indicators
  if (/[äöüß]/.test(lower) || /\b(der|die|das|und|in|den|von|zu|mit|sich|des|auf|für|ist|im|nicht|ein|eine)\b/i.test(lower)) {
    const germanMatches = (lower.match(/\b(der|die|das|und|in|den|von|zu|mit|sich|des|auf|für|ist|nicht|ein|eine)\b/gi) || []).length;
    const englishMatches = (lower.match(/\b(the|is|and|of|to|in|that|it|you|for|with|on|this|are)\b/gi) || []).length;
    if (germanMatches > englishMatches && germanMatches >= 2) return 'de';
  }

  // Italian indicators
  if (/\b(il|la|lo|gli|le|di|da|in|con|su|per|tra|fra|che|non|sono|come|questo|questa)\b/i.test(lower)) {
    const italianMatches = (lower.match(/\b(il|la|lo|gli|le|di|da|con|su|per|tra|che|non|sono|come|questo)\b/gi) || []).length;
    const englishMatches = (lower.match(/\b(the|is|and|of|to|in|that|it|you|for|with|on|this|are)\b/gi) || []).length;
    if (italianMatches > englishMatches && italianMatches >= 2) return 'it';
  }

  // Portuguese indicators
  if (/[ãõ]/.test(lower) || /\b(o|os|as|do|da|dos|das|em|um|uma|para|com|não|que|por|mais|como)\b/i.test(lower)) {
    const ptMatches = (lower.match(/\b(do|da|dos|das|em|para|com|não|que|por|mais|como|uma|um)\b/gi) || []).length;
    const englishMatches = (lower.match(/\b(the|is|and|of|to|in|that|it|you|for|with|on|this)\b/gi) || []).length;
    if (ptMatches > englishMatches && ptMatches >= 2) return 'pt';
  }

  return 'en';
}

export function getStoredVoiceConfig(): VoiceConfig {
  try {
    const raw = localStorage.getItem(VOICE_CONFIG_STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_VOICE_CONFIG, ...JSON.parse(raw) };
    }
  } catch {}
  return DEFAULT_VOICE_CONFIG;
}

export function saveStoredVoiceConfig(config: VoiceConfig): void {
  try {
    localStorage.setItem(VOICE_CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch {}
}

export function getAvailableVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      resolve([]);
      return;
    }

    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      resolve(voices);
      return;
    }

    // Wait for voices to load asynchronously
    const handler = () => {
      const loaded = window.speechSynthesis.getVoices();
      window.speechSynthesis.removeEventListener('voiceschanged', handler);
      resolve(loaded);
    };

    window.speechSynthesis.addEventListener('voiceschanged', handler);
    // Timeout fallback
    setTimeout(() => {
      window.speechSynthesis.removeEventListener('voiceschanged', handler);
      resolve(window.speechSynthesis.getVoices());
    }, 800);
  });
}

export function subscribeSpeechState(
  listener: (messageId: string | null, isSpeaking: boolean, isPaused: boolean) => void
): () => void {
  speechListeners.push(listener);
  return () => {
    speechListeners = speechListeners.filter((l) => l !== listener);
  };
}

function notifySpeechState(messageId: string | null, isSpeaking: boolean, isPaused: boolean) {
  activeSpeakingMessageId = messageId;
  for (const listener of speechListeners) {
    try {
      listener(messageId, isSpeaking, isPaused);
    } catch {}
  }
}

/**
 * Cleans text for natural speech synthesis
 */
export function cleanTextForSpeech(rawText: string): string {
  if (!rawText) return '';

  return rawText
    // Remove code blocks with indication
    .replace(/```([a-zA-Z0-9_\-+]*)\n([\s\S]*?)```/g, ' [Code block omitted] ')
    // Remove inline code
    .replace(/`([^`]+)`/g, '$1')
    // Remove HTML tags
    .replace(/<[^>]*>/g, ' ')
    // Replace LaTeX display math with spoken description
    .replace(/\$\$([\s\S]*?)\$\$/g, ' mathematical formula ')
    .replace(/\\\[([\s\S]*?)\\\]/g, ' equation ')
    .replace(/\\\(([\s\S]*?)\\\)/g, ' formula ')
    .replace(/(?<!\\)\$([^$\n]+)\$/g, '$1')
    // Clean Markdown links: [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Clean markdown headings, bullets, bold, italics
    .replace(/^[#*>-]+\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Replace multiple spaces and newlines
    .replace(/\n\s*\n/g, '. ')
    .replace(/\n/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export interface SpeakOptions {
  messageId?: string;
  voiceConfig?: Partial<VoiceConfig>;
  isVoiceTest?: boolean;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

export function speakMessage(
  text: string,
  options?: SpeakOptions
): boolean {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return false;
  }

  // Cancel any ongoing speech
  stopSpeaking();

  const config: VoiceConfig = {
    ...getStoredVoiceConfig(),
    ...(options?.voiceConfig || {}),
  };

  const allVoices = window.speechSynthesis.getVoices();

  // Find preferred target voice
  let selectedVoice: SpeechSynthesisVoice | undefined;

  if (config.voiceURI) {
    selectedVoice = allVoices.find((v) => v.voiceURI === config.voiceURI);
  }
  if (!selectedVoice && config.voiceName) {
    selectedVoice = allVoices.find((v) => v.name.toLowerCase().includes(config.voiceName.toLowerCase()));
  }

  // Determine what text to speak
  let textToSpeak = text;

  // If this is a voice test or sample, ensure the voice speaks in its native language
  if (options?.isVoiceTest) {
    const targetLang = selectedVoice?.lang || config.lang || 'en';
    textToSpeak = config.nativeSampleText || getLanguageSamplePhrase(targetLang);
  } else {
    // If speaking actual content, check language alignment to prevent foreign voices
    // from speaking English in a thick broken accent
    const cleaned = cleanTextForSpeech(text);
    if (!cleaned) return false;
    textToSpeak = cleaned;

    const autoMatch = config.autoMatchLanguage ?? true;
    if (autoMatch && allVoices.length > 0) {
      const textLang = detectTextLanguage(textToSpeak);
      const voiceLangPrefix = (selectedVoice?.lang || config.lang || 'en').toLowerCase().split(/[-_]/)[0];

      // If text language doesn't match the voice's language, find a voice in the text's native tongue
      if (textLang !== voiceLangPrefix) {
        const matchingLangVoice =
          allVoices.find((v) => v.lang.toLowerCase().startsWith(textLang) && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Neural'))) ||
          allVoices.find((v) => v.lang.toLowerCase().startsWith(textLang));

        if (matchingLangVoice) {
          selectedVoice = matchingLangVoice;
        }
      }
    }
  }

  if (!selectedVoice) {
    // Fallback: preferred natural / Google English voice
    selectedVoice =
      allVoices.find((v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha'))) ||
      allVoices.find((v) => v.lang.startsWith('en')) ||
      allVoices[0];
  }

  const utterance = new SpeechSynthesisUtterance(textToSpeak);
  currentUtterance = utterance;

  // Apply voice config
  utterance.rate = Math.max(0.5, Math.min(2.0, config.rate || 1.0));
  utterance.pitch = Math.max(0.5, Math.min(1.5, config.pitch || 1.0));
  utterance.volume = Math.max(0.0, Math.min(1.0, config.volume ?? 1.0));

  if (selectedVoice) {
    utterance.voice = selectedVoice;
    utterance.lang = selectedVoice.lang;
  }

  const msgId = options?.messageId || 'unknown_msg';

  utterance.onstart = () => {
    notifySpeechState(msgId, true, false);
    options?.onStart?.();
  };

  utterance.onend = () => {
    currentUtterance = null;
    notifySpeechState(null, false, false);
    options?.onEnd?.();
  };

  utterance.onerror = (e) => {
    currentUtterance = null;
    notifySpeechState(null, false, false);
    options?.onError?.(e);
  };

  utterance.onpause = () => {
    notifySpeechState(msgId, true, true);
  };

  utterance.onresume = () => {
    notifySpeechState(msgId, true, false);
  };

  try {
    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    console.error('Speech synthesis failed:', err);
    return false;
  }
}

export function pauseSpeaking(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.pause();
    notifySpeechState(activeSpeakingMessageId, true, true);
  }
}

export function resumeSpeaking(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.resume();
    notifySpeechState(activeSpeakingMessageId, true, false);
  }
}

export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
    currentUtterance = null;
    notifySpeechState(null, false, false);
  }
}

export function getActiveSpeakingId(): string | null {
  return activeSpeakingMessageId;
}

export function isSpeaking(): boolean {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    return window.speechSynthesis.speaking;
  }
  return false;
}

export function speakText(text: string, onEnd?: () => void): boolean {
  return speakMessage(text, { onEnd });
}
