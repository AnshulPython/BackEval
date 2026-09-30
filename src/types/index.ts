export type AIProviderId =
  | 'gemini'
  | 'openai'
  | 'anthropic'
  | 'groq'
  | 'deepseek'
  | 'mistral'
  | 'openrouter'
  | 'perplexity'
  | 'custom';

export interface AIProviderInfo {
  id: AIProviderId;
  name: string;
  tagline: string;
  badge: string;
  color: string;
  defaultBaseUrl?: string;
  keyHelpUrl: string;
  placeholderKey: string;
  keyPrefix?: string;
  hasDefaultKeyInEnv?: boolean;
}

export type CapabilityType =
  | 'reasoning'
  | 'webSearch'
  | 'codeExecution'
  | 'vision'
  | 'tts'
  | 'jsonMode'
  | 'fastSpeed'
  | 'imageGeneration';

export type ApiPlanTier = 'free' | 'tier1' | 'pro' | 'enterprise';

export interface PlanTierInfo {
  id: ApiPlanTier;
  label: string;
  shortLabel: string;
  badge: string;
  description: string;
  color: string;
}

export interface AIModel {
  id: string;
  name: string;
  provider: AIProviderId;
  description: string;
  contextWindow: string;
  capabilities: CapabilityType[];
  recommended?: boolean;
  isPaid?: boolean;
  minPlanTier?: ApiPlanTier;
  supportedPlans?: ApiPlanTier[];
  isAccountVerified?: boolean;
  inputTokens?: number;
  speed: 'Ultra-Fast' | 'Fast' | 'Balanced' | 'Deep-Reasoning';
  intelligenceLevel: 'Maximum' | 'Very High' | 'High' | 'Standard';
}

export interface VoiceConfig {
  voiceURI: string;
  voiceName: string;
  lang: string;
  rate: number; // 0.5 to 2.0
  pitch: number; // 0.5 to 1.5
  volume: number; // 0.0 to 1.0
  autoMatchLanguage?: boolean; // Use native voice matching text language to avoid speaking other languages in an accent
  respondInVoiceLanguage?: boolean; // Instruct AI to reply in the voice's language so speech is naturally native
  nativeSampleText?: string;
}

export interface ModelCapabilitiesConfig {
  webSearch: boolean;
  reasoning: boolean;
  thinkingLevel: 'minimal' | 'low' | 'high';
  codeExecution: boolean;
  visionEnabled: boolean;
  ttsEnabled: boolean;
  temperature: number;
  topP: number;
  maxTokens: number;
  stream: boolean;
  systemPrompt: string;
  systemPreset: 'default' | 'developer' | 'researcher' | 'creative' | 'concise' | 'custom';
  memoryDepth: number; // 0 = unlimited
  secretPrompt?: string;
  secretPromptEnabled?: boolean;
  voiceConfig?: VoiceConfig;
}

export interface ChatAttachment {
  id: string;
  type: 'image' | 'text' | 'file';
  name: string;
  mimeType: string;
  dataUrl?: string; // base64 data url
  textPreview?: string;
  size?: number;
}

export interface MessageEvaluationResult {
  evaluatedAt: number;
  engine: 'ragas-builtin' | 'ragas-external' | 'langsmith' | 'custom-webhook';
  scores: {
    faithfulness: number; // 0.0 - 1.0
    answerRelevancy: number; // 0.0 - 1.0
    contextPrecision: number; // 0.0 - 1.0
    hallucinationRisk: number; // 0.0 - 1.0
    conciseness: number; // 0.0 - 1.0
  };
  overallScore: number; // 0 - 100
  verdict: 'Excellent' | 'Good' | 'Needs Improvement' | 'High Risk';
  critique: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  thinking?: string; // Step-by-step reasoning trace
  sources?: Array<{ title: string; url: string }>;
  timestamp: number;
  modelUsed?: string;
  providerUsed?: AIProviderId;
  tokensEstimated?: number;
  durationMs?: number;
  attachments?: ChatAttachment[];
  isStreaming?: boolean;
  error?: string;
  isRateLimit?: boolean;
  evaluation?: MessageEvaluationResult;
  generatedImage?: {
    url: string;
    prompt: string;
    aspectRatio?: string;
    modelUsed?: string;
    durationMs?: number;
  };
}

export interface RagasTestCase {
  id: string;
  question: string;
  contexts?: string[];
  groundTruth?: string;
  actualAnswer?: string;
  lastEvaluatedAt?: number;
  evaluation?: MessageEvaluationResult;
  status?: 'pending' | 'evaluating' | 'passed' | 'failed';
}

export interface RagasBenchmarkReport {
  id: string;
  title: string;
  createdAt: number;
  modelEvaluated: string;
  totalCases: number;
  passedCases: number;
  avgFaithfulness: number;
  avgAnswerRelevancy: number;
  avgContextPrecision: number;
  avgHallucinationRisk: number;
  overallQualityScore: number;
  verdict: 'Excellent' | 'Good' | 'Needs Improvement' | 'High Risk';
  items: Array<{
    id: string;
    question: string;
    answer: string;
    groundTruth?: string;
    scores: {
      faithfulness: number;
      answerRelevancy: number;
      contextPrecision: number;
      hallucinationRisk: number;
    };
    verdict: string;
    critique: string;
  }>;
}

export interface ExternalSoftwareConfig {
  activeSoftware: 'render_backend' | 'ragas' | 'langsmith' | 'langfuse' | 'traceloop' | 'custom_webhook';
  enabled: boolean;
  endpointUrl: string;
  apiKey?: string;
  autoEvaluateOnMessage: boolean;
  exportFormat: 'ragas_dataset' | 'openai_finetune' | 'sharegpt' | 'huggingface' | 'standard_json' | 'alpaca' | 'dpo_pairs';
  webhookDestinationUrl?: string;
  webhookAuthHeader?: string;
  evalMetrics: {
    faithfulness: boolean;
    answerRelevancy: boolean;
    contextPrecision: boolean;
    hallucinationDetection: boolean;
    conciseness: boolean;
  };
  thresholds?: {
    minFaithfulness: number;
    minAnswerRelevancy: number;
    maxHallucinationRisk: number;
  };
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  provider: AIProviderId;
  model: string;
  messages: ChatMessage[];
  capabilities: ModelCapabilitiesConfig;
  secretPrompt?: string;
  secretPromptEnabled?: boolean;
}

export interface StoredAPIKeys {
  gemini?: string;
  openai?: string;
  anthropic?: string;
  groq?: string;
  deepseek?: string;
  mistral?: string;
  openrouter?: string;
  perplexity?: string;
  custom?: string;
  customBaseUrl?: string;
}

export interface UserAccount {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  authProvider?: 'google' | 'email' | 'guest';
  googleId?: string;
  isGoogleVerified?: boolean;
  createdAt: number;
  lastLoginAt: number;
  apiKeys: StoredAPIKeys;
  savedModels?: Record<string, string>;
  isDefault?: boolean;
}
