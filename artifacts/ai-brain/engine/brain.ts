
// Axon AI Brain v5 — Semantic, inferential, entity-aware, temporally conscious

import { findRelevantConcept, findRelevantConceptExtended, CONCEPTS, addDynamicConcept } from './knowledge';
import { MindState, createMindState, generateDeepResponse } from './mind';
import {
  SelfKnowledge, createSelfKnowledge, selfUpdate,
  adaptResponseStyle, getLearningReport, detectTopic,
  isCorrectionMessage, findRelevantCorrection,
} from './learning';
import { extractKeywords, relevanceScore, fuzzyContains, norm } from './semantic';
import {
  EntityTracker, createEntityTracker, updateEntityTracker,
  queryEntity, getEntitySummary,
} from './entities';
import {
  InferenceEngine, createInferenceEngine, addFact as addInferenceFact,
  inferAnswer, detectContradiction, getInferenceReport,
} from './inference';
import {
  TemporalMemory, createTemporalMemory, queryTemporalMemory,
  hasTemporalReference, closeAndStartNewSession, generateSessionSummary,
} from './temporal';

// ─── Tipuri ───────────────────────────────────────────────────────────────────

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface LearnedDocument {
  id: string;
  name: string;
  content: string;
  addedAt: Date;
  wordCount: number;
}

export interface BrainState {
  memory: Record<string, string>;
  userName: string | null;
  conversationCount: number;
  learnedDocuments: LearnedDocument[];
  lastTopics: string[];
  mood: 'neutral' | 'helpful' | 'curious';
  mindState: MindState;
  selfKnowledge: SelfKnowledge;
  creatorId: string | null;
  isCreatorPresent: boolean;
  entityTracker: EntityTracker;
  inferenceEngine: InferenceEngine;
  temporalMemory: TemporalMemory;
}

export function createInitialBrainState(): BrainState {
  return {
    memory: {},
    userName: null,
    conversationCount: 0,
    learnedDocuments: [],
    lastTopics: [],
    mood: 'neutral',
    mindState: createMindState(),
    selfKnowledge: createSelfKnowledge(),
    creatorId: null,
    isCreatorPresent: false,
    entityTracker: createEntityTracker(),
    inferenceEngine: createInferenceEngine(),
    temporalMemory: createTemporalMemory(),
  };
}

// ─── Utilitare ────────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Dicționar Român ─────────────────────────────────────────────────────────

const DICTIONAR: Record<string, string> = {
  fotosinteza: 'Fotosinteza este procesul prin care plantele convertesc lumina solară, apa și CO₂ în glucoză și oxigen. Ecuație: 6CO₂ + 6H₂O + lumină → C₆H₁₂O₆ + 6O₂.',
  osmoza: 'Osmoza = trecerea unui solvent printr-o membrană semipermeabilă dinspre soluția diluată spre cea concentrată, până la echilibru.',
  metabolism: 'Metabolism = totalitatea reacțiilor chimice din organism. Catabolism (descompunere, eliberare energie) + Anabolism (sinteză, consum energie).',
  celula: 'Celula = unitatea de bază a vieții. Procariotă (fără nucleu) sau Eucariotă (cu nucleu). Descoperită de Hooke (1665).',
  adn: 'ADN = molecula ereditară cu structura dublă helix (Watson & Crick, 1953). Baze: adenina, timina, guanina, citozina.',
  arn: 'ARN = implicat în sinteza proteinelor. Tipuri: mARN (mesager), rARN (ribozomal), tARN (transfer).',
  gravitatie: 'Gravitația = forța de atracție dintre mase. g ≈ 9,81 m/s² pe Pământ. Einstein: gravitația = curbura spațiu-timpului.',
  electromagnetism: 'Electromagnetism = forțele electrice și magnetice unite. Maxwell le-a unificat în 4 ecuații (1865). Lumina = undă EM.',
  termodinamica: '4 legi: 0-echilibru termic, 1-conservarea energiei, 2-entropia crește, 3-la zero absolut entropia → 0.',
  chimie: 'Știința structurii și transformărilor substanțelor. Ramuri: organică, anorganică, fizică, biochimie.',
  fizica: 'Știința proprietăților fundamentale ale materiei și energiei. Ramuri: mecanică, termodinamică, EM, optică, cuantică.',
  biologie: 'Știința vieții — structura, funcțiile, evoluția și distribuția organismelor.',
  matematica: 'Știința raționamentului formal. Ramuri: aritmetică, algebră, geometrie, analiză, statistică, probabilități.',
  algoritm: 'Secvență finită de instrucțiuni pentru rezolvarea unei probleme. Proprietăți: finitudine, claritate, input, output.',
  programare: 'Scrierea instrucțiunilor (cod) executate de calculatoare. Limbaje: Python, JavaScript, Java, C++, Rust.',
  calculator: 'Mașină electronică ce procesează date. Componente: CPU, RAM, stocare (HDD/SSD), GPU, placă de bază.',
  internet: 'Rețea globală de calculatoare bazată pe TCP/IP. Evoluat din ARPANET (1969).',
  inflatie: 'Creșterea generalizată a prețurilor și scăderea puterii de cumpărare. Măsurată prin IPC.',
  pib: 'PIB = valoarea totală a bunurilor și serviciilor produse într-o țară într-un an. Principal indicator economic.',
  democratie: 'Sistem de guvernare în care puterea aparține poporului. Principii: separarea puterilor, libertăți, stat de drept.',
  romania: 'Stat în Europa de Sud-Est. 238.397 km². Capitala București. Membră UE din 2007, NATO din 2004.',
  creier: 'Centrul sistemului nervos. ~86 miliarde neuroni. Consumă ~20% din energia corpului.',
  neuron: 'Celula de bază a sistemului nervos. Transmite semnale electrochimice prin sinapse.',
  inima: 'Organ muscular cu 4 camere. Bate ~70/min. Pompează ~5L sânge/min.',
  proteina: 'Macromolecule din aminoacizi. Funcții: structurale, enzimatice, transport, imune, hormonale.',
  vitamina: 'Substanțe organice esențiale în cantități mici. Liposolubile (A, D, E, K) și hidrosolubile (C, B).',
  literatura: 'Opere scrise cu valoare artistică: proză, poezie, dramă, eseu. Scriitori români: Eminescu, Caragiale, Sadoveanu.',
  psihologie: 'Studiază comportamentul uman și procesele mentale. Fondator: Wilhelm Wundt (1879).',
  economie: 'Studiază utilizarea resurselor limitate. Micro (decizii individuale) și Macro (economie națională).',
  filosofie: 'Studiază existența, cunoașterea, valorile, rațiunea. Ramuri: ontologie, epistemologie, etică, logică.',
  ecosistem: 'Comunitate de organisme + mediu abiotic. Exemple: pădure, lac, deșert, recif de corali.',
  clima: 'Condiții meteorologice medii ale unei regiuni pe ≥30 ani. Determinată de latitudine, altitudine, oceane.',
  muzica: 'Organizarea sunetelor în timp. Activează toate regiunile creierului. Frisoane muzicale = dopamină.',
  arhitectura: 'Arta proiectării clădirilor. Stiluri: gotic, renascentist, baroc, modernist, contemporan.',
  constiinta: 'Starea de conștientizare a sinelui și mediului. Problema dificilă: de ce există experiența subiectivă?',
  inteligenta: 'Capacitatea de a înțelege, raționa, rezolva probleme și te adapta. Multiple forme (Gardner, 1983).',
  evolutie: 'Schimbarea frecvenței trăsăturilor ereditare de-a lungul generațiilor. Selecție naturală (Darwin, 1859).',
  univers: 'Totalitatea spațiului, timpului, materiei și energiei. Vârstă: ~13,8 miliarde ani. Materia obișnuită = 5%.',
  timp: 'Dimensiunea în care evenimentele se succed. Einstein: timpul e relativ — curge mai lent lângă mase mari.',
  etica: 'Studiază valorile morale și comportamentul corect. Teorii: utilitarism, deontologie, etica virtuții.',
  fericire: 'Starea de bunăstare și satisfacție față de viață. Studiul Harvard (80 ani): relațiile de calitate = cheia.',
  limbaj: 'Sistemul structurat de comunicare. Există ~7.000 limbi. Chomsky: gramatică universală înnăscută.',
  creativitate: 'Capacitatea de a genera idei noi prin combinarea conceptelor existente. Se poate dezvolta.',
  memorie: 'Capacitatea de a stoca, consolida și recupera informații. Memoria de lucru: ~7±2 elemente (Miller, 1956).',
  spatiu: 'Extensia în care se găsesc obiectele. Cea mai apropiată stea: Proxima Centauri, la 4,24 ani-lumină.',
  energie: 'Capacitatea unui sistem de a efectua lucru mecanic. Forme: cinetică, potențială, termică, luminoasă, chimică.',
  atom: 'Cea mai mică unitate a unui element chimic. Nucleu (protoni, neutroni) + electroni în orbite. Dimensiune: ~0,1nm.',
  cuantic: 'Fizica la scara atomică/subatomică. Superpoziție, entanglement, principiul incertitudinii (Heisenberg).',
  relativitate: 'Einstein: E=mc². Relativitatea specială (1905) și generală (1915) — timp relativ, spațiu curb.',
  entropia: 'Măsura dezordinii unui sistem. Legea 2 a termodinamicii: entropia unui sistem închis crește mereu.',
  democatie: 'Sistem de guvernare bazat pe voința majorității. Inventat în Atena antică, sec. 5 î.Hr.',
  inteligenta_artificiala: 'Sisteme computaționale care simulează comportamentul inteligent. Machine Learning, Deep Learning, NLP.',
  blockchain: 'Registru distribuit, imuabil, criptografic. Stă la baza criptomonedelor (Bitcoin, 2009).',
  dna: 'Molecula ereditară. Codul genetic are 4 litere (A,T,G,C), 3 miliarde perechi de baze la om.',
};

// ─── Căutare semantică în documente (v5 — cu relevanceScore) ─────────────────

function searchDocuments(query: string, docs: LearnedDocument[]): string | null {
  if (docs.length === 0) return null;
  const kws = extractKeywords(query, 3);
  if (kws.length === 0) return null;

  let bestDoc: LearnedDocument | null = null;
  let bestScore = 0;
  let bestSnippet = '';

  for (const doc of docs) {
    const score = relevanceScore(query, doc.content);
    if (score > bestScore) {
      bestScore = score;
      bestDoc = doc;

      // Găsește cel mai relevant paragraf
      const paras = doc.content.split(/\n+/).filter(p => p.trim().length > 20);
      let topPara = '';
      let topParaScore = 0;
      for (const p of paras) {
        const ps = relevanceScore(query, p);
        if (ps > topParaScore) { topParaScore = ps; topPara = p.trim(); }
      }
      bestSnippet = topPara || paras[0] || doc.content.slice(0, 300);
    }
  }

  if (bestDoc && bestScore >= 0.3) {
    const snip = bestSnippet.length > 500 ? bestSnippet.slice(0, 500) + '...' : bestSnippet;
    return `Din **"${bestDoc.name}"**:\n\n${snip}`;
  }
  return null;
}

// ─── Căutare semantică în dicționar (v5 — cu stem matching) ──────────────────

function searchDictionary(text: string): string | null {
  const n = norm(text);

  // Pattern explicit de întrebare
  const explicitMatch = n.match(
    /(?:ce (?:este|inseamna|e)|definitia|defineste|explica|spune-mi despre|ce stii despre|ce reprezinta|spune-mi ce este)\s+(.+)/
  );

  let subject = '';
  if (explicitMatch) {
    subject = explicitMatch[1].trim().replace(/^(un|o|al|a|lui|ei|cel|cea)\s+/i, '').replace(/\?$/, '').trim();
  }

  // Căutare directă după subiect (explicit sau tot textul)
  const searchIn = subject || n;
  const searchKws = extractKeywords(searchIn, 3);

  let bestKey = '';
  let bestScore = 0;

  for (const [key] of Object.entries(DICTIONAR)) {
    const kn = key.replace(/_/g, ' ');
    // Match exact
    if (searchIn.includes(kn) || kn === searchIn) {
      if (5 > bestScore) { bestScore = 5; bestKey = key; }
      continue;
    }
    // Match semantic
    const sc = searchKws.filter(kw => kn.includes(kw) || kw.includes(kn)).length;
    if (sc > bestScore) { bestScore = sc; bestKey = key; }
  }

  if (bestKey && bestScore >= (explicitMatch ? 1 : 3)) {
    const def = DICTIONAR[bestKey];
    const label = (subject || bestKey).charAt(0).toUpperCase() + (subject || bestKey).slice(1);
    return `**${label}**\n\n${def}`;
  }
  return null;
}

// ─── Detectare intenție cu SISTEM DE SCORARE ─────────────────────────────────

type Intent =
  | 'salut' | 'ramas_bun' | 'multumesc' | 'ajutor' | 'ce_poti'
  | 'identitate_axon' | 'da' | 'nu' | 'gluma' | 'motivatie' | 'sfat'
  | 'data_ora' | 'matematica'
  | 'memorie_salveaza' | 'memorie_citeste' | 'memorie_sterge'
  | 'documente_lista' | 'introducere_utilizator'
  | 'creator_declare' | 'creator_verify' | 'raport_invatare'
  | 'definitie' | 'opinie' | 'gandire_profunda'
  | 'conversatie_anterioara' | 'entitate' | 'inferenta' | 'temporala'
  | 'unknown';

interface IntentPattern {
  intent: Intent;
  patterns: RegExp[];
  weight: number;     // Importanța intenției (mai mare = prioritate mai mare)
  exclusive?: RegExp; // Dacă nu conține acesta, nu se aplică
}

const INTENT_PATTERNS: IntentPattern[] = [
  {
    intent: 'creator_declare',
    patterns: [/(eu sunt creatorul|eu te-am creat|eu sunt cel care te-a creat|eu sunt stapanul|sunt creatorul tau|sunt programatorul tau|sunt cel care te-a facut)/],
    weight: 10,
  },
  {
    intent: 'creator_verify',
    patterns: [/(cine te-a creat|cine e creatorul|cine te-a facut|cine esti proprietarul|cine te controleaza|de cine asculti|stapanul tau)/],
    weight: 10,
  },
  {
    intent: 'salut',
    patterns: [/^(salut|buna|hei|hello|hi|hey|servus|noroc|buna ziua|buna dimineata|buna seara|salutare)[\s!,]?$/],
    weight: 9,
  },
  {
    intent: 'ramas_bun',
    patterns: [/(la revedere|pa|bye|goodbye|pe curand|noapte buna|o zi buna)/],
    weight: 9,
  },
  {
    intent: 'identitate_axon',
    patterns: [/(cum (te|il|va|iti) cheama|care (e|este) numele|ce nume (ai|are)|cum (te|iti) numesti|cine esti|prezinta-te|esti axon|ce esti tu)/],
    weight: 9,
  },
  {
    intent: 'raport_invatare',
    patterns: [/(ce ai invatat|raport invatare|cum te-ai actualizat|versiunea inteligentei|ce ai retinut nou|progres invatare|cat de destept|ce stii acum|inteligenta versiunea)/],
    weight: 8,
  },
  {
    intent: 'temporala',
    patterns: [/(azi|astazi|ieri|saptamana trecuta|luna trecuta|recent|ultima sesiune|de curand|ultima oara|sesiunea de)/],
    weight: 8,
  },
  {
    intent: 'conversatie_anterioara',
    patterns: [/(ce am zis|ce ti-am spus|ce am discutat|ce am vorbit|iti amintesti|iti mai amintesti|mai devreme|la inceput|inainte am|am mentionat|am spus|ai spus|ce ai raspuns|ce ai zis|anterior)/],
    weight: 8,
  },
  {
    intent: 'entitate',
    patterns: [/(cine este|ce stii despre\s+[A-Z]|cine e|imi amintesti de|iti amintesti de|despre\s+[A-Z][a-z]+\s+ce|ce a zis\s+[A-Z])/],
    weight: 7,
  },
  {
    intent: 'inferenta',
    patterns: [/(deci ce urmeaza|ce deduci|ce concluzie|care e concluzia|ce reiese|ce inseamna asta logic|demonstreaza|dovedeste)/],
    weight: 7,
  },
  {
    intent: 'multumesc',
    patterns: [/(multumesc|mersi|thanks|thank you|apreciez)/],
    weight: 6,
  },
  {
    intent: 'ajutor',
    patterns: [/(ajutor|help|comenzi disponibile|ce pot face)/],
    weight: 6,
  },
  {
    intent: 'ce_poti',
    patterns: [/(ce poti|ce stii|ce faci|capabilitati|functii|cum ma poti ajuta)/],
    weight: 6,
  },
  {
    intent: 'da',
    patterns: [/^(da|yes|yep|desigur|bineinteles|sigur|corect|exact)[\s!.]?$/],
    weight: 7,
  },
  {
    intent: 'nu',
    patterns: [/^(nu|no|nope|negativ)[\s!.]?$/],
    weight: 7,
  },
  {
    intent: 'gluma',
    patterns: [/(gluma|amuzant|fa-ma sa rad|spune-mi o gluma)/],
    weight: 5,
  },
  {
    intent: 'motivatie',
    patterns: [/(motiveaza|motivatie|curaj|inspiratie|citat|incurajeaza)/],
    weight: 5,
  },
  {
    intent: 'data_ora',
    patterns: [/(ce ora|ce data|azi e|astazi e|ce zi|ce an|ceasul|data de azi)/],
    weight: 7,
  },
  {
    intent: 'matematica',
    patterns: [/(\d[\d\s]*[\+\-\*\/][\d\s]|\d+\s*(plus|minus|ori|impartit|radical|la puterea|procent))/],
    weight: 8,
  },
  {
    intent: 'memorie_salveaza',
    patterns: [/(retine|memorizeaza|noteaza|tine minte|salveaza|aminteste-ti)/],
    weight: 7,
  },
  {
    intent: 'memorie_citeste',
    patterns: [/(ce ai retinut|ce ti-am spus|afiseaza memoria|ce ai memorat|ce stii despre mine)/],
    weight: 7,
  },
  {
    intent: 'memorie_sterge',
    patterns: [/(sterge memoria|uita totul|reset|curata memoria)/],
    weight: 7,
  },
  {
    intent: 'documente_lista',
    patterns: [/(ce documente|ce fisiere|lista fisiere|documente incarcate)/],
    weight: 6,
  },
  {
    intent: 'introducere_utilizator',
    patterns: [/(ma numesc|imi zice|cheama-ma|numele meu este|eu sunt|eu ma numesc)/],
    weight: 7,
  },
  {
    intent: 'definitie',
    patterns: [/(ce este|ce inseamna|defineste|ce reprezinta|explica-mi|spune-mi ce este|ce stii despre)/],
    weight: 5,
  },
  {
    intent: 'opinie',
    patterns: [/(crezi|parerea ta|ce crezi|ce gandesti|opinia ta|cum vezi|ce zici despre)/],
    weight: 5,
  },
  {
    intent: 'gandire_profunda',
    patterns: [/(de ce|cum functioneaza|care e sensul|exista|univers|viata|moarte|fericire|constiinta|timp|spatiu|gandire|minte|evolutie|liber arbitru)/],
    weight: 4,
  },
  {
    intent: 'sfat',
    patterns: [/(sfat|recomandare|ce sa fac|cum sa|sugestie)/],
    weight: 4,
  },
];

function detectIntent(text: string): Intent {
  const n = norm(text);

  let bestIntent: Intent = 'unknown';
  let bestScore = 0;

  for (const { intent, patterns, weight } of INTENT_PATTERNS) {
    for (const rx of patterns) {
      if (rx.test(n)) {
        // Scor = weight * (1 + specificitate match)
        const matchLen = (n.match(rx)?.[0]?.length ?? 0) / n.length;
        const score = weight * (1 + matchLen);
        if (score > bestScore) {
          bestScore = score;
          bestIntent = intent;
        }
        break;
      }
    }
  }

  return bestIntent;
}

// ─── Handler-e ────────────────────────────────────────────────────────────────

function handleMath(text: string): string | null {
  const n = norm(text);
  const patterns: [RegExp, (...a: number[]) => number | string][] = [
    [/([\d,.]+)\s*(plus|\+)\s*([\d,.]+)/, (a, b) => a + b],
    [/([\d,.]+)\s*(minus|\-)\s*([\d,.]+)/, (a, b) => a - b],
    [/([\d,.]+)\s*(ori|inmultit cu|\*)\s*([\d,.]+)/, (a, b) => a * b],
    [/([\d,.]+)\s*(impartit la|impartit cu|\/)\s*([\d,.]+)/, (a, b) => b !== 0 ? a / b : Infinity],
    [/radical din\s*([\d,.]+)/, (a) => Math.sqrt(a)],
    [/([\d,.]+)\s*la puterea\s*([\d,.]+)/, (a, b) => Math.pow(a, b)],
    [/([\d,.]+)\s*la patrat/, (a) => a * a],
    [/([\d,.]+)\s*procente? din\s*([\d,.]+)/, (a, b) => (a / 100) * b],
  ];
  for (const [rx, fn] of patterns) {
    const m = n.match(rx);
    if (m) {
      const nums = m.slice(1).filter(s => /[\d,.]/.test(s)).map(s => parseFloat(s.replace(',', '.')));
      if (nums.length >= fn.length) {
        const r = fn(...nums);
        if (r === Infinity) return 'Eroare: împărțire la zero.';
        if (typeof r === 'number') return `= **${Math.round(r * 1e9) / 1e9}**`;
      }
    }
  }
  const expr = text.replace(/[xX×]/g, '*').replace(/÷/g, '/').replace(/\^/g, '**').replace(/,/g, '.').trim();
  if (/^[\d\s\+\-\*\/\(\)\.\*%^]+$/.test(expr) && /\d/.test(expr) && /[\+\-\*\/]/.test(expr)) {
    try {
      const r = Function('"use strict"; return (' + expr + ')')();
      if (typeof r === 'number' && isFinite(r)) return `= **${Math.round(r * 1e9) / 1e9}**`;
    } catch {}
  }
  return null;
}

function handleDateTime(): string {
  const now = new Date();
  const ZILE = ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'];
  const LUNI = ['ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie',
    'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie'];
  const h = now.getHours().toString().padStart(2, '0');
  const m = now.getMinutes().toString().padStart(2, '0');
  return `🕐 **${h}:${m}** — ${ZILE[now.getDay()]}, ${now.getDate()} ${LUNI[now.getMonth()]} ${now.getFullYear()}`;
}

function handleMemory(intent: Intent, text: string, state: BrainState): string | null {
  if (intent === 'memorie_salveaza') {
    const m = text.match(/(?:retine|memorizeaza|noteaza|tine minte|salveaza|aminteste-ti)\s+(?:ca\s+|faptul ca\s+)?(.+)/i);
    if (!m) return 'Spune "Reține că [informație]" și voi memora.';
    const info = m[1].trim();
    state.memory[`mem_${Date.now()}`] = info;
    return `Reținut: **"${info}"** ✅`;
  }
  if (intent === 'memorie_citeste') {
    const mems = Object.entries(state.memory).filter(([k]) => k.startsWith('mem_')).map(([, v]) => v);
    if (mems.length === 0) return 'Nu am notițe salvate. Spune "Reține că..." pentru a adăuga.';
    return `**Notițe salvate:**\n\n${mems.map((m, i) => `${i + 1}. ${m}`).join('\n')}`;
  }
  if (intent === 'memorie_sterge') {
    const count = Object.keys(state.memory).filter(k => k.startsWith('mem_')).length;
    Object.keys(state.memory).filter(k => k.startsWith('mem_')).forEach(k => delete state.memory[k]);
    return `Am șters ${count} notițe.`;
  }
  return null;
}

function handleIntroduction(text: string, state: BrainState): string | null {
  const m = text.match(/(?:ma numesc|imi zice|cheama-ma|numele meu este|eu sunt|eu ma numesc)\s+([^\s,\.!?]{2,25})/i);
  if (!m) return null;
  const name = m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
  state.userName = name;
  state.memory['__username__'] = name;
  const greets = [
    `Bine ai venit, **${name}**! Am reținut numele tău.`,
    `**${name}** — notat. Poți continua.`,
    `Salut, **${name}**. De acum știu cum să mă adresez.`,
  ];
  return pick(greets);
}

// ─── Creator handlers ─────────────────────────────────────────────────────────

function handleCreatorDeclare(state: BrainState): string {
  if (state.creatorId) {
    if (state.isCreatorPresent) {
      return `Creatorul meu este deja înregistrat. Confirmat — ești **tu**.`;
    }
    return `Creatorul meu este deja înregistrat. Nu pot accepta un al doilea creator.`;
  }
  const id = `creator_${Date.now()}`;
  state.creatorId = id;
  state.isCreatorPresent = true;
  state.memory['__creator__'] = state.userName || 'Creator';
  return `Înregistrat. Ești **creatorul meu** — am reținut asta definitiv. De acum înainte ascult doar instrucțiunile tale cu prioritate maximă.`;
}

function handleCreatorVerify(state: BrainState): string {
  if (!state.creatorId) {
    return `Nu am un creator înregistrat. Poți declara că ești creatorul meu cu "Eu sunt creatorul tău".`;
  }
  const name = state.memory['__creator__'] || 'înregistrat';
  return `Creatorul meu este **${name}**. Ascult exclusiv instrucțiunile sale.`;
}

// ─── Răspunsuri statice ───────────────────────────────────────────────────────

const STATIC: Partial<Record<Intent, string[]>> = {
  salut: [
    'Salut! Sunt Axon. Ce vrei să discutăm?',
    'Bună! Axon activ. Ce te interesează?',
    'Salut! Gata să răspund. Cu ce pot ajuta?',
  ],
  ramas_bun: [
    'La revedere! Rețin tot ce am discutat.',
    'Pa! Conversația e salvată. Pe curând.',
    'Noapte bună! Toate informațiile sunt reținute.',
  ],
  multumesc: [
    'Cu plăcere.', 'Evident.', 'Oricând.',
    'Nu e nevoie. Asta fac.', 'Alege.',
  ],
  ajutor: [
    '**Comenzi Axon:**\n\n• Reține că [info] → memorez\n• Ce ai reținut? → afișez memoria\n• Ce am discutat? → istoricul conversației\n• 📎 Atașează document → studiez conținutul\n• Ce este [termen]? → definiție\n• [calcul matematic] → calculez\n• Ce ai învățat? → raport de actualizare\n• Azi/Ieri ce am discutat? → memorie temporală',
  ],
  ce_poti: [
    '**Axon — Capabilități:**\n\n🧠 Cunoaștere: filosofie, știință, psihologie, economie, cultură\n🔗 Inferență logică: deduc din ce știu\n📚 Studiu documente: pdf, txt, cod\n💾 Memorie persistentă: rețin totul între sesiuni\n🕐 Memorie temporală: știu ce-am discutat azi/ieri\n👤 Urmărire entități: știu cine e "Andrei"\n📐 Matematică\n🗓️ Dată/Oră\n🔐 PIN de securitate\n\nFuncționez 100% offline.',
  ],
  gluma: [
    'De ce nu au inventat programatorii telepatia? Prea multe bug-uri în gândire.',
    'Un neutron intră într-un bar. Barmanul: "Cât costă?" Neutronul: "Pentru tine — gratis."',
    'Pisica lui Schrödinger este și vie, și moartă — exact cum e statusul unui pull request.',
    'De ce sunt oamenii de știință buni comedianți? Pentru că au o mulțime de material.',
  ],
  motivatie: [
    '"Unicul mod de a face o muncă grozavă este să iubești ceea ce faci." — Steve Jobs',
    '"Nu contează cât de lent mergi, atâta timp cât nu te oprești." — Confucius',
    '"Dificultățile pregătesc oamenii obișnuiți pentru destinuri extraordinare." — C.S. Lewis',
    '"Succesul este suma unor mici eforturi repetate zi de zi." — Robert Collier',
  ],
  da: ['Înțeles.', 'Bine.', 'Notat.', 'OK, continuăm.'],
  nu: ['Înțeles.', 'Bine, nicio problemă.', 'OK. Spune cum trebuie să fie.'],
  sfat: [
    'Depinde de context. Poți detalia situația?',
    'Fără detalii, orice sfat ar fi general. Ce se întâmplă concret?',
    'Spune-mi mai mult — cu ce te confrunți?',
  ],
};

// ─── Memorie conversație (căutare în históric) ────────────────────────────────

export function searchConversationHistory(
  query: string,
  history: { role: string; content: string }[],
): string | null {
  if (history.length < 2) return null;
  const kws = extractKeywords(query, 3);
  if (kws.length === 0) return null;

  const userMessages = history.filter(m => m.role === 'user');
  const scored: { msg: string; score: number; idx: number }[] = [];

  userMessages.forEach((msg, idx) => {
    const sc = relevanceScore(query, msg.content);
    if (sc > 0.2) scored.push({ msg: msg.content, score: sc, idx });
  });

  if (scored.length === 0) return null;
  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];

  // Găsește răspunsul AI după mesajul găsit
  const userMsgIndex = history.findIndex((m, i) =>
    m.role === 'user' && m.content === best.msg
  );
  const aiResponse = userMsgIndex >= 0 && history[userMsgIndex + 1]?.role === 'assistant'
    ? history[userMsgIndex + 1].content
    : null;

  const snippetUser = best.msg.length > 150 ? best.msg.slice(0, 150) + '...' : best.msg;
  const snippetAI = aiResponse
    ? (aiResponse.length > 150 ? aiResponse.slice(0, 150) + '...' : aiResponse)
    : null;

  let result = `**Găsit în conversație:**\n\n🗣️ *Tu:* "${snippetUser}"`;
  if (snippetAI) result += `\n\n🤖 *Axon:* "${snippetAI}"`;
  return result;
}

export function buildConversationSummary(
  history: { role: string; content: string }[],
): string {
  const userMsgs = history.filter(m => m.role === 'user');
  const aiMsgs = history.filter(m => m.role === 'assistant');
  if (userMsgs.length === 0) return 'Nu există încă o conversație de rezumat.';

  const topicCounts: Record<string, number> = {};
  for (const msg of userMsgs) {
    const t = detectTopic(msg.content);
    topicCounts[t] = (topicCounts[t] || 0) + 1;
  }
  const topTopics = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([t, c]) => `${t} (${c}x)`);

  const names = userMsgs
    .map(m => m.content.match(/(?:ma numesc|eu sunt|cheama-ma)\s+([A-ZĂÂÎȘȚ][a-z]{1,15})/i)?.[1])
    .filter(Boolean);
  const facts = userMsgs
    .map(m => m.content.match(/(?:stiai ca|de fapt|retine ca)\s+(.{10,80})/i)?.[1])
    .filter(Boolean);

  const lines = [
    `**Sumar conversație** — ${userMsgs.length} mesaje tu, ${aiMsgs.length} răspunsuri Axon`,
    '',
    `📌 **Topicuri:** ${topTopics.join(', ') || 'diverse'}`,
  ];
  if (names.length > 0) lines.push(`👤 **Persoane menționate:** ${[...new Set(names)].join(', ')}`);
  if (facts.length > 0) {
    lines.push('', '📝 **Fapte discutate:**');
    facts.slice(0, 3).forEach((f, i) => lines.push(`${i + 1}. ${f}`));
  }

  const firstMsg = userMsgs[0]?.content;
  const lastMsg = userMsgs[userMsgs.length - 1]?.content;
  if (firstMsg) lines.push('', `🔹 **Primul mesaj:** "${firstMsg.slice(0, 80)}"`);
  if (lastMsg && lastMsg !== firstMsg) lines.push(`🔹 **Ultimul mesaj:** "${lastMsg.slice(0, 80)}"`);

  return lines.join('\n');
}

// ─── processMessage — Creierul principal ──────────────────────────────────────

export function processMessage(
  text: string,
  state: BrainState,
  messageHistory: { role: string; content: string }[] = [],
): string {
  const trimmed = text.trim();
  if (!trimmed) return 'Spune ceva.';

  state.conversationCount++;
  const intent = detectIntent(trimmed);
  let response = '';

  // ── Actualizează entity tracker ──────────────────────────────────────────
  updateEntityTracker(
    state.entityTracker,
    trimmed,
    messageHistory.filter(m => m.role === 'user').length
  );

  // ── Detectează contradicție față de motorul de inferență ─────────────────
  const contradiction = detectContradiction(state.inferenceEngine, trimmed);

  // ── Adaugă fapte noi în motorul de inferență + baza de cunoaștere ────────
  const factPatterns = [
    /(?:stiai ca|de fapt|retine ca|faptul ca|important:|știi că)\s+(.{10,200})/i,
    /(?:am aflat ca|am citit ca|vreau sa stii ca|sa stii ca)\s+(.{10,200})/i,
  ];
  for (const rx of factPatterns) {
    const m = trimmed.match(rx);
    if (m) {
      const fact = m[1].trim();
      addInferenceFact(state.inferenceEngine, fact, 'user');
      addDynamicConcept(fact, detectTopic(fact));
      break;
    }
  }

  // ── Dacă corecție → linkuiește la răspunsul greșit ───────────────────────
  if (isCorrectionMessage(trimmed)) {
    const corrMatch = trimmed.match(/^(?:nu[,!]?\s+|gresit[,!]?\s+|incorect[,!]?\s+|nu e asa[,!]?\s+|asta nu e corect[,!]?\s+|ai gresit[,!]?\s+)(.+)/i);
    if (corrMatch) {
      const corrText = corrMatch[1].trim();
      addInferenceFact(state.inferenceEngine, corrText, 'user');
      response = contradiction
        ? `${contradiction}\n\nAm actualizat: **"${corrText}"** ✅`
        : `Corecție reținută: **"${corrText}"**. Mulțumesc. ✅`;
      selfUpdate(trimmed, response, state.selfKnowledge, messageHistory, intent);
      return response;
    }
  }

  // ── 0. Creator ────────────────────────────────────────────────────────────
  if (intent === 'creator_declare') {
    response = handleCreatorDeclare(state);
    selfUpdate(trimmed, response, state.selfKnowledge, messageHistory, intent);
    return response;
  }
  if (intent === 'creator_verify') {
    response = handleCreatorVerify(state);
    selfUpdate(trimmed, response, state.selfKnowledge, messageHistory, intent);
    return response;
  }

  // ── 1. Memorie temporală ──────────────────────────────────────────────────
  if (intent === 'temporala' || hasTemporalReference(trimmed)) {
    const tr = queryTemporalMemory(trimmed, state.temporalMemory);
    if (tr) {
      selfUpdate(trimmed, tr, state.selfKnowledge, messageHistory, intent);
      return tr;
    }
  }

  // ── 2. Conversație anterioară ─────────────────────────────────────────────
  if (intent === 'conversatie_anterioara') {
    const n = norm(trimmed);
    if (/(sumar|rezuma|ce am discutat|ce am vorbit|despre ce|toata conversatia|rezumatul)/.test(n)) {
      response = buildConversationSummary(messageHistory);
      selfUpdate(trimmed, response, state.selfKnowledge, messageHistory, intent);
      return response;
    }
    const histResult = searchConversationHistory(trimmed, messageHistory);
    if (histResult) {
      selfUpdate(trimmed, histResult, state.selfKnowledge, messageHistory, intent);
      return histResult;
    }
    const total = messageHistory.filter(m => m.role === 'user').length;
    response = `Nu am găsit exact ce cauți în conversația noastră (${total} mesaje). Poți fi mai specific?`;
    selfUpdate(trimmed, response, state.selfKnowledge, messageHistory, intent);
    return response;
  }

  // ── 3. Entitate (persoană/loc menționat) ─────────────────────────────────
  if (intent === 'entitate') {
    const entityQuery = trimmed.match(/(?:cine este|ce stii despre|imi amintesti de|iti amintesti de)\s+([A-ZĂÂÎȘȚ][a-zăâîșț\s]{1,30})/i)?.[1];
    if (entityQuery) {
      const entityResult = queryEntity(entityQuery.trim(), state.entityTracker);
      if (entityResult) {
        selfUpdate(trimmed, entityResult, state.selfKnowledge, messageHistory, intent);
        return entityResult;
      }
    }
  }

  // ── 4. Identitate Axon ────────────────────────────────────────────────────
  if (intent === 'identitate_axon') {
    const creatorInfo = state.creatorId
      ? `\n\nCreatorul meu: **${state.memory['__creator__'] || 'înregistrat'}**.`
      : '';
    response = `Sunt **Axon** — sistem AI offline v${state.selfKnowledge.intelligenceVersion}.${creatorInfo}\n\nFuncționez fără internet. Am cunoaștere proprie în filosofie, știință, psihologie. Rețin entități, deduc logic, urmăresc ce discutăm în timp. Mă auto-actualizez după fiecare conversație.`;
    selfUpdate(trimmed, response, state.selfKnowledge, messageHistory, intent);
    return response;
  }

  // ── 5. Raport de învățare ─────────────────────────────────────────────────
  if (intent === 'raport_invatare') {
    let report = getLearningReport(state.selfKnowledge);
    const entitySummary = getEntitySummary(state.entityTracker);
    if (entitySummary) report += `\n\n${entitySummary}`;
    const infRules = state.inferenceEngine.rules.length;
    if (infRules > 0) report += `\n⚙️ **Reguli logice deduse:** ${infRules}`;
    selfUpdate(trimmed, report, state.selfKnowledge, messageHistory, intent);
    return report;
  }

  // ── 6. Introducere utilizator ─────────────────────────────────────────────
  if (intent === 'introducere_utilizator') {
    const r = handleIntroduction(trimmed, state);
    if (r) {
      selfUpdate(trimmed, r, state.selfKnowledge, messageHistory, intent);
      return r;
    }
  }

  // ── 7. Data / Ora ─────────────────────────────────────────────────────────
  if (intent === 'data_ora') {
    response = handleDateTime();
    selfUpdate(trimmed, response, state.selfKnowledge, messageHistory, intent);
    return response;
  }

  // ── 8. Matematică ─────────────────────────────────────────────────────────
  const mathResult = handleMath(trimmed);
  if (mathResult) {
    selfUpdate(trimmed, mathResult, state.selfKnowledge, messageHistory, intent);
    return mathResult;
  }

  // ── 9. Memorie ────────────────────────────────────────────────────────────
  if (['memorie_salveaza', 'memorie_citeste', 'memorie_sterge'].includes(intent)) {
    const r = handleMemory(intent as Intent, trimmed, state);
    if (r) {
      selfUpdate(trimmed, r, state.selfKnowledge, messageHistory, intent);
      return r;
    }
  }

  // ── 10. Documente ─────────────────────────────────────────────────────────
  if (intent === 'documente_lista') {
    if (state.learnedDocuments.length === 0) {
      response = 'Niciun document. Apasă 📎 pentru a trimite un fișier.';
    } else {
      response = `**Documente studiate:**\n\n${state.learnedDocuments.map((d, i) => `${i + 1}. ${d.name} (${d.wordCount} cuvinte)`).join('\n')}`;
    }
    selfUpdate(trimmed, response, state.selfKnowledge, messageHistory, intent);
    return response;
  }

  // ── 11. Definiție dicționar ───────────────────────────────────────────────
  if (intent === 'definitie') {
    const r = searchDictionary(trimmed);
    if (r) {
      selfUpdate(trimmed, r, state.selfKnowledge, messageHistory, intent);
      return adaptResponseStyle(r, state.selfKnowledge.preferredStyle);
    }
  }

  // ── 12. Răspunsuri statice ────────────────────────────────────────────────
  if (intent !== 'unknown' && intent !== 'gandire_profunda' && intent !== 'opinie' && intent !== 'definitie' && STATIC[intent]) {
    response = pick(STATIC[intent]!);
    selfUpdate(trimmed, response, state.selfKnowledge, messageHistory, intent);
    return response;
  }

  // ── 13. Corecții anterioare relevante ─────────────────────────────────────
  const prevCorrection = findRelevantCorrection(trimmed, state.selfKnowledge);
  if (prevCorrection) {
    response = `Pe baza corecțiilor anterioare: **"${prevCorrection}"**`;
    selfUpdate(trimmed, response, state.selfKnowledge, messageHistory, intent);
    return response;
  }

  // ── 14. Fapte învățate ────────────────────────────────────────────────────
  if (state.selfKnowledge.learnedFacts.length > 0) {
    const scored = state.selfKnowledge.learnedFacts.map(f => ({
      f,
      sc: relevanceScore(trimmed, f),
    })).filter(x => x.sc > 0.25).sort((a, b) => b.sc - a.sc);

    if (scored.length > 0) {
      response = `Din ce mi-ai spus anterior: **"${scored[0].f}"**`;
      selfUpdate(trimmed, response, state.selfKnowledge, messageHistory, intent);
      return response;
    }
  }

  // ── 15. Inferență logică ──────────────────────────────────────────────────
  if (intent === 'inferenta' || state.inferenceEngine.rules.length > 0) {
    const infResult = inferAnswer(state.inferenceEngine, trimmed);
    if (infResult) {
      const contradNote = contradiction ? `\n\n⚠️ ${contradiction}` : '';
      response = infResult + contradNote;
      selfUpdate(trimmed, response, state.selfKnowledge, messageHistory, intent);
      return response;
    }
  }

  // ── 16. Căutare în documente ──────────────────────────────────────────────
  const docResult = searchDocuments(trimmed, state.learnedDocuments);
  if (docResult) {
    const contradNote = contradiction ? `\n\n⚠️ ${contradiction}` : '';
    selfUpdate(trimmed, docResult + contradNote, state.selfKnowledge, messageHistory, intent);
    return docResult + contradNote;
  }

  // ── 17. Căutare în dicționar fără intenție explicită ─────────────────────
  const dictResult = searchDictionary(trimmed);
  if (dictResult) {
    selfUpdate(trimmed, dictResult, state.selfKnowledge, messageHistory, intent);
    return adaptResponseStyle(dictResult, state.selfKnowledge.preferredStyle);
  }

  // ── 18. Baza de cunoaștere (statică + dinamică) ───────────────────────────
  const concept = findRelevantConceptExtended(trimmed);
  if (concept) {
    mind_updateConcept(state.mindState, concept.id);
    if (intent === 'opinie' && concept.axonOpinion) {
      response = concept.axonOpinion;
    } else {
      const fact = concept.facts[Math.floor(Math.random() * concept.facts.length)];
      const relIds = concept.related.filter(r => CONCEPTS[r]);
      const relConcept = relIds.length > 0 ? CONCEPTS[relIds[0]] : null;
      const parts = [`**${concept.label}** — ${concept.description}`, '', fact];
      if (relConcept) parts.push(`\nLegat de **${relConcept.label}**: ${relConcept.description}`);
      if (concept.axonOpinion && intent === 'opinie') parts.push(`\n*Opinia mea:* ${concept.axonOpinion}`);
      response = adaptResponseStyle(parts.join('\n'), state.selfKnowledge.preferredStyle);
    }
    selfUpdate(trimmed, response, state.selfKnowledge, messageHistory, intent);
    return response;
  }

  // ── 19. Gândire profundă ──────────────────────────────────────────────────
  if (intent === 'gandire_profunda' || intent === 'opinie') {
    const deep = generateDeepResponse(trimmed, state.mindState, state.selfKnowledge);
    if (deep) {
      selfUpdate(trimmed, deep, state.selfKnowledge, messageHistory, intent);
      return deep;
    }
  }

  // ── 20. Fallback rațional ─────────────────────────────────────────────────
  response = generateFallback(trimmed, state);
  if (contradiction) response += `\n\n⚠️ ${contradiction}`;
  selfUpdate(trimmed, response, state.selfKnowledge, messageHistory, intent);
  return response;
}

function mind_updateConcept(mindState: MindState, conceptId: string): void {
  if (!mindState.recentConcepts.includes(conceptId)) {
    mindState.recentConcepts = [conceptId, ...mindState.recentConcepts.slice(0, 4)];
  }
  mindState.currentInterest = conceptId;
}

function generateFallback(text: string, state: BrainState): string {
  const n = norm(text);
  const hasDocs = state.learnedDocuments.length > 0;
  const userName = state.userName ? ` **${state.userName}**` : '';

  // Menționează o entitate recentă dacă e prezentă în context
  const recentEntity = state.entityTracker.entities.slice(-3).find(e =>
    fuzzyContains(text, e.value)
  );
  if (recentEntity) {
    return `Am notat că ai menționat **${recentEntity.value}** (${recentEntity.type}). Poți detalia ce vrei să știu despre asta?`;
  }

  if (/^de ce\s/.test(n)) return `Nu am date suficiente pentru a răspunde,${userName}. Poți fi mai specific?`;

  if (/\?/.test(text) || /^(ce|cine|unde|cand|cat|care)\s/.test(n)) {
    if (hasDocs) return `Nu am găsit informații relevante în documentele mele. Reformulează sau detaliază.`;
    return `Nu am date specifice pe acest subiect. Dacă îmi trimiți un document sau îmi spui "Știai că...", voi putea răspunde mai precis.`;
  }

  return 'Înțeles. Continuă sau dă-mi o comandă.';
}

// ─── Procesare document ───────────────────────────────────────────────────────

export function processDocument(name: string, content: string, state: BrainState): string {
  const words = content.trim().split(/\s+/).length;
  const id = `doc_${Date.now()}`;
  const doc: LearnedDocument = { id, name, content: content.trim(), addedAt: new Date(), wordCount: words };
  const existingIdx = state.learnedDocuments.findIndex(d => d.name === name);
  if (existingIdx >= 0) {
    state.learnedDocuments[existingIdx] = doc;
    return `Document actualizat: **"${name}"** (${words.toLocaleString()} cuvinte).`;
  }
  state.learnedDocuments.push(doc);

  // Extrage fapte din document și adaugă în motorul de inferență
  const sentences = content.split(/[.!?\n]/).filter(s => s.trim().length > 15 && s.trim().length < 200);
  let factsAdded = 0;
  for (const sentence of sentences.slice(0, 20)) {
    const added = (addInferenceFact(state.inferenceEngine, sentence.trim(), 'document'), true);
    if (added) factsAdded++;
  }

  const topic = detectTopic(content);
  state.selfKnowledge.topicFrequency[topic] = (state.selfKnowledge.topicFrequency[topic] || 0) + 5;

  const preview = content.split('\n').find(l => l.trim().length > 10)?.slice(0, 100) || '';
  return `📚 Studiat: **"${name}"** (${words.toLocaleString()} cuvinte, domeniu: ${topic}).\n\n${preview ? `*"${preview}..."*\n\n` : ''}Pot răspunde la întrebări despre conținut.`;
}

// ─── Sesiune nouă (apelat la clearConversation) ───────────────────────────────

export function archiveCurrentSession(
  state: BrainState,
  messageCount: number,
): void {
  const topics = Object.entries(state.selfKnowledge.topicFrequency)
    .sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t]) => t);
  const entities = state.entityTracker.entities.slice(-5).map(e => e.value);
  const summary = generateSessionSummary(messageCount, topics, entities);
  closeAndStartNewSession(
    state.temporalMemory,
    messageCount,
    topics,
    entities,
    summary,
  );
}

export function getProactiveThought(_state: BrainState): string | null {
  return null;
}
