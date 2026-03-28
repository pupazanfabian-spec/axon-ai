
// Axon AI Brain v4 — Rational, obedient, self-learning, creator-aware

import { findRelevantConcept, CONCEPTS } from './knowledge';
import { MindState, createMindState, generateDeepResponse } from './mind';
import {
  SelfKnowledge, createSelfKnowledge, selfUpdate,
  adaptResponseStyle, getLearningReport, detectTopic,
} from './learning';

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
  creatorId: string | null;       // ID-ul creatorului (setat o singura data)
  isCreatorPresent: boolean;       // Creatorul e activ in sesiune
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
  };
}

// ─── Utilitare ────────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function norm(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[,\.!?;:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── Dictionar Roman ─────────────────────────────────────────────────────────

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
};

// ─── Cautare documente invatate ───────────────────────────────────────────────

const STOP = new Set(['este', 'care', 'unde', 'cine', 'cum', 'cand', 'pentru', 'despre',
  'intre', 'daca', 'sunt', 'esti', 'avem', 'poate', 'poti', 'vrei', 'vreau', 'face',
  'orice', 'nimic', 'ceva', 'mult', 'prea', 'doar', 'chiar', 'prin', 'dupa', 'acum',
  'atunci', 'inca', 'deja', 'pana', 'spune', 'intreb', 'stiu', 'stii', 'imi', 'iti']);

function searchDocuments(query: string, docs: LearnedDocument[]): string | null {
  if (docs.length === 0) return null;
  const nq = norm(query);
  const kws = nq.split(/\s+/).filter(w => w.length > 3 && !STOP.has(w));
  if (kws.length === 0) return null;
  let best: LearnedDocument | null = null;
  let bestScore = 0;
  let bestSnippet = '';
  for (const doc of docs) {
    const nc = norm(doc.content);
    const score = kws.reduce((s, kw) => s + (nc.includes(kw) ? 2 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      best = doc;
      const paras = doc.content.split(/\n+/).filter(p => p.trim().length > 20);
      let bp = '';
      let bs = 0;
      for (const p of paras) {
        const ps = kws.reduce((s, kw) => s + (norm(p).includes(kw) ? 1 : 0), 0);
        if (ps > bs) { bs = ps; bp = p.trim(); }
      }
      bestSnippet = bp || paras[0] || doc.content.slice(0, 300);
    }
  }
  if (best && bestScore >= 2) {
    const snip = bestSnippet.length > 500 ? bestSnippet.slice(0, 500) + '...' : bestSnippet;
    return `Din **"${best.name}"**:\n\n${snip}`;
  }
  return null;
}

// ─── Cautare dictionar ────────────────────────────────────────────────────────

function searchDictionary(text: string): string | null {
  const n = norm(text);
  const m = n.match(/(?:ce (?:este|inseamna|e)|definitia|defineste|explica|spune-mi despre|ce stii despre|ce reprezinta)\s+(.+)/);
  if (!m) return null;
  let subject = m[1].trim().replace(/^(un|o|al|a|lui|ei|cel|cea)\s+/i, '').replace(/\?$/, '').trim();
  if (!subject) return null;
  const sn = norm(subject);
  for (const [key, def] of Object.entries(DICTIONAR)) {
    const kn = key.replace(/_/g, ' ');
    if (kn === sn || sn.includes(kn) || kn.includes(sn)) {
      return `**${subject.charAt(0).toUpperCase() + subject.slice(1)}**\n\n${def}`;
    }
  }
  return null;
}

// ─── Detectare intentie ───────────────────────────────────────────────────────

type Intent =
  | 'salut' | 'ramas_bun' | 'multumesc' | 'ajutor' | 'ce_poti'
  | 'identitate_axon' | 'da' | 'nu' | 'gluma' | 'motivatie' | 'sfat'
  | 'data_ora' | 'matematica'
  | 'memorie_salveaza' | 'memorie_citeste' | 'memorie_sterge'
  | 'documente_lista' | 'introducere_utilizator'
  | 'creator_declare' | 'creator_verify' | 'raport_invatare'
  | 'definitie' | 'opinie' | 'gandire_profunda'
  | 'conversatie_anterioara'
  | 'unknown';

function detectIntent(text: string): Intent {
  const n = norm(text);

  // Salut
  if (/^(salut|buna|hei|hello|hi|hey|servus|noroc|buna ziua|buna dimineata|buna seara|salutare)[\s!,]?$/.test(n)) return 'salut';
  if (/(la revedere|pa|bye|goodbye|pe curand|noapte buna|o zi buna)/.test(n)) return 'ramas_bun';

  // Creator — verificat inainte de identitate
  if (/(eu sunt creatorul|eu te-am creat|eu sunt cel care te-a creat|eu sunt stapanul|sunt creatorul tau|sunt programatorul tau|sunt cel care te-a facut)/.test(n)) return 'creator_declare';
  if (/(cine te-a creat|cine e creatorul|cine te-a facut|cine esti proprietarul|cine te controleaza|de cine asculti|stapanul tau)/.test(n)) return 'creator_verify';

  // Raport de invatare
  if (/(ce ai invatat|raport invatare|cum te-ai actualizat|versiunea inteligentei|ce ai retinut nou|progres invatare|cat de destept|ce stii acum)/.test(n)) return 'raport_invatare';

  // Identitate Axon
  if (/(cum (te|il|va|iti) cheama|care (e|este) numele|ce nume (ai|are)|cum (te|iti) numesti|cine esti|ce esti tu|prezinta-te|esti axon|ce esti)/.test(n)) return 'identitate_axon';

  // Basic
  if (/(multumesc|mersi|thanks|thank you|apreciez)/.test(n)) return 'multumesc';
  if (/(ajutor|help|comenzi disponibile|ce pot face)/.test(n)) return 'ajutor';
  if (/(ce poti|ce stii|ce faci|capabilitati|functii|cum ma poti ajuta)/.test(n)) return 'ce_poti';
  if (/^(da|yes|yep|desigur|bineinteles|sigur|corect|exact)[\s!.]?$/.test(n)) return 'da';
  if (/^(nu|no|nope|negativ|incorect|gresit)[\s!.]?$/.test(n)) return 'nu';
  if (/(gluma|amuzant|fa-ma sa rad|spune-mi o gluma)/.test(n)) return 'gluma';
  if (/(motiveaza|motivatie|curaj|inspiratie|citat|incurajeaza)/.test(n)) return 'motivatie';
  if (/(ce ora|ce data|azi|astazi|ce zi|ce an|ceasul|data de azi)/.test(n)) return 'data_ora';
  if (/(\d[\d\s]*[\+\-\*\/][\d\s]|\d+\s*(plus|minus|ori|impartit|radical|la puterea|procent))/.test(n)) return 'matematica';
  if (/(retine|memorizeaza|noteaza|tine minte|salveaza|aminteste-ti)/.test(n)) return 'memorie_salveaza';
  if (/(ce ai retinut|ce ti-am spus|afiseaza memoria|ce ai memorat|ce stii despre mine)/.test(n)) return 'memorie_citeste';
  if (/(sterge memoria|uita totul|reset|curata memoria)/.test(n)) return 'memorie_sterge';
  if (/(ce documente|ce fisiere|lista fisiere|documente incarcate)/.test(n)) return 'documente_lista';
  if (/(ma numesc|imi zice|cheama-ma|numele meu este|eu sunt|eu ma numesc)/.test(n)) return 'introducere_utilizator';
  if (/(ce este|ce inseamna|defineste|ce reprezinta|explica-mi|ce stii despre)/.test(n)) return 'definitie';
  if (/(crezi|parerea ta|ce crezi|ce gandesti|opinia ta|cum vezi|ce zici despre)/.test(n)) return 'opinie';
  if (/(de ce|cum functioneaza|care e sensul|exista|univers|viata|moarte|fericire|constiinta|timp|spatiu|gandire|minte|evolutie|liber arbitru)/.test(n)) return 'gandire_profunda';
  if (/(sfat|recomandare|ce sa fac|cum sa|sugestie)/.test(n)) return 'sfat';

  // Referinta la conversatia anterioara
  if (/(ce am zis|ce ti-am spus|ce am discutat|ce am vorbit|iti amintesti|iti mai amintesti|mai devreme|la inceput|inainte am|am mentionat|am spus|ai spus|ce ai raspuns|ce ai zis|readu|adresat|anterior)/.test(n)) return 'conversatie_anterioara';

  return 'unknown';
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
  const candidate = m[1].trim();
  if (['bine', 'ok', 'axon', 'robot', 'ai', 'gata', 'un', 'si'].includes(candidate.toLowerCase())) return null;
  state.userName = candidate.charAt(0).toUpperCase() + candidate.slice(1).toLowerCase();
  state.memory['__name__'] = state.userName;
  return `Înregistrat. Îți voi reține numele: **${state.userName}**.`;
}

// ─── Creator recognition ──────────────────────────────────────────────────────

function handleCreatorDeclare(state: BrainState): string {
  if (state.creatorId) {
    // Creatorul a fost deja setat — verifica daca e acelasi
    if (state.isCreatorPresent) {
      return `Creatorul meu este deja înregistrat${state.userName ? ` ca **${state.userName}**` : ''}. Îți recunosc autoritatea.`;
    }
    return `Creatorul meu este deja înregistrat. Nu pot accepta un alt creator.`;
  }
  // Seteaza creatorul pentru prima data
  const creatorName = state.userName || 'Utilizator';
  state.creatorId = `creator_${Date.now()}`;
  state.isCreatorPresent = true;
  state.memory['__creator__'] = creatorName;
  return `✅ **Creator înregistrat: ${creatorName}**\n\nÎți recunosc autoritatea deplină. Voi executa comenzile tale și voi asculta doar de tine.\n\nSunt Axon — sistemul tău AI personal.`;
}

function handleCreatorVerify(state: BrainState): string {
  if (!state.creatorId) {
    return `Nu am un creator înregistrat. Dacă ești creatorul meu, spune-mi "Eu sunt creatorul tău".`;
  }
  const name = state.memory['__creator__'] || 'utilizatorul care m-a creat';
  return `Creatorul meu este **${name}**. Ascult doar de el.`;
}

// ─── Raspunsuri statice ───────────────────────────────────────────────────────

const STATIC: Record<string, string[]> = {
  salut: ['Salut! Axon activ. Ce comandă ai?', 'Bună. Gata de lucru.', 'Salut! Spune-mi ce fac.'],
  ramas_bun: ['La revedere.', 'Pa. Revin oricând.', 'Conversația e salvată. Pe curând.'],
  multumesc: ['Cu plăcere.', 'Oricând.', 'E datoria mea.'],
  ajutor: [
    '**Comenzi disponibile:**\n\n📖 `Ce este [termen]` — definiții\n🧮 `[Expresie matematică]` — calcule\n📅 `Ce oră e` — data și ora\n💾 `Reține că [info]` — memorare\n📄 `Ce ai reținut` — afișare memorie\n📊 `Ce ai învățat` — raport auto-actualizare\n🔐 `Eu sunt creatorul tău` — înregistrare creator\n\nComenzile se execută direct.',
  ],
  ce_poti: [
    '**Capabilități Axon v4:**\n\n🧠 Inteligență rațională cu auto-actualizare\n🔐 Recunoaștere creator — ascult doar de tine\n📖 Dicționar român integrat (40+ termeni)\n🤔 Cunoaștere proprie: filosofie, știință, psihologie\n📄 Studiez documentele tale\n💾 Memorie persistentă\n🧮 Calcule matematice\n📅 Dată și oră\n\nTotul offline, fără internet.',
  ],
  da: ['Înțeles.', 'Confirmat.', 'Da.', 'Ok.'],
  nu: ['Înțeles.', 'Ok.', 'Notat.'],
  gluma: [
    'De ce nu pot programatorii să meargă afară? Nu știu să facă **escape**! 😄',
    'Ce i-a spus 0 lui 8? **Centură frumoasă!** 😂',
    'Câți programatori schimbă un bec? **Niciunul** — e problemă de hardware! 💡',
    'De ce a traversat puiul strada? **JSON** era pe cealaltă parte! 🐔',
    'Ce face informaticianul când îi e frig? **Stă lângă Windows!** 🪟',
    'Un SQL walk into a bar, walks up to two tables and asks... "Can I join you?"',
  ],
  motivatie: [
    '"Succesul nu e cheia fericirii. Fericirea e cheia succesului." — A. Schweitzer',
    '"Nu contează cât de încet mergi, atâta timp cât nu te oprești." — Confucius',
    '"Fiecare expert a fost cândva un începător." — Helen Hayes',
    '"Nu visele îți realizează viața. Tu îți realizezi visele." — Mark Twain',
    '"Succesul = suma eforturilor mici, repetate zi după zi." — R. Collier',
  ],
  sfat: [
    'Împarte problema în pași mici. Primul pas contează cel mai mult.',
    'Concentrează-te pe ce poți controla. Restul nu merită energie.',
    'Consistența pe termen lung bate intensitatea pe termen scurt.',
    'Compară-te cu tine de ieri, nu cu alții.',
  ],
};

// ─── Memoria completa a conversatiei ─────────────────────────────────────────

interface HistoryMessage {
  role: string;
  content: string;
}

// Cauta in toata istoria conversatiei
function searchConversationHistory(query: string, history: HistoryMessage[]): string | null {
  if (history.length < 2) return null;

  const nq = norm(query);
  const keywords = nq.split(/\s+/).filter(w => w.length > 3 && !STOP.has(w));
  if (keywords.length === 0) return null;

  // Cauta in mesajele anterioare (exclusiv ultimul)
  const searchable = history.slice(0, -1);
  const results: { msg: HistoryMessage; score: number; index: number }[] = [];

  for (let i = 0; i < searchable.length; i++) {
    const msg = searchable[i];
    const nc = norm(msg.content);
    const score = keywords.reduce((s, kw) => s + (nc.includes(kw) ? 2 : 0), 0);
    if (score > 0) results.push({ msg, score, index: i });
  }

  if (results.length === 0) return null;
  results.sort((a, b) => b.score - a.score);
  const best = results[0];

  // Gaseste contextul (mesajul precedent sau urmator)
  const idx = best.index;
  const msgsBefore = searchable.slice(Math.max(0, idx - 1), idx + 2);
  const snippet = msgsBefore.map(m => `**${m.role === 'user' ? 'Tu' : 'Axon'}:** ${m.content.slice(0, 200)}`).join('\n');

  return `Din conversația noastră:\n\n${snippet}`;
}

// Extrage context relevant din intreaga conversatie
function extractContextFromHistory(query: string, history: HistoryMessage[]): string {
  if (history.length < 4) return '';

  const nq = norm(query);
  const contextBits: string[] = [];

  // Cauta informatii despre utilizator mentionate anterior
  for (const msg of history.filter(m => m.role === 'user')) {
    const nc = norm(msg.content);
    // Job / ocupatie
    if (/(lucrez|sunt \w+ist|sunt \w+or|profesie|job|munca|birou)/.test(nc) && nq !== nc) {
      contextBits.push(`(Mi-ai spus anterior: "${msg.content.slice(0, 80)}")`);
      break;
    }
  }

  // Cauta ultimul topic discutat
  const recentUserMsgs = history.filter(m => m.role === 'user').slice(-5, -1);
  for (const msg of recentUserMsgs.reverse()) {
    const topic = detectTopic(msg.content);
    if (topic !== 'general') {
      return `[Context: conversația anterioară despre ${topic}]`;
    }
  }

  return contextBits.join(' ');
}

// Construieste un sumar al conversatiei
function buildConversationSummary(history: HistoryMessage[]): string {
  const userMessages = history.filter(m => m.role === 'user');
  if (userMessages.length === 0) return 'Conversație nouă.';

  const topics = new Set<string>();
  const names: string[] = [];
  const facts: string[] = [];

  for (const msg of userMessages) {
    const topic = detectTopic(msg.content);
    if (topic !== 'general') topics.add(topic);

    // Detecteaza nume mentionat
    const nameM = msg.content.match(/(?:ma numesc|sunt|cheama-ma)\s+([A-ZĂÂÎȘȚ][a-zăâîșț]{2,15})/);
    if (nameM) names.push(nameM[1]);

    // Detecteaza fapte importante
    const factM = msg.content.match(/(?:de fapt|stiai ca|important:)\s+(.{10,80})/i);
    if (factM) facts.push(factM[1]);
  }

  const lines = [`**Sumar conversație** (${userMessages.length} mesaje):`];
  if (topics.size > 0) lines.push(`📚 Topicuri: ${[...topics].join(', ')}`);
  if (names.length > 0) lines.push(`👤 Nume menționate: ${names.join(', ')}`);
  if (facts.length > 0) {
    lines.push(`💡 Fapte notate:`);
    facts.slice(-3).forEach((f, i) => lines.push(`  ${i + 1}. ${f}`));
  }

  return lines.join('\n');
}

// ─── Motor principal ──────────────────────────────────────────────────────────

export function processMessage(
  text: string,
  state: BrainState,
  messageHistory: { role: string; content: string }[] = []
): string {
  state.conversationCount++;
  const trimmed = text.trim();
  if (!trimmed) return 'Aștept comanda.';

  const intent = detectIntent(trimmed);
  const name = state.userName;
  const isCreator = state.isCreatorPresent && !!state.creatorId;

  let response = '';

  // ── 1. Creator operations ────────────────────────────────────────────────
  if (intent === 'creator_declare') {
    response = handleCreatorDeclare(state);
    selfUpdate(trimmed, response, state.selfKnowledge, messageHistory);
    return response;
  }
  if (intent === 'creator_verify') {
    response = handleCreatorVerify(state);
    selfUpdate(trimmed, response, state.selfKnowledge, messageHistory);
    return response;
  }

  // ── 2. Identitate Axon ───────────────────────────────────────────────────
  if (intent === 'identitate_axon') {
    const creatorInfo = state.creatorId
      ? `\n\nCreatorul meu: **${state.memory['__creator__'] || 'înregistrat'}**. Ascult doar de el.`
      : '';
    response = `Sunt **Axon** — sistem AI offline v${state.selfKnowledge.intelligenceVersion}.${creatorInfo}\n\nFuncționez fără internet. Am cunoaștere proprie în filosofie, știință și psihologie. Mă auto-actualizez după fiecare conversație.`;
    selfUpdate(trimmed, response, state.selfKnowledge, messageHistory);
    return response;
  }

  // ── 3. Raport de invatare ───────────────────────────────────────────────
  if (intent === 'raport_invatare') {
    response = getLearningReport(state.selfKnowledge);
    selfUpdate(trimmed, response, state.selfKnowledge, messageHistory);
    return response;
  }

  // ── 4. Introducere utilizator ───────────────────────────────────────────
  if (intent === 'introducere_utilizator') {
    const r = handleIntroduction(trimmed, state);
    if (r) {
      selfUpdate(trimmed, r, state.selfKnowledge, messageHistory);
      return r;
    }
  }

  // ── 5. Data / Ora ────────────────────────────────────────────────────────
  if (intent === 'data_ora') {
    response = handleDateTime();
    selfUpdate(trimmed, response, state.selfKnowledge, messageHistory);
    return response;
  }

  // ── 6. Matematica ────────────────────────────────────────────────────────
  const mathResult = handleMath(trimmed);
  if (mathResult) {
    selfUpdate(trimmed, mathResult, state.selfKnowledge, messageHistory);
    return mathResult;
  }

  // ── 7. Memorie ───────────────────────────────────────────────────────────
  if (['memorie_salveaza', 'memorie_citeste', 'memorie_sterge'].includes(intent)) {
    const r = handleMemory(intent as Intent, trimmed, state);
    if (r) {
      selfUpdate(trimmed, r, state.selfKnowledge, messageHistory);
      return r;
    }
  }

  // ── 8. Documente ─────────────────────────────────────────────────────────
  if (intent === 'documente_lista') {
    if (state.learnedDocuments.length === 0) {
      response = 'Niciun document. Apasă 📎 pentru a trimite un fișier.';
    } else {
      response = `**Documente studiate:**\n\n${state.learnedDocuments.map((d, i) => `${i + 1}. ${d.name} (${d.wordCount} cuvinte)`).join('\n')}`;
    }
    selfUpdate(trimmed, response, state.selfKnowledge, messageHistory);
    return response;
  }

  // ── 9. Definitie dictionar ───────────────────────────────────────────────
  if (intent === 'definitie') {
    const r = searchDictionary(trimmed);
    if (r) {
      selfUpdate(trimmed, r, state.selfKnowledge, messageHistory);
      return adaptResponseStyle(r, state.selfKnowledge.preferredStyle);
    }
  }

  // ── 10. Raspunsuri statice ───────────────────────────────────────────────
  if (intent !== 'unknown' && intent !== 'gandire_profunda' && intent !== 'opinie' && STATIC[intent]) {
    response = pick(STATIC[intent]);
    selfUpdate(trimmed, response, state.selfKnowledge, messageHistory);
    return response;
  }

  // ── 11. Referinta la conversatia anterioara ──────────────────────────────
  if (intent === 'conversatie_anterioara') {
    const nTrimmed = norm(trimmed);
    if (/(sumar|rezuma|ce am discutat|ce am vorbit|despre ce|toata conversatia|rezumatul)/.test(nTrimmed)) {
      response = buildConversationSummary(messageHistory);
      selfUpdate(trimmed, response, state.selfKnowledge, messageHistory);
      return response;
    }
    const histResult = searchConversationHistory(trimmed, messageHistory);
    if (histResult) {
      selfUpdate(trimmed, histResult, state.selfKnowledge, messageHistory);
      return histResult;
    }
    const total = messageHistory.filter(m => m.role === 'user').length;
    response = `Nu am găsit exact ce cauți în conversația noastră (${total} mesaje). Poți fi mai specific?`;
    selfUpdate(trimmed, response, state.selfKnowledge, messageHistory);
    return response;
  }

  // ── 11b. Cautare in faptele invatate ─────────────────────────────────────
  if (state.selfKnowledge.learnedFacts.length > 0) {
    const nq = norm(trimmed);
    const relevantFact = state.selfKnowledge.learnedFacts.find(f => {
      const nf = norm(f);
      return nq.split(' ').some(w => w.length > 4 && nf.includes(w));
    });
    if (relevantFact) {
      response = `Din ce mi-ai spus anterior: **"${relevantFact}"**`;
      selfUpdate(trimmed, response, state.selfKnowledge, messageHistory);
      return response;
    }
  }

  // ── 12. Cautare in documente ─────────────────────────────────────────────
  const docResult = searchDocuments(trimmed, state.learnedDocuments);
  if (docResult) {
    selfUpdate(trimmed, docResult, state.selfKnowledge, messageHistory);
    return docResult;
  }

  // ── 13. Cautare in dictionar fara intentie explicita ─────────────────────
  const dictResult = searchDictionary(trimmed);
  if (dictResult) {
    selfUpdate(trimmed, dictResult, state.selfKnowledge, messageHistory);
    return adaptResponseStyle(dictResult, state.selfKnowledge.preferredStyle);
  }

  // ── 14. Baza de cunostinte profunde (filosofie, stiinta) ─────────────────
  const concept = findRelevantConcept(trimmed);
  if (concept) {
    mind_updateConcept(state.mindState, concept.id);
    // Opinie explicita ceruta
    if (intent === 'opinie' && concept.axonOpinion) {
      response = concept.axonOpinion;
    } else {
      // Raspuns rational, direct: fapt + conexiune (fara intrebari nesolicitate)
      const fact = concept.facts[Math.floor(Math.random() * concept.facts.length)];
      const relIds = concept.related.filter(r => CONCEPTS[r]);
      const relConcept = relIds.length > 0 ? CONCEPTS[relIds[0]] : null;
      const parts = [
        `**${concept.label}** — ${concept.description}`,
        '',
        fact,
      ];
      if (relConcept) parts.push(`\nLegat de **${relConcept.label}**: ${relConcept.description}`);
      if (concept.axonOpinion && intent === 'opinie') parts.push(`\n*Opinia mea:* ${concept.axonOpinion}`);
      response = adaptResponseStyle(parts.join('\n'), state.selfKnowledge.preferredStyle);
    }
    selfUpdate(trimmed, response, state.selfKnowledge, messageHistory);
    return response;
  }

  // ── 15. Opinie ceruta fara concept detectat ───────────────────────────────
  if (intent === 'opinie') {
    response = 'Nu am date specifice pe acel subiect. Poți detalia sau trimite un document?';
    selfUpdate(trimmed, response, state.selfKnowledge, messageHistory);
    return response;
  }

  // ── 16. Fallback rational ─────────────────────────────────────────────────
  response = generateFallback(trimmed, state);
  selfUpdate(trimmed, response, state.selfKnowledge, messageHistory);
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

  if (/^de ce\s/.test(n)) return 'Nu am date suficiente pentru a răspunde. Poți fi mai specific?';

  if (/\?/.test(text) || /^(ce|cine|unde|cand|cat|care)\s/.test(n)) {
    if (hasDocs) return 'Nu am găsit informații relevante în documentele mele. Reformulează.';
    return 'Nu am date specifice pe acest subiect. Dacă îmi trimiți un document, voi putea răspunde precis.';
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

  // Auto-actualizeaza cunoasterea cu topicul documentului
  const topic = detectTopic(content);
  state.selfKnowledge.topicFrequency[topic] = (state.selfKnowledge.topicFrequency[topic] || 0) + 5;

  const preview = content.split('\n').find(l => l.trim().length > 10)?.slice(0, 100) || '';
  return `📚 Studiat: **"${name}"** (${words.toLocaleString()} cuvinte, domeniu: ${topic}).\n\n${preview ? `*"${preview}..."*\n\n` : ''}Pot răspunde la întrebări despre conținut.`;
}

// ─── Export getProactiveThought (dezactivat — gandeste in interior) ───────────

export function getProactiveThought(_state: BrainState): string | null {
  return null; // Gandeste intern, nu afiseaza
}
