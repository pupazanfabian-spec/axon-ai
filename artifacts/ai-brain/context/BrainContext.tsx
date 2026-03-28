
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Message, BrainState, LearnedDocument, processMessage, processDocument } from '@/engine/brain';

interface BrainContextType {
  messages: Message[];
  isThinking: boolean;
  brainState: BrainState;
  sendMessage: (text: string) => Promise<void>;
  clearConversation: () => void;
  addDocument: (name: string, content: string) => Promise<void>;
  removeDocument: (id: string) => void;
}

const BrainContext = createContext<BrainContextType | null>(null);

const MESSAGES_KEY = '@axon_v2_messages';
const STATE_KEY = '@axon_v2_state';

const INITIAL_STATE: BrainState = {
  memory: {},
  userName: null,
  conversationCount: 0,
  learnedDocuments: [],
  lastTopics: [],
  mood: 'neutral',
};

const WELCOME: Message = {
  id: 'welcome',
  role: 'assistant',
  content: 'Salut! Sunt **Axon**, asistentul tău AI offline. 🧠\n\nFuncționez complet local — fără internet, fără chei API.\n\n**Ce pot face:**\n📖 Dicționar român integrat — "Ce este fotosinteza?"\n📄 Studiez fișiere — apasă 📎 și trimite documente\n🧠 Memorez informații — "Reține că..."\n🧮 Calcule matematice\n📅 Dată și oră exactă\n\nCum te cheamă?',
  timestamp: new Date(),
};

export function BrainProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [isThinking, setIsThinking] = useState(false);
  const brainRef = useRef<BrainState>({ ...INITIAL_STATE, learnedDocuments: [] });
  const [brainState, setBrainState] = useState<BrainState>(brainRef.current);
  const loaded = useRef(false);

  // Incarca starea salvata
  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    (async () => {
      try {
        const [savedMsgs, savedState] = await Promise.all([
          AsyncStorage.getItem(MESSAGES_KEY),
          AsyncStorage.getItem(STATE_KEY),
        ]);

        if (savedState) {
          const parsed = JSON.parse(savedState) as BrainState;
          // Reconvertim datele
          parsed.learnedDocuments = (parsed.learnedDocuments || []).map(d => ({
            ...d,
            addedAt: new Date(d.addedAt),
          }));
          brainRef.current = parsed;
          setBrainState({ ...parsed });
        }

        if (savedMsgs) {
          const msgs = (JSON.parse(savedMsgs) as Message[]).map(m => ({
            ...m,
            timestamp: new Date(m.timestamp),
          }));
          if (msgs.length > 0) setMessages(msgs);
        }
      } catch {}
    })();
  }, []);

  const persist = useCallback(async (msgs: Message[], state: BrainState) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(MESSAGES_KEY, JSON.stringify(msgs.slice(-80))),
        AsyncStorage.setItem(STATE_KEY, JSON.stringify(state)),
      ]);
    } catch {}
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsThinking(true);

    // Timp de gândire natural: 200–800ms
    const thinkMs = 200 + Math.random() * 600;
    await new Promise(r => setTimeout(r, thinkMs));

    const response = processMessage(text, brainRef.current);
    const updatedState = { ...brainRef.current };
    setBrainState(updatedState);

    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response,
      timestamp: new Date(),
    };

    setMessages(prev => {
      const next = [...prev, aiMsg];
      persist(next, brainRef.current);
      return next;
    });
    setIsThinking(false);
  }, [persist]);

  const addDocument = useCallback(async (name: string, content: string) => {
    setIsThinking(true);
    await new Promise(r => setTimeout(r, 600));

    const response = processDocument(name, content, brainRef.current);
    setBrainState({ ...brainRef.current });

    const aiMsg: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: response,
      timestamp: new Date(),
    };

    setMessages(prev => {
      const next = [...prev, aiMsg];
      persist(next, brainRef.current);
      return next;
    });
    setIsThinking(false);
  }, [persist]);

  const removeDocument = useCallback((id: string) => {
    brainRef.current.learnedDocuments = brainRef.current.learnedDocuments.filter(d => d.id !== id);
    setBrainState({ ...brainRef.current });
    AsyncStorage.setItem(STATE_KEY, JSON.stringify(brainRef.current));
  }, []);

  const clearConversation = useCallback(() => {
    const reset: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: 'Conversația a fost resetată! Sunt Axon, gata de la zero.\n\nDocumentele studiate și notițele au fost păstrate.',
      timestamp: new Date(),
    };
    setMessages([reset]);
    // Pastreaza documentele si memoria, reseteaza doar conversatia
    const docs = brainRef.current.learnedDocuments;
    const mem = brainRef.current.memory;
    const name = brainRef.current.userName;
    brainRef.current = { ...INITIAL_STATE, learnedDocuments: docs, memory: mem, userName: name };
    setBrainState({ ...brainRef.current });
    AsyncStorage.setItem(MESSAGES_KEY, JSON.stringify([reset]));
    AsyncStorage.setItem(STATE_KEY, JSON.stringify(brainRef.current));
  }, []);

  return (
    <BrainContext.Provider value={{
      messages, isThinking, brainState,
      sendMessage, clearConversation, addDocument, removeDocument,
    }}>
      {children}
    </BrainContext.Provider>
  );
}

export function useBrain() {
  const ctx = useContext(BrainContext);
  if (!ctx) throw new Error('useBrain must be used within BrainProvider');
  return ctx;
}
