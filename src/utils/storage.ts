/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AIProviderId,
  ChatSession,
  ModelCapabilitiesConfig,
  StoredAPIKeys,
  ExternalSoftwareConfig,
  RagasTestCase,
  RagasBenchmarkReport,
  UserAccount,
  VoiceConfig,
} from '../types/index';
import { DEFAULT_CAPABILITIES, DEFAULT_VOICE_CONFIG } from '../data/providersAndModels';

const KEYS_STORAGE_KEY = 'createai_api_keys_v1';
const PROVIDER_STORAGE_KEY = 'createai_active_provider_v1';
const MODEL_STORAGE_KEY = 'createai_active_model_v1';
const CAPABILITIES_STORAGE_KEY = 'createai_capabilities_v1';
const SESSIONS_STORAGE_KEY = 'createai_sessions_v1';
const ACTIVE_SESSION_STORAGE_KEY = 'createai_active_session_id_v1';
const ACCOUNTS_STORAGE_KEY = 'llm_engine_user_accounts_v4';
const ACTIVE_USER_ID_KEY = 'llm_engine_active_user_id_v4';

// Remove legacy storage caches
try {
  localStorage.removeItem('createai_user_accounts_v3');
  localStorage.removeItem('createai_active_user_id_v3');
} catch {}

export const PRIMARY_GOOGLE_USER_EMAIL = 'developer@workspace.local';
export const DEFAULT_USER_EMAIL = 'developer@workspace.local';

export function getUserAccounts(): UserAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}

  const initialKeys = getStoredApiKeys();
  const defaultGoogleAccount: UserAccount = {
    id: 'user_default_workspace',
    email: PRIMARY_GOOGLE_USER_EMAIL,
    displayName: 'Workspace Developer',
    authProvider: 'google',
    isGoogleVerified: true,
    avatarUrl: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
    createdAt: Date.now() - 86400000 * 7,
    lastLoginAt: Date.now(),
    isDefault: true,
    apiKeys: initialKeys,
    savedModels: {
      gemini: 'gemini-3.1-flash-lite',
      openai: 'gpt-4o',
      anthropic: 'claude-3-7-sonnet-20250219',
    },
  };

  const initialList = [defaultGoogleAccount];
  try {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(initialList));
  } catch {}
  return initialList;
}

export function saveUserAccounts(accounts: UserAccount[]): void {
  try {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch (err) {
    console.error('Failed to save user accounts:', err);
  }
}

export function getCurrentUser(): UserAccount {
  try {
    const activeId = localStorage.getItem(ACTIVE_USER_ID_KEY);
    const accounts = getUserAccounts();
    if (activeId) {
      const found = accounts.find((a) => a.id === activeId);
      if (found) return found;
    }
    if (accounts.length > 0) {
      return accounts[0];
    }
  } catch {}

  return {
    id: 'user_default',
    email: 'user@orchestration.local',
    displayName: 'User',
    authProvider: 'email',
    createdAt: Date.now(),
    lastLoginAt: Date.now(),
    apiKeys: getStoredApiKeys(),
    savedModels: {},
  };
}

export function setCurrentUser(user: UserAccount | null): void {
  try {
    if (user) {
      localStorage.setItem(ACTIVE_USER_ID_KEY, user.id);
      localStorage.setItem(KEYS_STORAGE_KEY, JSON.stringify(user.apiKeys || {}));
      const accounts = getUserAccounts();
      const nextAccounts = accounts.map((a) =>
        a.id === user.id ? { ...a, lastLoginAt: Date.now() } : a
      );
      saveUserAccounts(nextAccounts);
    } else {
      localStorage.removeItem(ACTIVE_USER_ID_KEY);
    }
  } catch (err) {
    console.error('Failed to set current user:', err);
  }
}

export function updateAccountKeys(userId: string, keys: StoredAPIKeys): UserAccount | null {
  const accounts = getUserAccounts();
  const index = accounts.findIndex((a) => a.id === userId);
  if (index === -1) return null;

  accounts[index].apiKeys = { ...keys };
  saveUserAccounts(accounts);

  const activeId = localStorage.getItem(ACTIVE_USER_ID_KEY);
  if (activeId === userId) {
    localStorage.setItem(KEYS_STORAGE_KEY, JSON.stringify(keys));
  }
  return accounts[index];
}

export function getStoredApiKeys(): StoredAPIKeys {
  try {
    const raw = localStorage.getItem(KEYS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveStoredApiKey(provider: AIProviderId, key: string, customBaseUrl?: string): void {
  try {
    const existing = getStoredApiKeys();
    existing[provider] = key.trim();
    if (customBaseUrl) {
      existing.customBaseUrl = customBaseUrl.trim();
    }
    localStorage.setItem(KEYS_STORAGE_KEY, JSON.stringify(existing));

    const currentUser = getCurrentUser();
    if (currentUser) {
      updateAccountKeys(currentUser.id, existing);
    }
  } catch (err) {
    console.error('Failed to save API key:', err);
  }
}

export function clearStoredApiKey(provider: AIProviderId): void {
  try {
    const existing = getStoredApiKeys();
    delete existing[provider];
    localStorage.setItem(KEYS_STORAGE_KEY, JSON.stringify(existing));
    const currentUser = getCurrentUser();
    if (currentUser) {
      updateAccountKeys(currentUser.id, existing);
    }
  } catch (err) {
    console.error('Failed to clear API key:', err);
  }
}

export function getActiveProvider(): AIProviderId {
  try {
    const prov = localStorage.getItem(PROVIDER_STORAGE_KEY) as AIProviderId;
    return prov || 'gemini';
  } catch {
    return 'gemini';
  }
}

export function setActiveProvider(provider: AIProviderId): void {
  try {
    localStorage.setItem(PROVIDER_STORAGE_KEY, provider);
  } catch {}
}

export function getActiveModel(provider: AIProviderId): string {
  try {
    const stored = localStorage.getItem(`${MODEL_STORAGE_KEY}_${provider}`);
    if (stored) return stored;
    if (provider === 'gemini') return 'gemini-3.1-flash-lite';
    if (provider === 'openai') return 'gpt-4o';
    if (provider === 'anthropic') return 'claude-3-7-sonnet-20250219';
    if (provider === 'groq') return 'llama-3.3-70b-versatile';
    if (provider === 'deepseek') return 'deepseek-chat';
    if (provider === 'mistral') return 'mistral-large-latest';
    if (provider === 'openrouter') return 'anthropic/claude-3.7-sonnet';
    if (provider === 'perplexity') return 'sonar-pro';
    return 'default-custom-model';
  } catch {
    return 'gemini-3.8-flash';
  }
}

export function setActiveModel(provider: AIProviderId, modelId: string): void {
  try {
    localStorage.setItem(`${MODEL_STORAGE_KEY}_${provider}`, modelId);
  } catch {}
}

const PROVIDER_PLAN_STORAGE_KEY = 'createai_provider_plan_v1';
const FILTER_AVAILABLE_STORAGE_KEY = 'createai_filter_available_models_v1';

export function getProviderPlan(provider: AIProviderId): import('../types').ApiPlanTier {
  try {
    const raw = localStorage.getItem(`${PROVIDER_PLAN_STORAGE_KEY}_${provider}`);
    if (raw === 'free' || raw === 'tier1' || raw === 'pro' || raw === 'enterprise') {
      return raw;
    }
  } catch {}
  return 'free';
}

export function setProviderPlan(provider: AIProviderId, plan: import('../types').ApiPlanTier): void {
  try {
    localStorage.setItem(`${PROVIDER_PLAN_STORAGE_KEY}_${provider}`, plan);
  } catch {}
}

export function getFilterOnlyAvailableModels(): boolean {
  try {
    const stored = localStorage.getItem(FILTER_AVAILABLE_STORAGE_KEY);
    if (stored !== null) return stored === 'true';
  } catch {}
  return true; // Default to true: only show models available on the account plan
}

export function setFilterOnlyAvailableModels(enabled: boolean): void {
  try {
    localStorage.setItem(FILTER_AVAILABLE_STORAGE_KEY, enabled ? 'true' : 'false');
  } catch {}
}

export function getCapabilitiesConfig(): ModelCapabilitiesConfig {
  try {
    const raw = localStorage.getItem(CAPABILITIES_STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_CAPABILITIES, ...JSON.parse(raw) };
    }
  } catch {}
  return DEFAULT_CAPABILITIES;
}

export function saveCapabilitiesConfig(config: ModelCapabilitiesConfig): void {
  try {
    localStorage.setItem(CAPABILITIES_STORAGE_KEY, JSON.stringify(config));
  } catch {}
}

export function getChatSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [];
}

export function saveChatSessions(sessions: ChatSession[]): void {
  try {
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
  } catch {}
}

export function getActiveSessionId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setActiveSessionId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, id);
  } catch {}
}

export const DEFAULT_LIVE_RENDER_BACKEND_URL =
  'https://dashboard.render.com/web/srv-daum9h67bikc73cur3tg/deploys/dep-daum9he7bikc73cur5u0?r=2026-09-30%4019%3A35%3A37%7E2026-09-30%4019%3A38%3A03';

export const LIVE_RENDER_SERVICE_ID = 'srv-daum9h67bikc73cur3tg';
export const LIVE_RENDER_DEPLOY_ID = 'dep-daum9he7bikc73cur5u0';

const EXTERNAL_CONFIG_KEY = 'createai_external_software_config_v2';
const LIVE_BACKEND_STORAGE_KEY = 'llm_engine_live_backend_url_v2';

export function getLiveBackendUrl(): string {
  try {
    const raw = localStorage.getItem(LIVE_BACKEND_STORAGE_KEY);
    if (
      raw &&
      !raw.includes('localhost:3001') &&
      !raw.includes('localhost:5000') &&
      !raw.includes('localhost:8000')
    ) {
      return raw.trim();
    }
  } catch {}
  return DEFAULT_LIVE_RENDER_BACKEND_URL;
}

export function setLiveBackendUrl(url: string): void {
  try {
    localStorage.setItem(LIVE_BACKEND_STORAGE_KEY, url.trim());
  } catch {}
}

export const DEFAULT_EXTERNAL_CONFIG: ExternalSoftwareConfig = {
  activeSoftware: 'render_backend',
  enabled: true,
  endpointUrl: DEFAULT_LIVE_RENDER_BACKEND_URL,
  apiKey: '',
  autoEvaluateOnMessage: false,
  exportFormat: 'ragas_dataset',
  webhookDestinationUrl: '',
  webhookAuthHeader: '',
  evalMetrics: {
    faithfulness: true,
    answerRelevancy: true,
    contextPrecision: true,
    hallucinationDetection: true,
    conciseness: true,
  },
};

export function getExternalConfig(): ExternalSoftwareConfig {
  try {
    const raw = localStorage.getItem(EXTERNAL_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Automatically route away from obsolete local ports 3001, 5000, 8000 to the live Render backend
      if (
        !parsed.endpointUrl ||
        parsed.endpointUrl.includes('localhost:3001') ||
        parsed.endpointUrl.includes('localhost:5000') ||
        parsed.endpointUrl.includes('localhost:8000')
      ) {
        parsed.endpointUrl = DEFAULT_LIVE_RENDER_BACKEND_URL;
        parsed.activeSoftware = 'render_backend';
        parsed.enabled = true;
      }
      return { ...DEFAULT_EXTERNAL_CONFIG, ...parsed };
    }
  } catch {}
  return DEFAULT_EXTERNAL_CONFIG;
}

export function saveExternalConfig(config: ExternalSoftwareConfig): void {
  try {
    localStorage.setItem(EXTERNAL_CONFIG_KEY, JSON.stringify(config));
  } catch {}
}

const RAGAS_TEST_CASES_KEY = 'createai_ragas_test_cases_v1';
const RAGAS_REPORTS_KEY = 'createai_ragas_reports_v1';

export function getRagasTestCases(): RagasTestCase[] {
  try {
    const raw = localStorage.getItem(RAGAS_TEST_CASES_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return [];
}

export function saveRagasTestCases(cases: RagasTestCase[]): void {
  try {
    localStorage.setItem(RAGAS_TEST_CASES_KEY, JSON.stringify(cases));
  } catch {}
}

export function getRagasReports(): RagasBenchmarkReport[] {
  try {
    const raw = localStorage.getItem(RAGAS_REPORTS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return [];
}

export function saveRagasReports(reports: RagasBenchmarkReport[]): void {
  try {
    localStorage.setItem(RAGAS_REPORTS_KEY, JSON.stringify(reports));
  } catch {}
}
