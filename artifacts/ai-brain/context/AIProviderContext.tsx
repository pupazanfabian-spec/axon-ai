
// Axon — Context AI Provider
// Gestionează setările Gemini / ChatGPT stocate local pe telefon

import React, {
  createContext, useCallback, useContext, useEffect, useRef, useState,
} from 'react';
import { Feather } from '@expo/vector-icons';
import {
  AIProvider, AIProviderSettings,
  callActiveProvider,
  loadProviderSettings, saveProviderSettings,
  testGeminiKey, testOpenAIKey,
  AXON_SYSTEM_PROMPT,
} from '@/engine/aiProviders';

export type FeatherIconName = React.ComponentProps<typeof Feather>['name'];

interface AIProviderContextType {
  settings: AIProviderSettings;
  isReady: boolean;
  isTesting: boolean;
  testError: string;

  setActiveProvider: (provider: AIProvider) => Promise<void>;
  saveGeminiKey: (key: string) => Promise<void>;
  saveOpenAIKey: (key: string) => Promise<void>;
  testKey: (provider: 'gemini' | 'openai', key: string) => Promise<boolean>;
  generate: (prompt: string, system?: string) => Promise<{ text: string; provider: AIProvider } | null>;
  clearError: () => void;
}

const AIProviderContext = createContext<AIProviderContextType | null>(null);

export function AIProviderProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AIProviderSettings>({
    activeProvider: 'none',
    geminiKey: '',
    openaiKey: '',
  });
  const [isReady, setIsReady] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testError, setTestError] = useState('');
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    loadProviderSettings().then(s => {
      setSettings(s);
      setIsReady(true);
    }).catch(() => setIsReady(true));
  }, []);

  const persist = useCallback(async (newSettings: AIProviderSettings) => {
    setSettings(newSettings);
    await saveProviderSettings(newSettings).catch(() => {});
  }, []);

  const setActiveProvider = useCallback(async (provider: AIProvider) => {
    await persist({ ...settings, activeProvider: provider });
  }, [settings, persist]);

  const saveGeminiKey = useCallback(async (key: string) => {
    await persist({ ...settings, geminiKey: key.trim() });
  }, [settings, persist]);

  const saveOpenAIKey = useCallback(async (key: string) => {
    await persist({ ...settings, openaiKey: key.trim() });
  }, [settings, persist]);

  const testKey = useCallback(async (provider: 'gemini' | 'openai', key: string): Promise<boolean> => {
    setIsTesting(true);
    setTestError('');
    try {
      const ok = provider === 'gemini'
        ? await testGeminiKey(key.trim())
        : await testOpenAIKey(key.trim());
      if (!ok) setTestError('Cheia nu este validă sau nu există conexiune la internet.');
      return ok;
    } catch {
      setTestError('Eroare la testarea cheii.');
      return false;
    } finally {
      setIsTesting(false);
    }
  }, []);

  const generate = useCallback(async (
    prompt: string,
    system?: string,
  ): Promise<{ text: string; provider: AIProvider } | null> => {
    if (settings.activeProvider === 'none') return null;
    return callActiveProvider(prompt, settings, system ?? AXON_SYSTEM_PROMPT);
  }, [settings]);

  const clearError = useCallback(() => setTestError(''), []);

  return (
    <AIProviderContext.Provider value={{
      settings, isReady, isTesting, testError,
      setActiveProvider, saveGeminiKey, saveOpenAIKey, testKey, generate, clearError,
    }}>
      {children}
    </AIProviderContext.Provider>
  );
}

export function useAIProvider() {
  const ctx = useContext(AIProviderContext);
  if (!ctx) throw new Error('useAIProvider must be used within AIProviderProvider');
  return ctx;
}

// Helper: icon și label pentru provider
export function providerLabel(provider: AIProvider): string {
  if (provider === 'gemini') return 'Gemini 1.5 Flash';
  if (provider === 'openai') return 'ChatGPT (GPT-4o mini)';
  return 'Fără AI cloud';
}

export function providerIcon(provider: AIProvider): FeatherIconName {
  if (provider === 'gemini') return 'zap';
  if (provider === 'openai') return 'message-circle';
  return 'cpu';
}
