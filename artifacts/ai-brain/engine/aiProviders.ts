
// Axon — AI Providers: Gemini + ChatGPT direct calls de pe telefon
// Fără server intermediar — apeluri directe din aplicație
// Cheile sunt stocate local (AsyncStorage), nu transmise nicăieri altundeva

import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Chei de stocare ────────────────────────────────────────────────────────

const GEMINI_KEY_STORAGE = '@axon_gemini_api_key';
const OPENAI_KEY_STORAGE = '@axon_openai_api_key';
const ACTIVE_PROVIDER_STORAGE = '@axon_active_provider';

export type AIProvider = 'none' | 'gemini' | 'openai';

export interface AIProviderSettings {
  activeProvider: AIProvider;
  geminiKey: string;
  openaiKey: string;
}

// ─── Persistare chei locale ──────────────────────────────────────────────────

export async function saveProviderSettings(settings: AIProviderSettings): Promise<void> {
  await Promise.all([
    AsyncStorage.setItem(GEMINI_KEY_STORAGE, settings.geminiKey),
    AsyncStorage.setItem(OPENAI_KEY_STORAGE, settings.openaiKey),
    AsyncStorage.setItem(ACTIVE_PROVIDER_STORAGE, settings.activeProvider),
  ]);
}

export async function loadProviderSettings(): Promise<AIProviderSettings> {
  const [geminiKey, openaiKey, activeProvider] = await Promise.all([
    AsyncStorage.getItem(GEMINI_KEY_STORAGE),
    AsyncStorage.getItem(OPENAI_KEY_STORAGE),
    AsyncStorage.getItem(ACTIVE_PROVIDER_STORAGE),
  ]);
  return {
    geminiKey: geminiKey ?? '',
    openaiKey: openaiKey ?? '',
    activeProvider: (activeProvider as AIProvider) ?? 'none',
  };
}

// ─── Gemini 1.5 Flash ────────────────────────────────────────────────────────

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

const TIMEOUT_MS = 15000;

function fetchTimeout(url: string, init: RequestInit): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  return fetch(url, { ...init, signal: ctrl.signal }).finally(() => clearTimeout(timer));
}

export async function callGemini(
  prompt: string,
  apiKey: string,
  systemInstruction?: string,
): Promise<string | null> {
  if (!apiKey || apiKey.length < 10) return null;
  try {
    const body = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      ...(systemInstruction
        ? { systemInstruction: { parts: [{ text: systemInstruction }] } }
        : {}),
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 800,
        topP: 0.9,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      ],
    };

    const resp = await fetchTimeout(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      if (__DEV__) console.warn('[Axon Gemini] HTTP error:', resp.status);
      return null;
    }

    const data = await resp.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      error?: { message?: string };
    };

    if (data.error) {
      if (__DEV__) console.warn('[Axon Gemini] API error:', data.error.message);
      return null;
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return text && text.length > 1 ? text : null;
  } catch (e) {
    if (__DEV__) console.warn('[Axon Gemini] callGemini failed:', e);
    return null;
  }
}

// ─── ChatGPT (OpenAI) ────────────────────────────────────────────────────────

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export async function callChatGPT(
  prompt: string,
  apiKey: string,
  systemInstruction?: string,
): Promise<string | null> {
  if (!apiKey || apiKey.length < 10) return null;
  try {
    const messages: Array<{ role: string; content: string }> = [];
    if (systemInstruction) {
      messages.push({ role: 'system', content: systemInstruction });
    }
    messages.push({ role: 'user', content: prompt });

    const body = {
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 800,
      temperature: 0.7,
      top_p: 0.9,
    };

    const resp = await fetchTimeout(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      if (__DEV__) console.warn('[Axon ChatGPT] HTTP error:', resp.status);
      return null;
    }

    const data = await resp.json() as {
      choices?: Array<{ message?: { content?: string } }>;
      error?: { message?: string };
    };

    if (data.error) {
      if (__DEV__) console.warn('[Axon ChatGPT] API error:', data.error.message);
      return null;
    }

    const text = data.choices?.[0]?.message?.content?.trim();
    return text && text.length > 1 ? text : null;
  } catch (e) {
    if (__DEV__) console.warn('[Axon ChatGPT] callChatGPT failed:', e);
    return null;
  }
}

// ─── Apel unificat ───────────────────────────────────────────────────────────

export const AXON_SYSTEM_PROMPT =
  `Ești Axon, un asistent AI personal inteligent. ` +
  `Răspunzi ÎNTOTDEAUNA în română, concis și util. ` +
  `Ești direct, prietenos și rațional. Nu dai răspunsuri generice sau evazive.`;

export async function callActiveProvider(
  prompt: string,
  settings: AIProviderSettings,
  system?: string,
): Promise<{ text: string; provider: AIProvider } | null> {
  const sys = system ?? AXON_SYSTEM_PROMPT;

  if (settings.activeProvider === 'gemini' && settings.geminiKey) {
    const text = await callGemini(prompt, settings.geminiKey, sys);
    if (text) return { text, provider: 'gemini' };
  }

  if (settings.activeProvider === 'openai' && settings.openaiKey) {
    const text = await callChatGPT(prompt, settings.openaiKey, sys);
    if (text) return { text, provider: 'openai' };
  }

  return null;
}

// ─── Test de conectivitate ────────────────────────────────────────────────────

export async function testGeminiKey(apiKey: string): Promise<boolean> {
  const result = await callGemini('Răspunde cu un singur cuvânt: funcționează', apiKey);
  return result !== null;
}

export async function testOpenAIKey(apiKey: string): Promise<boolean> {
  const result = await callChatGPT('Răspunde cu un singur cuvânt: funcționează', apiKey);
  return result !== null;
}
