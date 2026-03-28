
// Sistem de auto-invatare si actualizare — Axon se imbunatateste dupa fiecare conversatie

export interface LearnedPattern {
  trigger: string;          // Ce a spus utilizatorul
  responseQuality: number;  // 0-1, calitatea raspunsului (estimata)
  topic: string;            // Subiectul discutiei
  timestamp: number;
}

export interface SelfKnowledge {
  // Topicuri pe care utilizatorul le-a intrebat frecvent
  topicFrequency: Record<string, number>;
  // Cuvinte cheie pe care Axon le-a invatat din conversatii
  learnedKeywords: Record<string, string>;
  // Stilul preferat al utilizatorului (scurt/lung, formal/informal)
  preferredStyle: 'concis' | 'detaliat' | 'normal';
  // Corectii primite de la utilizator
  corrections: { wrong: string; correct: string }[];
  // Sesiuni de conversatie completate
  sessionsCompleted: number;
  // Versiunea inteligentei (creste cu fiecare actualizare)
  intelligenceVersion: number;
  // Ce a invatat Axon din interactiuni (fapte noi)
  learnedFacts: string[];
  // Ultima actualizare
  lastUpdate: number;
}

export function createSelfKnowledge(): SelfKnowledge {
  return {
    topicFrequency: {},
    learnedKeywords: {},
    preferredStyle: 'normal',
    corrections: [],
    sessionsCompleted: 0,
    intelligenceVersion: 1,
    learnedFacts: [],
    lastUpdate: Date.now(),
  };
}

// ─── Detecteaza subiectul dintr-un mesaj ─────────────────────────────────────

const TOPIC_PATTERNS: [RegExp, string][] = [
  [/(fotosinteza|plante|biologie|celula|adn|evolutie|bacterii)/, 'biologie'],
  [/(fizica|gravitatie|cuantic|relativitate|energie|forta|viteza)/, 'fizica'],
  [/(matematica|calcul|ecuatie|geometrie|algebra|statistica|probabilitate)/, 'matematica'],
  [/(programare|cod|algoritm|calculator|software|hardware|internet)/, 'informatica'],
  [/(filosofie|constiinta|existenta|sens|adevar|realitate|gandire)/, 'filosofie'],
  [/(psihologie|emotie|comportament|memorie|invatare|personalitate)/, 'psihologie'],
  [/(economie|bani|inflatie|pib|investitie|piata|finante)/, 'economie'],
  [/(istorie|razboi|revolutie|civilizatie|imperiul|regele|antichitate)/, 'istorie'],
  [/(geografie|tara|oras|continent|ocean|munte|clima|romania)/, 'geografie'],
  [/(chimie|element|molecula|reactie|acid|baza|atom|periodic)/, 'chimie'],
  [/(cosmos|univers|stele|planeta|gaura neagra|spatiu|nasa)/, 'cosmologie'],
  [/(arta|pictura|muzica|literatura|cinema|arhitectura|cultura)/, 'cultura'],
  [/(sanatate|medicina|boala|tratament|vitamina|proteina|corp)/, 'medicina'],
  [/(religie|dumnezeu|credinta|spiritualitate|rugaciune|suflet)/, 'spiritualitate'],
];

export function detectTopic(text: string): string {
  const n = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const [pattern, topic] of TOPIC_PATTERNS) {
    if (pattern.test(n)) return topic;
  }
  return 'general';
}

// ─── Detecteaza stilul preferat ───────────────────────────────────────────────

export function detectPreferredStyle(messages: { role: string; content: string }[]): 'concis' | 'detaliat' | 'normal' {
  const userMessages = messages.filter(m => m.role === 'user');
  if (userMessages.length < 3) return 'normal';

  const avgLength = userMessages.reduce((sum, m) => sum + m.content.length, 0) / userMessages.length;

  // Mesaje scurte → utilizatorul prefera stil concis
  if (avgLength < 25) return 'concis';
  // Mesaje lungi → utilizatorul prefera detalii
  if (avgLength > 80) return 'detaliat';
  return 'normal';
}

// ─── Auto-actualizare dupa fiecare mesaj ─────────────────────────────────────

export function selfUpdate(
  userMessage: string,
  aiResponse: string,
  sk: SelfKnowledge,
  messageHistory: { role: string; content: string }[]
): void {
  const topic = detectTopic(userMessage);

  // Actualizeaza frecventa topicurilor
  sk.topicFrequency[topic] = (sk.topicFrequency[topic] || 0) + 1;

  // Extrage cuvinte cheie noi (substantive potentiale, >5 litere)
  const words = userMessage
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 5 && /^[a-z\u00c0-\u017f]+$/.test(w));
  
  for (const word of words) {
    if (!sk.learnedKeywords[word]) {
      sk.learnedKeywords[word] = topic;
    }
  }

  // Detecteaza corectii ("nu, ..." sau "gresit" sau "incorect")
  const correctionMatch = userMessage.match(/^(?:nu[,!]?\s+|gresit[,!]?\s+|incorect[,!]?\s+)(.+)/i);
  if (correctionMatch && sk.corrections.length < 50) {
    const lastAiResponse = messageHistory.filter(m => m.role === 'assistant').slice(-1)[0]?.content || '';
    sk.corrections.push({
      wrong: lastAiResponse.slice(0, 100),
      correct: correctionMatch[1].trim(),
    });
  }

  // Invata fapte noi ("stii ca..." sau "de fapt..." sau "reține că...")
  const factMatch = userMessage.match(/(?:stiai ca|de fapt|retine ca|faptul ca|important:)\s+(.{10,150})/i);
  if (factMatch && sk.learnedFacts.length < 100) {
    const fact = factMatch[1].trim();
    if (!sk.learnedFacts.includes(fact)) {
      sk.learnedFacts.push(fact);
    }
  }

  // Actualizeaza stilul preferat
  sk.preferredStyle = detectPreferredStyle(messageHistory);

  // Creste versiunea inteligentei la fiecare 10 mesaje
  const totalMessages = Object.values(sk.topicFrequency).reduce((a, b) => a + b, 0);
  sk.intelligenceVersion = 1 + Math.floor(totalMessages / 10);

  sk.lastUpdate = Date.now();
}

// ─── Genereaza un rezumat al invatarii ───────────────────────────────────────

export function getLearningReport(sk: SelfKnowledge): string {
  const topTopics = Object.entries(sk.topicFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic, count]) => `${topic} (${count}x)`);

  const lines = [
    `**Raport auto-actualizare — Versiunea ${sk.intelligenceVersion}**`,
    '',
    `📊 **Topicuri studiate:** ${topTopics.join(', ') || 'niciuna încă'}`,
    `📝 **Fapte noi învățate:** ${sk.learnedFacts.length}`,
    `🔧 **Corectii primite:** ${sk.corrections.length}`,
    `💬 **Stil conversație detectat:** ${sk.preferredStyle}`,
    `🧠 **Cuvinte cheie indexate:** ${Object.keys(sk.learnedKeywords).length}`,
    `⏱️ **Ultima actualizare:** acum`,
  ];

  if (sk.learnedFacts.length > 0) {
    lines.push('', `**Ultimele fapte reținute:**`);
    sk.learnedFacts.slice(-3).forEach((f, i) => lines.push(`${i + 1}. ${f}`));
  }

  return lines.join('\n');
}

// ─── Adapteaza raspunsul la stilul detectat ───────────────────────────────────

export function adaptResponseStyle(response: string, style: 'concis' | 'detaliat' | 'normal'): string {
  if (style === 'concis') {
    // Scurteaza raspunsul — ia primul paragraf util
    const paragraphs = response.split('\n\n').filter(p => p.trim().length > 0);
    if (paragraphs.length > 2) {
      return paragraphs.slice(0, 2).join('\n\n');
    }
  }
  return response;
}
