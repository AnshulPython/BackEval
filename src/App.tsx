/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  AIModel,
  AIProviderId,
  ChatMessage,
  ChatSession,
  ModelCapabilitiesConfig,
  UserAccount,
  VoiceConfig,
  ThemeMode,
} from './types';
import {
  getActiveProvider,
  setActiveProvider,
  getActiveModel,
  setActiveModel,
  getCapabilitiesConfig,
  saveCapabilitiesConfig,
  getChatSessions,
  saveChatSessions,
  getActiveSessionId,
  setActiveSessionId,
  getStoredApiKeys,
  getProviderPlan,
  getFilterOnlyAvailableModels,
  getStoredTheme,
  saveStoredTheme,
  applyThemeToDocument,
  resolveActualTheme,
} from './utils/storage';
import { PROVIDER_MODELS } from './data/providersAndModels';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { ProviderSelectorModal } from './components/ProviderSelectorModal';
import { ModelSelectorModal } from './components/ModelSelectorModal';
import { CapabilitiesSettingsModal } from './components/CapabilitiesSettingsModal';
import { SecretPromptModal } from './components/SecretPromptModal';
import { RagasEvaluationModal } from './components/RagasEvaluationModal';
import { VoiceSelectorPopover } from './components/VoiceSelectorPopover';
import { speakMessage, getStoredVoiceConfig, saveStoredVoiceConfig } from './utils/speech';

export default function App() {
  const [provider, setProviderState] = useState<AIProviderId>(getActiveProvider());
  const [modelId, setModelIdState] = useState<string>(getActiveModel(getActiveProvider()));
  const [models, setModels] = useState<AIModel[]>(
    PROVIDER_MODELS[getActiveProvider()] || []
  );
  const [accountChecked, setAccountChecked] = useState<boolean>(false);
  const [totalAccountModels, setTotalAccountModels] = useState<number>(0);
  const [isRefreshingModels, setIsRefreshingModels] = useState<boolean>(false);
  const [capabilities, setCapabilitiesState] = useState<ModelCapabilitiesConfig>(
    getCapabilitiesConfig()
  );
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionIdState] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [hasGeminiEnvKey, setHasGeminiEnvKey] = useState<boolean>(false);

  // Voice State
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);
  const [voiceConfig, setVoiceConfig] = useState<VoiceConfig>(() =>
    capabilities.voiceConfig || getStoredVoiceConfig()
  );

  // Modals state
  const [isProviderModalOpen, setIsProviderModalOpen] = useState<boolean>(false);
  const [isModelModalOpen, setIsModelModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isSecretPromptModalOpen, setIsSecretPromptModalOpen] = useState<boolean>(false);
  const [isRagasModalOpen, setIsRagasModalOpen] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : false
  );

  // Theme State
  const [theme, setThemeState] = useState<ThemeMode>(() => getStoredTheme());
  const [actualTheme, setActualTheme] = useState<'dark' | 'light'>(() =>
    resolveActualTheme(getStoredTheme())
  );

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const actual = applyThemeToDocument(theme);
    setActualTheme(actual);

    if (theme === 'system' && typeof window !== 'undefined' && window.matchMedia) {
      const media = window.matchMedia('(prefers-color-scheme: light)');
      const listener = () => {
        const updated = applyThemeToDocument('system');
        setActualTheme(updated);
      };
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }
  }, [theme]);

  const handleThemeChange = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    saveStoredTheme(newTheme);
    setActualTheme(applyThemeToDocument(newTheme));
  };

  const handleToggleTheme = () => {
    const next: ThemeMode = actualTheme === 'dark' ? 'light' : 'dark';
    handleThemeChange(next);
  };

  const fetchAccountModels = async (targetProvider: AIProviderId = provider) => {
    setIsRefreshingModels(true);
    const keys = getStoredApiKeys();
    const apiKey = keys[targetProvider] || '';
    const customBaseUrl = keys.customBaseUrl;
    const plan = getProviderPlan(targetProvider);
    const onlyAvailable = getFilterOnlyAvailableModels();

    try {
      const res = await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: targetProvider,
          apiKey,
          customBaseUrl,
          plan,
          onlyAvailable,
        }),
      });
      const data = await res.json();
      if (data.models && Array.isArray(data.models)) {
        setModels(data.models);
        setAccountChecked(Boolean(data.accountChecked));
        setTotalAccountModels(data.totalAccountModels || data.models.length);

        if (!data.models.some((m: AIModel) => m.id === modelId)) {
          const recommended = data.models.find((m: AIModel) => m.recommended) || data.models[0];
          if (recommended) {
            setModelIdState(recommended.id);
            setActiveModel(targetProvider, recommended.id);
          }
        }
      }
    } catch {
      setModels(PROVIDER_MODELS[targetProvider] || []);
      setAccountChecked(false);
    } finally {
      setIsRefreshingModels(false);
    }
  };

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data.hasGeminiEnvKey) {
          setHasGeminiEnvKey(true);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const loadedSessions = getChatSessions();
    if (loadedSessions.length > 0) {
      setSessions(loadedSessions);
      const savedActiveId = getActiveSessionId();
      if (savedActiveId && loadedSessions.some((s) => s.id === savedActiveId)) {
        setActiveSessionIdState(savedActiveId);
      } else {
        setActiveSessionIdState(loadedSessions[0].id);
      }
    } else {
      const initialSession: ChatSession = {
        id: Math.random().toString(36).substring(2, 9),
        title: 'New Conversation',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        provider: getActiveProvider(),
        model: getActiveModel(getActiveProvider()),
        messages: [],
        capabilities: getCapabilitiesConfig(),
      };
      setSessions([initialSession]);
      setActiveSessionIdState(initialSession.id);
      saveChatSessions([initialSession]);
      setActiveSessionId(initialSession.id);
    }
  }, []);

  useEffect(() => {
    fetchAccountModels(provider);
  }, [provider]);

  const currentSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];
  const messages = currentSession?.messages || [];

  const updateSessionMessages = (
    sessionId: string,
    updater: (prevMessages: ChatMessage[]) => ChatMessage[],
    titleUpdate?: string,
    persistToStorage: boolean = true
  ) => {
    setSessions((prev) => {
      const next = prev.map((sess) => {
        if (sess.id === sessionId) {
          const newMsgs = updater(sess.messages);
          return {
            ...sess,
            messages: newMsgs,
            updatedAt: Date.now(),
            title: titleUpdate || sess.title,
          };
        }
        return sess;
      });
      if (persistToStorage) {
        saveChatSessions(next);
      }
      return next;
    });
  };

  const handleProviderChanged = (newProvider: AIProviderId) => {
    setProviderState(newProvider);
    setActiveProvider(newProvider);
    const newModel = getActiveModel(newProvider);
    setModelIdState(newModel);
    fetchAccountModels(newProvider);
  };

  const handleModelSelected = (newModelId: string) => {
    setModelIdState(newModelId);
    setActiveModel(provider, newModelId);
    if (activeSessionId) {
      setSessions((prev) => {
        const next = prev.map((s) =>
          s.id === activeSessionId ? { ...s, model: newModelId } : s
        );
        saveChatSessions(next);
        return next;
      });
    }
  };

  const handleCapabilitiesChange = (newConfig: ModelCapabilitiesConfig) => {
    setCapabilitiesState(newConfig);
    saveCapabilitiesConfig(newConfig);
  };

  const handleVoiceConfigChange = (newConfig: VoiceConfig) => {
    setVoiceConfig(newConfig);
    saveStoredVoiceConfig(newConfig);
    const updated = {
      ...capabilities,
      voiceConfig: newConfig,
    };
    setCapabilitiesState(updated);
    saveCapabilitiesConfig(updated);
  };

  const handleSaveSecretPrompt = (newPrompt: string, newEnabled: boolean) => {
    const updatedCaps: ModelCapabilitiesConfig = {
      ...capabilities,
      secretPrompt: newPrompt,
      secretPromptEnabled: newEnabled,
    };
    setCapabilitiesState(updatedCaps);
    saveCapabilitiesConfig(updatedCaps);
    if (activeSessionId) {
      setSessions((prev) => {
        const next = prev.map((s) =>
          s.id === activeSessionId
            ? {
                ...s,
                secretPrompt: newPrompt,
                secretPromptEnabled: newEnabled,
                capabilities: updatedCaps,
              }
            : s
        );
        saveChatSessions(next);
        return next;
      });
    }
  };

  const handleUpdateSessionMessages = (updatedMessages: ChatMessage[]) => {
    if (!activeSessionId) return;
    setSessions((prev) => {
      const next = prev.map((s) =>
        s.id === activeSessionId
          ? { ...s, messages: updatedMessages, updatedAt: Date.now() }
          : s
      );
      saveChatSessions(next);
      return next;
    });
  };

  const handleImportSessions = (importedSessions: ChatSession[]) => {
    setSessions((prev) => {
      const existingIds = new Set(prev.map((s) => s.id));
      const toAdd = importedSessions.filter((s) => !existingIds.has(s.id));
      const next = [...toAdd, ...prev];
      saveChatSessions(next);
      if (toAdd.length > 0) {
        setActiveSessionIdState(toAdd[0].id);
        setActiveSessionId(toAdd[0].id);
      }
      return next;
    });
  };

  const handleNewChat = () => {
    if (isStreaming) {
      handleStopStreaming();
    }
    const newSession: ChatSession = {
      id: Math.random().toString(36).substring(2, 9),
      title: 'New Conversation',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      provider,
      model: modelId,
      messages: [],
      capabilities,
    };
    setSessions((prev) => {
      const next = [newSession, ...prev];
      saveChatSessions(next);
      return next;
    });
    setActiveSessionIdState(newSession.id);
    setActiveSessionId(newSession.id);
  };

  const handleDeleteSession = (id: string) => {
    // If active session is streaming and being deleted, abort stream
    if (activeSessionId === id && isStreaming) {
      handleStopStreaming();
    }

    setSessions((prev) => {
      const remaining = prev.filter((s) => s.id !== id);
      if (remaining.length === 0) {
        // Create brand new conversation and wipe the deleted one from storage
        const freshSession: ChatSession = {
          id: Math.random().toString(36).substring(2, 9),
          title: 'New Conversation',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          provider,
          model: modelId,
          messages: [],
          capabilities,
        };
        saveChatSessions([freshSession]);
        setActiveSessionIdState(freshSession.id);
        setActiveSessionId(freshSession.id);
        return [freshSession];
      }

      saveChatSessions(remaining);
      if (activeSessionId === id) {
        const deletedIndex = prev.findIndex((s) => s.id === id);
        const nextIndex = Math.min(Math.max(0, deletedIndex), remaining.length - 1);
        const nextActive = remaining[nextIndex];
        setActiveSessionIdState(nextActive.id);
        setActiveSessionId(nextActive.id);
      }
      return remaining;
    });
  };

  // Keyboard shortcut to toggle sidebar anywhere
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsSidebarOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleAddImageMessage = (imageData: {
    url: string;
    prompt: string;
    aspectRatio: string;
    modelUsed: string;
  }) => {
    if (!currentSession) return;
    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      role: 'user',
      content: `Create an image (${imageData.aspectRatio}): ${imageData.prompt}`,
      timestamp: Date.now(),
    };
    const assistantMsg: ChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      role: 'assistant',
      content: `Here is the artwork generated for **"${imageData.prompt}"**:`,
      timestamp: Date.now(),
      modelUsed: imageData.modelUsed,
      providerUsed: provider,
      generatedImage: imageData,
    };
    updateSessionMessages(
      currentSession.id,
      (prev) => [...prev, userMsg, assistantMsg],
      currentSession.messages.length === 0 ? imageData.prompt.slice(0, 36) : undefined
    );
  };

  const handleRenameSession = (id: string, newTitle: string) => {
    setSessions((prev) => {
      const updated = prev.map((s) => (s.id === id ? { ...s, title: newTitle } : s));
      saveChatSessions(updated);
      return updated;
    });
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  };

  const handleSendMessage = async (
    content: string,
    attachments?: ChatMessage['attachments']
  ) => {
    if (!currentSession) return;
    const userMessage: ChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      role: 'user',
      content,
      attachments,
      timestamp: Date.now(),
    };

    const assistantMessageId = Math.random().toString(36).substring(2, 9);
    const assistantPlaceholder: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      thinking: '',
      timestamp: Date.now(),
      modelUsed: modelId,
      providerUsed: provider,
      isStreaming: true,
    };

    const shouldUpdateTitle = messages.length === 0;
    const newTitle = shouldUpdateTitle
      ? content.slice(0, 36) + (content.length > 36 ? '...' : '')
      : undefined;

    updateSessionMessages(
      currentSession.id,
      (prev) => [...prev, userMessage, assistantPlaceholder],
      newTitle
    );

    setIsStreaming(true);
    const keys = getStoredApiKeys();
    const apiKey = keys[provider] || '';
    const customBaseUrl = keys.customBaseUrl;
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const startTime = Date.now();

    const historyDepth = capabilities.memoryDepth > 0 ? capabilities.memoryDepth : 40;
    const historyToSend = [...messages, userMessage].slice(-historyDepth);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          apiKey,
          customBaseUrl,
          model: modelId,
          messages: historyToSend,
          capabilities,
          secretPrompt: currentSession?.secretPrompt ?? capabilities.secretPrompt,
          secretPromptEnabled:
            currentSession?.secretPromptEnabled ?? capabilities.secretPromptEnabled,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedContent = '';
      let accumulatedThinking = '';
      let accumulatedSources: Array<{ title: string; url: string }> = [];

      if (!reader) throw new Error('Stream reader not available');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6);
            if (dataStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.error) {
                const errObj = new Error(parsed.error);
                (errObj as any).isRateLimit = Boolean(parsed.isRateLimit);
                throw errObj;
              }
              if (parsed.chunk) {
                accumulatedContent += parsed.chunk;
              }
              if (parsed.modelUsed && parsed.modelUsed !== modelId) {
                // If fallback model was used, update model ID in session
                setModelIdState(parsed.modelUsed);
              }
              if (parsed.thinkingChunk) {
                accumulatedThinking += parsed.thinkingChunk;
              }
              if (parsed.sources && Array.isArray(parsed.sources)) {
                accumulatedSources = [...accumulatedSources, ...parsed.sources];
              }

              updateSessionMessages(
                currentSession.id,
                (prev) =>
                  prev.map((m) =>
                    m.id === assistantMessageId
                      ? {
                          ...m,
                          content: accumulatedContent,
                          thinking: accumulatedThinking,
                          sources: accumulatedSources,
                          modelUsed: parsed.modelUsed || m.modelUsed,
                        }
                      : m
                  ),
                undefined,
                false
              );
            } catch (err: any) {
              if (err.message && !err.message.includes('JSON')) {
                throw err;
              }
            }
          }
        }
      }

      const durationMs = Date.now() - startTime;
      updateSessionMessages(
        currentSession.id,
        (prev) =>
          prev.map((m) =>
            m.id === assistantMessageId
              ? {
                  ...m,
                  isStreaming: false,
                  durationMs,
                }
              : m
          ),
        undefined,
        true
      );

      // Auto-read aloud if enabled with user's chosen voice
      if (capabilities.ttsEnabled && accumulatedContent) {
        speakMessage(accumulatedContent, {
          messageId: assistantMessageId,
          voiceConfig,
        });
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        updateSessionMessages(currentSession.id, (prev) =>
          prev.map((m) =>
            m.id === assistantMessageId ? { ...m, isStreaming: false } : m
          )
        );
      } else {
        let rawErr = String(err.message || 'Failed to complete request');
        let isRateLimit = Boolean(err.isRateLimit);

        try {
          const stripped = rawErr.replace(/^[a-zA-Z0-9_]+:\s*/, '').trim();
          if (stripped.startsWith('{') && stripped.endsWith('}')) {
            const parsedJson = JSON.parse(stripped);
            if (parsedJson.error?.code === 429 || parsedJson.error?.status === 'RESOURCE_EXHAUSTED') {
              isRateLimit = true;
              rawErr = parsedJson.error.message || 'You exceeded your current Google Gemini free API quota (429 RESOURCE_EXHAUSTED).';
            }
          }
        } catch {}

        if (
          rawErr.includes('429') ||
          rawErr.includes('RESOURCE_EXHAUSTED') ||
          rawErr.includes('quota') ||
          rawErr.includes('rate-limit')
        ) {
          isRateLimit = true;
          rawErr = 'Google Gemini API quota temporarily exceeded (HTTP 429 Rate Limit).';
        }

        updateSessionMessages(currentSession.id, (prev) =>
          prev.map((m) =>
            m.id === assistantMessageId
              ? {
                  ...m,
                  content: '',
                  error: rawErr,
                  isRateLimit,
                  isStreaming: false,
                }
              : m
          )
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleRegenerate = () => {
    if (messages.length === 0) return;
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUserMsg) return;

    updateSessionMessages(currentSession.id, (prev) => {
      let idx = -1;
      for (let i = prev.length - 1; i >= 0; i--) {
        if (prev[i].role === 'assistant') {
          idx = i;
          break;
        }
      }
      if (idx !== -1) {
        return prev.slice(0, idx);
      }
      return prev;
    });

    handleSendMessage(lastUserMsg.content, lastUserMsg.attachments);
  };

  const storedKeys = getStoredApiKeys();
  const isKeyConnected = Boolean(
    storedKeys[provider] || (provider === 'gemini' && hasGeminiEnvKey)
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#131314] font-sans text-[#e3e3e3] antialiased select-text">
      {/* Sidebar */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={(id) => {
          setActiveSessionIdState(id);
          setActiveSessionId(id);
          const targetSession = sessions.find((s) => s.id === id);
          if (targetSession) {
            if (targetSession.model) {
              setModelIdState(targetSession.model);
            }
            if (targetSession.provider && targetSession.provider !== provider) {
              setProviderState(targetSession.provider);
              fetchAccountModels(targetSession.provider);
            }
          }
        }}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        onOpenProviderModal={() => setIsProviderModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onOpenRagasModal={() => setIsRagasModalOpen(true)}
        onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
        activeProvider={provider}
        activeModelId={modelId}
        isOpen={isSidebarOpen}
        onToggleOpen={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Chat Area */}
      <main className="flex-1 min-w-0 flex flex-col h-full min-h-0 overflow-hidden relative">
        <ChatArea
          messages={messages}
          currentSession={currentSession}
          isStreaming={isStreaming}
          onSendMessage={handleSendMessage}
          onStopStreaming={handleStopStreaming}
          onRegenerate={handleRegenerate}
          activeProvider={provider}
          activeModelId={modelId}
          capabilities={capabilities}
          onChangeCapabilities={handleCapabilitiesChange}
          onOpenProviderModal={() => setIsProviderModalOpen(true)}
          onOpenModelModal={() => setIsModelModalOpen(true)}
          onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
          isKeyConnected={isKeyConnected}
          accountChecked={accountChecked}
          totalAccountModels={totalAccountModels}
          onRefreshAccountModels={() => fetchAccountModels(provider)}
          isRefreshingModels={isRefreshingModels}
          models={models}
          onSelectModel={handleModelSelected}
          onOpenSecretPromptModal={() => setIsSecretPromptModalOpen(true)}
          onOpenRagasModal={() => setIsRagasModalOpen(true)}
          onAddImageMessage={handleAddImageMessage}
        />
      </main>

      {/* Provider & API Key Modal */}
      <ProviderSelectorModal
        isOpen={isProviderModalOpen}
        onClose={() => setIsProviderModalOpen(false)}
        activeProvider={provider}
        onProviderChanged={handleProviderChanged}
        hasGeminiEnvKey={hasGeminiEnvKey}
      />

      {/* Models Showcase & Selection Modal */}
      <ModelSelectorModal
        isOpen={isModelModalOpen}
        onClose={() => setIsModelModalOpen(false)}
        provider={provider}
        models={models}
        activeModelId={modelId}
        onSelectModel={handleModelSelected}
        onOpenProviderModal={() => {
          setIsModelModalOpen(false);
          setIsProviderModalOpen(true);
        }}
        onRefreshAccountModels={() => fetchAccountModels(provider)}
        onPlanChanged={() => fetchAccountModels(provider)}
        isRefreshing={isRefreshingModels}
        accountChecked={accountChecked}
        totalAccountModels={totalAccountModels}
      />

      {/* Capabilities & Settings Modal */}
      <CapabilitiesSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        config={capabilities}
        onChangeConfig={handleCapabilitiesChange}
        activeModelId={modelId}
        onOpenSecretPrompt={() => setIsSecretPromptModalOpen(true)}
        onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
      />

      {/* Inviolable Secret Prompt Modal */}
      <SecretPromptModal
        isOpen={isSecretPromptModalOpen}
        onClose={() => setIsSecretPromptModalOpen(false)}
        secretPrompt={currentSession?.secretPrompt ?? capabilities.secretPrompt ?? ''}
        isEnabled={Boolean(
          currentSession?.secretPromptEnabled ?? capabilities.secretPromptEnabled
        )}
        onSave={handleSaveSecretPrompt}
      />

      {/* Ragas Evaluation & Quality Center Modal */}
      <RagasEvaluationModal
        isOpen={isRagasModalOpen}
        onClose={() => setIsRagasModalOpen(false)}
        activeSession={currentSession}
        onUpdateSessionMessages={handleUpdateSessionMessages}
        activeModelId={modelId}
        onImportSessions={handleImportSessions}
      />

      {/* Changeable Voice Popover */}
      <VoiceSelectorPopover
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        currentVoiceConfig={voiceConfig}
        onVoiceChange={handleVoiceConfigChange}
      />
    </div>
  );
}
