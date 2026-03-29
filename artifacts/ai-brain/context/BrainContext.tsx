
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
import { useLLM } from '@/context/LLMContext';
import { searchOnline, isOnlineIntent } from '@/engine/webSearch';
import { detectQuestionType, synthesizeWebResponse, detectTopicCategory } from '@/engine/responseGenerator';
import { loadDynamicConceptsFromDB } from '@/engine/knowledge';
import type { EntityType } from '@/engine/entities';
import {
  getDB,
  autoPruneKnowledge,
  insertKnowledgeEntry,
  queryKnowledgeForAnswer,
  upsertEntity,
  loadAllEntities,
  saveBrainStateFull,
  loadBrainStateFull,
  saveMessagesFull,
  loadMessagesFull,
  markMigrationDone,
  isMigrationDone,
  type EntityData,
} from '@/engine/database';

interface BrainContextType {
  messages: Message[];
  isThinking: boolean;
  webSearching: boolean;
  brainState: BrainState;
  dbReady: boolean;
  sendMessage: (text: string) => Promise<void>;
  clearConversation: () => void;
  addDocument: (name: string, content: string) => Promise<void>;
  removeDocument: (id: string) => void;
}

const BrainContext = createContext<BrainContextType | null>(null);

// Keys AsyncStorage (folosite doar pentru migrare one-time)
const MESSAGES_KEY = '@axon_v3_messages';
const STATE_KEY = '@axon_v3_state';

const WELCOME: Message = {
  id: 'welcome',
  role: 'assistant',
  content: 'Salut! Sunt **Axon** — AI cu minte proprie, offline și online. 🧠\n\n**Ce pot face:**\n🤔 Răspund din 270+ subiecte din memorie\n📡 Caut pe internet când nu știu (Wikipedia, DuckDuckGo)\n🔗 Deduc logic din ce îmi spui\n👤 Rețin persoanele și entitățile menționate\n🕐 Știu ce am discutat azi, ieri, săptămâna trecută\n📄 Studiez fișierele pe care mi le trimiți\n💾 Nu uit nimic între sesiuni\n\n**Caută online:** spune "caută online [subiect]" sau întreabă orice — dacă nu știu din memorie, verific internetul automat.\n\nCum te cheamă? Sau întreabă-mă ceva — orice.',
  timestamp: new Date(),
};

// ─── Migrare stare din AsyncStorage ──────────────────────────────────────────

function migrateParsedState(parsed: BrainState): BrainState {
  parsed.learnedDocuments = (parsed.learnedDocuments || []).map(d => ({
    ...d,
    addedAt: new Date(d.addedAt),
  }));
  if (!parsed.mindState) parsed.mindState = createMindState();
  if (!parsed.selfKnowledge) parsed.selfKnowledge = createSelfKnowledge();
  if (parsed.creatorId === undefined) parsed.creatorId = null;
  if (parsed.isCreatorPresent === undefined) parsed.isCreatorPresent = false;
  if (!parsed.entityTracker) parsed.entityTracker = createEntityTracker();
  if (!parsed.inferenceEngine) parsed.inferenceEngine = createInferenceEngine();
  if (!parsed.temporalMemory) parsed.temporalMemory = createTemporalMemory();
  if (!parsed.constitutionState) parsed.constitutionState = createConstitutionState();
  if (!parsed.selfKnowledge.responseQualityMap) {
    parsed.selfKnowledge.responseQualityMap = {};
  }
  if (parsed.selfKnowledge.totalMessages === undefined) {
    parsed.selfKnowledge.totalMessages = 0;
  }
  parsed.selfKnowledge.corrections = (parsed.selfKnowledge.corrections || []).map((c: any) => {
    if (typeof c === 'object' && 'wrong' in c) {
      return { wrongResponse: c.wrong, correction: c.correct, intent: 'unknown', at: Date.now() };
    }
    return c;
  });
  return parsed;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function BrainProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [isThinking, setIsThinking] = useState(false);
  const [webSearching, setWebSearching] = useState(false);
  const [dbReady, setDbReady] = useState(false);
  const brainRef = useRef<BrainState>(createInitialBrainState());
  const [brainState, setBrainState] = useState<BrainState>(brainRef.current);
  const loaded = useRef(false);
  const { generate: llmGenerate, status: llmStatus } = useLLM();

  // ─── Startup: DB init → migrare → concepte dinamice → entități ────────────
  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    (async () => {
      try {
        // 1. Inițializează SQLite
        await getDB();
        setDbReady(true);

        // 2. Auto-pruning în background
        autoPruneKnowledge().catch(() => {});

        // 3. Încarcă conceptele dinamice salvate anterior din SQLite
        await loadDynamicConceptsFromDB();

        // 4. Verifică dacă migrarea din AsyncStorage a avut loc deja
        const migrationDone = await isMigrationDone();

        let stateJson: string | null = null;
        let msgsJson: string | null = null;

        if (!migrationDone) {
          // 4a. Prima rulare cu SQLite — migrează din AsyncStorage
          const [asMsgs, asState] = await Promise.all([
            AsyncStorage.getItem(MESSAGES_KEY),
            AsyncStorage.getItem(STATE_KEY),
          ]);

          stateJson = asState;
          msgsJson = asMsgs;

          // Salvează în SQLite
          if (asState) await saveBrainStateFull(asState);
          if (asMsgs) await saveMessagesFull(asMsgs);
          await markMigrationDone();
        } else {
          // 4b. Rulare normală — citește din SQLite
          [stateJson, msgsJson] = await Promise.all([
            loadBrainStateFull(),
            loadMessagesFull(),
          ]);
        }

        // 5. Parsează și aplică starea creierului
        if (stateJson) {
          try {
            const parsed = migrateParsedState(JSON.parse(stateJson) as BrainState);
            brainRef.current = parsed;
            setBrainState({ ...parsed });
          } catch {}
        }

        // 6. Parsează și aplică mesajele
        if (msgsJson) {
          try {
            const msgs = (JSON.parse(msgsJson) as Message[]).map(m => ({
              ...m,
              timestamp: new Date(m.timestamp),
            }));
            if (msgs.length > 0) setMessages(msgs);
          } catch {}
        }

        // 7. Sincronizează entitățile din SQLite → entityTracker (non-blocking)
        _syncEntitiesFromDB(brainRef.current);

      } catch (e) {
        // Fallback la AsyncStorage dacă SQLite nu funcționează
        setDbReady(false);
        try {
          const [asMsgs, asState] = await Promise.all([
            AsyncStorage.getItem(MESSAGES_KEY),
            AsyncStorage.getItem(STATE_KEY),
          ]);
          if (asState) {
            try {
              const parsed = migrateParsedState(JSON.parse(asState) as BrainState);
              brainRef.current = parsed;
              setBrainState({ ...parsed });
            } catch {}
          }
          if (asMsgs) {
            try {
              const msgs = (JSON.parse(asMsgs) as Message[]).map(m => ({
                ...m, timestamp: new Date(m.timestamp),
              }));
              if (msgs.length > 0) setMessages(msgs);
            } catch {}
          }
        } catch {}
      }
    })();
  }, []);

  // ─── Persistare ───────────────────────────────────────────────────────────

  const persist = useCallback(async (msgs: Message[], state: BrainState) => {
    const msgsSliced = msgs.slice(-100);
    const stateJson = JSON.stringify(state);
    const msgsJson = JSON.stringify(msgsSliced);
    try {
      // Primar: SQLite
      await Promise.all([
        saveBrainStateFull(stateJson),
        saveMessagesFull(msgsJson),
      ]);
    } catch {
      // Fallback: AsyncStorage
      try {
        await Promise.all([
          AsyncStorage.setItem(MESSAGES_KEY, msgsJson),
          AsyncStorage.setItem(STATE_KEY, stateJson),
        ]);
      } catch {}
    }
  }, []);

  // ─── Sincronizare entități din EntityTracker → SQLite ─────────────────────

  const persistEntities = useCallback((state: BrainState) => {
    const tracker = state.entityTracker;
    if (!tracker || !Array.isArray(tracker.entities) || tracker.entities.length === 0) return;
    // Non-blocking — salvează fiecare entitate în SQLite (cheie = normalized name)
    Promise.all(
      tracker.entities.map(entity => {
        const data: Record<string, string | number | undefined> = {
          value: entity.value,
          firstSeen: entity.firstSeen,
          occurrences: entity.occurrences,
          context: entity.context,
          relation: entity.relation,
        };
        return upsertEntity(entity.normalized, entity.type, data).catch(() => {});
      })
    ).catch(() => {});
  }, []);

  // ─── Auto-learn din web: salvează rezultatele în knowledge_entries ─────────

  const autoLearnFromWeb = useCallback(async (
    resultText: string,
    source: string,
    query: string,
  ) => {
    if (!dbReady) return;
    try {
      const domain = detectTopicCategory(query);
      await insertKnowledgeEntry({
        content: resultText.slice(0, 800),
        label: query.slice(0, 60),
        source: source || 'web',
        domain: domain || 'general',
        importance: 0.6,
      });
    } catch {}
  }, [dbReady]);

  // ─── sendMessage ──────────────────────────────────────────────────────────

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
    let response = processMessage(text, brainRef.current, history);

    // Detectează dacă utilizatorul vrea explicit căutare online
    const wantsOnline = isOnlineIntent(text);

    // Verifică dacă creierul clasic nu a dat un răspuns bun
    const isClassicFallback = response.startsWith('Nu am date') ||
      response.startsWith('Nu am găsit') ||
      response.startsWith('Subiect interesant') ||
      response.startsWith('Înțeleg ideea');

    // Fallback 1: LLM local (Phi-3 Mini) dacă e disponibil
    if (isClassicFallback && llmStatus === 'ready') {
      const state = brainRef.current;
      const llmResp = await llmGenerate(text, {
        userName: state.userName,
        creatorName: state.creatorId,
        learnedFacts: state.selfKnowledge.learnedFacts.slice(-20),
        history: history.slice(-12) as { role: 'user' | 'assistant'; content: string }[],
      });
      if (llmResp) {
        response = `🧠 ${llmResp}`;
      }
    }

    // Fallback 2: Interogare knowledge_entries (cunoaștere acumulată anterior din web) ÎNAINTE de internet
    // Dacă găsește un răspuns relevant, NU mai apelăm internetul (cu excepția intenției explicite)
    let answeredFromDB = false;
    if (isClassicFallback && dbReady) {
      try {
        const dbAnswer = await queryKnowledgeForAnswer(text, 0.4);
        if (dbAnswer) {
          const qType = detectQuestionType(text);
          // bumpKnowledgeAccess e apelat automat în queryKnowledgeForAnswer (importance += 0.05)
          response = synthesizeWebResponse(
            dbAnswer.content,
            dbAnswer.source ?? 'Memorie locală',
            text,
            qType,
            { userName: brainRef.current.userName ?? undefined },
          );
          answeredFromDB = true; // Short-circuit: nu mai apelăm internetul
        }
      } catch {}
    }

    // Fallback 3 / Intenție explicită: Căutare online (Wikipedia + DuckDuckGo)
    // Se execută dacă: utilizatorul cere explicit online, SAU nu s-a găsit în DB și e fallback clasic
    // searchOnline are cache SQLite 48h intern — apeluri repetate sunt instant (fără trafic de rețea)
    const shouldSearchOnline = wantsOnline || (isClassicFallback && !answeredFromDB);
    if (shouldSearchOnline) {
      setWebSearching(true);
      try {
        const onlineResult = await searchOnline(text);
        if (onlineResult.found) {
          const qType = detectQuestionType(text);
          response = synthesizeWebResponse(
            onlineResult.text,
            onlineResult.source,
            text,
            qType,
            { userName: brainRef.current.userName ?? undefined },
          );
          // Auto-learn: salvează rezultatul web în knowledge_entries (async, non-blocking)
          autoLearnFromWeb(onlineResult.text, onlineResult.source, text);
        }
      } catch {
        // Fără internet sau eroare — păstrăm răspunsul din DB sau local
      } finally {
        setWebSearching(false);
      }
    }

    setBrainState({ ...brainRef.current });

    // Persistează entitățile actualizate în SQLite (non-blocking)
    persistEntities(brainRef.current);

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
  }, [persist, messages, llmStatus, llmGenerate, autoLearnFromWeb, persistEntities, dbReady]);

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
    saveBrainStateFull(JSON.stringify(brainRef.current)).catch(() => {
      AsyncStorage.setItem(STATE_KEY, JSON.stringify(brainRef.current));
    });
  }, []);

  const clearConversation = useCallback(() => {
    const msgCount = messages.filter(m => m.role === 'user').length;
    archiveCurrentSession(brainRef.current, msgCount);

    const reset: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: 'Conversația resetată! Sunt Axon, gata de la zero.\n\nDocumentele, memoria, entitățile și cunoașterea mea sunt păstrate.',
      timestamp: new Date(),
    };
    setMessages([reset]);

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
      constitutionState: prev.constitutionState,
    };
    setBrainState({ ...brainRef.current });

    const stateJson = JSON.stringify(brainRef.current);
    const msgsJson = JSON.stringify([reset]);
    saveBrainStateFull(stateJson).catch(() => {
      AsyncStorage.setItem(STATE_KEY, stateJson);
    });
    saveMessagesFull(msgsJson).catch(() => {
      AsyncStorage.setItem(MESSAGES_KEY, msgsJson);
    });
  }, [messages]);

  return (
    <BrainContext.Provider value={{
      messages, isThinking, webSearching, brainState, dbReady,
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

// ─── Sincronizare entități din SQLite → EntityTracker (non-blocking) ──────────

async function _syncEntitiesFromDB(state: BrainState): Promise<void> {
  try {
    const rows = await loadAllEntities();
    if (rows.length === 0) return;
    if (!Array.isArray(state.entityTracker.entities)) {
      state.entityTracker.entities = [];
    }
    const existingNormalized = new Set(state.entityTracker.entities.map(e => e.normalized));
    for (const row of rows) {
      // Adaugă doar entitățile care nu există deja în tracker (evită duplicate)
      if (!existingNormalized.has(row.name)) {
        const VALID_ENTITY_TYPES: EntityType[] = ['person', 'place', 'number', 'concept', 'event'];
        const entityType: EntityType = VALID_ENTITY_TYPES.includes(row.type as EntityType)
          ? (row.type as EntityType)
          : 'concept';
        const edata: EntityData = row.data;
        state.entityTracker.entities.push({
          id: row.name,
          type: entityType,
          value: edata.value,
          normalized: row.name,
          firstSeen: edata.firstSeen,
          occurrences: edata.occurrences,
          context: edata.context,
          relation: edata.relation,
        });
        existingNormalized.add(row.name);
      }
    }
  } catch {}
}
