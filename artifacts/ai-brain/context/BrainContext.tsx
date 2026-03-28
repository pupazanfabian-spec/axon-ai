
import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Message, BrainState, processMessage } from '@/engine/brain';

interface BrainContextType {
  messages: Message[];
  isThinking: boolean;
  brainState: BrainState;
  sendMessage: (text: string) => Promise<void>;
  clearConversation: () => void;
}

const BrainContext = createContext<BrainContextType | null>(null);

const STORAGE_KEY = '@axon_messages';
const STATE_KEY = '@axon_state';

export function BrainProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: 'Salut! Sunt **Axon**, asistentul tău AI offline. 🧠\n\nFuncționez complet local — fără internet, fără API keys!\n\nPot să:\n• Calculez expresii matematice\n• Îți spun ora și data\n• Memorez informații\n• Răspund la întrebări\n• Și mult mai mult!\n\nCum te pot ajuta?',
      timestamp: new Date(),
    },
  ]);
  const [isThinking, setIsThinking] = useState(false);
  
  const brainStateRef = useRef<BrainState>({
    memory: {},
    userName: null,
    conversationCount: 0,
  });
  
  const [brainState, setBrainState] = useState<BrainState>(brainStateRef.current);

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
    
    // Simuleaza gandirea (100-600ms pentru naturalete)
    const thinkingTime = 100 + Math.random() * 500;
    
    await new Promise(resolve => setTimeout(resolve, thinkingTime));
    
    const response = processMessage(text, brainStateRef.current);
    setBrainState({ ...brainStateRef.current });
    
    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, aiMsg]);
    setIsThinking(false);
    
    // Salveaza in AsyncStorage
    try {
      const allMsgs = [...messages, userMsg, aiMsg];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(allMsgs.slice(-50)));
      await AsyncStorage.setItem(STATE_KEY, JSON.stringify(brainStateRef.current));
    } catch {}
  }, [messages]);
  
  const clearConversation = useCallback(() => {
    const greeting: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: 'Conversația a fost resetată. Sunt Axon, gata pentru un nou start! Cum te pot ajuta?',
      timestamp: new Date(),
    };
    setMessages([greeting]);
    brainStateRef.current = {
      memory: {},
      userName: null,
      conversationCount: 0,
    };
    setBrainState({ ...brainStateRef.current });
    AsyncStorage.removeItem(STORAGE_KEY);
    AsyncStorage.removeItem(STATE_KEY);
  }, []);

  return (
    <BrainContext.Provider value={{ messages, isThinking, brainState, sendMessage, clearConversation }}>
      {children}
    </BrainContext.Provider>
  );
}

export function useBrain() {
  const ctx = useContext(BrainContext);
  if (!ctx) throw new Error('useBrain must be used within BrainProvider');
  return ctx;
}
