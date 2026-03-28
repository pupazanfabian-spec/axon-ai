
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Message, BrainState, processMessage, processDocument,
  createInitialBrainState, archiveCurrentSession,
} from '@/engine/brain';
import { createMindState } from '@/engine/mind';
import { createSelfKnowledge } from '@/engine/learning';
import { createEntityTracker } from '@/engine/entities';
import { createInferenceEngine } from '@/engine/inference';
import { createTemporalMemory } from '@/engine/temporal';
import { createConstitutionState } from '@/engine/constitution';

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
  content: 'Salut! Sunt **Axon** — un AI cu minte proprie, funcționând complet offline. 🧠\n\n**Ce mă face diferit:**\n🤔 Am opinii formate pe baza cunoașterii mele\n🔗 Deduc logic din ce îmi spui\n👤 Rețin persoanele și entitățile menționate\n🕐 Știu ce am discutat azi, ieri, săptămâna trecută\n📄 Studiez fișierele pe care mi le trimiți\n💾 Nu uit nimic între sesiuni\n\nCum te cheamă? Sau întreabă-mă ceva — orice.',
  timestamp: new Date(),
};

export function BrainProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [isThinking, setIsThinking] = useState(false);
  const brainRef = useRef<BrainState>(createInitialBrainState());
  const [brainState, setBrainState] = useState<BrainState>(brainRef.current);
  const loaded = useRef(false);

  // Încarcă starea salvată cu migrare pentru câmpuri noi
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

          // Migrare documente
          parsed.learnedDocuments = (parsed.learnedDocuments || []).map(d => ({
            ...d,
            addedAt: new Date(d.addedAt),
          }));

          // Migrare câmpuri v3/v4
          if (!parsed.mindState) parsed.mindState = createMindState();
          if (!parsed.selfKnowledge) parsed.selfKnowledge = createSelfKnowledge();
          if (parsed.creatorId === undefined) parsed.creatorId = null;
          if (parsed.isCreatorPresent === undefined) parsed.isCreatorPresent = false;

          // Migrare câmpuri v5 (noi)
          if (!parsed.entityTracker) parsed.entityTracker = createEntityTracker();
          if (!parsed.inferenceEngine) parsed.inferenceEngine = createInferenceEngine();
          if (!parsed.temporalMemory) parsed.temporalMemory = createTemporalMemory();
          if (!parsed.constitutionState) parsed.constitutionState = createConstitutionState();

          // Migrare selfKnowledge v5
          if (!parsed.selfKnowledge.responseQualityMap) {
            parsed.selfKnowledge.responseQualityMap = {};
          }
          if (parsed.selfKnowledge.totalMessages === undefined) {
            parsed.selfKnowledge.totalMessages = 0;
          }
          // Migrare corrections (format vechi → nou)
          parsed.selfKnowledge.corrections = (parsed.selfKnowledge.corrections || []).map((c: any) => {
            if (typeof c === 'object' && 'wrong' in c) {
              return { wrongResponse: c.wrong, correction: c.correct, intent: 'unknown', at: Date.now() };
            }
            return c;
          });

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

    const thinkMs = 300 + Math.random() * 600;
    await new Promise(r => setTimeout(r, thinkMs));

    const history = messages.map(m => ({ role: m.role, content: m.content }));
    const response = processMessage(text, brainRef.current, history);
    setBrainState({ ...brainRef.current });

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
  }, [persist, messages]);

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
    // Arhivează sesiunea curentă în memoria temporală
    const msgCount = messages.filter(m => m.role === 'user').length;
    archiveCurrentSession(brainRef.current, msgCount);

    const reset: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: 'Conversația resetată! Sunt Axon, gata de la zero.\n\nDocumentele, memoria, entitățile și cunoașterea mea sunt păstrate.',
      timestamp: new Date(),
    };
    setMessages([reset]);

    // Păstrează tot ce e important între sesiuni
    const prev = brainRef.current;
    brainRef.current = {
      ...createInitialBrainState(),
      learnedDocuments: prev.learnedDocuments,
      memory: prev.memory,
      userName: prev.userName,
      selfKnowledge: prev.selfKnowledge,
      creatorId: prev.creatorId,
      isCreatorPresent: prev.isCreatorPresent,
      entityTracker: prev.entityTracker,
      inferenceEngine: prev.inferenceEngine,
      temporalMemory: prev.temporalMemory,
      constitutionState: prev.constitutionState, // Constituția NU se resetează
    };
    setBrainState({ ...brainRef.current });
    AsyncStorage.setItem(MESSAGES_KEY, JSON.stringify([reset]));
    AsyncStorage.setItem(STATE_KEY, JSON.stringify(brainRef.current));
  }, [messages]);

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
