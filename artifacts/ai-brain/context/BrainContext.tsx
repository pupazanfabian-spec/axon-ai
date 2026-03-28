
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Message, BrainState, LearnedDocument, processMessage, processDocument, createInitialBrainState, getProactiveThought } from '@/engine/brain';
import { createMindState } from '@/engine/mind';

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

const MESSAGES_KEY = '@axon_v3_messages';
const STATE_KEY = '@axon_v3_state';

const WELCOME: Message = {
  id: 'welcome',
  role: 'assistant',
  content: 'Salut! Sunt **Axon** — un AI cu minte proprie, funcționând complet offline. 🧠\n\n**Ce mă face diferit:**\n🤔 Am opinii formate pe baza cunoașterii mele\n🔗 Fac conexiuni între concepte — filosofie, știință, psihologie\n📄 Studiez fișierele pe care mi le trimiți\n💾 Nu uit nimic între sesiuni\n\nCum te cheamă? Sau întreabă-mă ceva — orice.',
  timestamp: new Date(),
};

export function BrainProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [isThinking, setIsThinking] = useState(false);
  const brainRef = useRef<BrainState>(createInitialBrainState());
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
          parsed.learnedDocuments = (parsed.learnedDocuments || []).map(d => ({
            ...d,
            addedAt: new Date(d.addedAt),
          }));
          // Asigura ca mindState exista intotdeauna
          if (!parsed.mindState) {
            parsed.mindState = createMindState();
          }
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
        AsyncStorage.setItem(MESSAGES_KEY, JSON.stringify(msgs.slice(-100))),
        AsyncStorage.setItem(STATE_KEY, JSON.stringify(state)),
      ]);
    } catch {}
  }, []);

  const addProactiveThought = useCallback(async (currentMsgs: Message[]) => {
    const thought = getProactiveThought(brainRef.current);
    if (!thought) return;

    // Pauza naturala — Axon pare ca se gandeste singur
    await new Promise(r => setTimeout(r, 2500 + Math.random() * 2000));

    const proactiveMsg: Message = {
      id: (Date.now() + 10).toString(),
      role: 'assistant',
      content: thought,
      timestamp: new Date(),
    };

    setMessages(prev => {
      const next = [...prev, proactiveMsg];
      persist(next, brainRef.current);
      return next;
    });
  }, [persist]);

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

    // Timp de gandire natural: 300–900ms
    const thinkMs = 300 + Math.random() * 600;
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
      // Verifica daca Axon vrea sa initieze un gand proactiv
      setTimeout(() => addProactiveThought(next), 100);
      return next;
    });

    setIsThinking(false);
  }, [persist, addProactiveThought]);

  const addDocument = useCallback(async (name: string, content: string) => {
    setIsThinking(true);
    await new Promise(r => setTimeout(r, 700));

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
      content: 'Conversația resetată! Sunt Axon, gata de la zero.\n\nDocumentele, memoria și cunoașterea mea sunt păstrate.',
      timestamp: new Date(),
    };
    setMessages([reset]);
    const docs = brainRef.current.learnedDocuments;
    const mem = brainRef.current.memory;
    const uname = brainRef.current.userName;
    brainRef.current = { ...createInitialBrainState(), learnedDocuments: docs, memory: mem, userName: uname };
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
