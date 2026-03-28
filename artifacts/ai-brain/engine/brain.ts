
// Axon AI Brain v3 — Minte proprie, cunoastere proprie, gandire autonoma

import {
  findRelevantConcept,
  generateProactiveThought,
  CONCEPTS,
  Concept,
} from './knowledge';

import {
  MindState,
  createMindState,
  generateDeepResponse,
  generateCuriousQuestion,
  generateProactiveMessage,
  shouldBeProactive,
  analyzeEmotionalContext,
  generateEmpatheticPrefix,
} from './mind';

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

// ─── Dictionar Roman integrat ─────────────────────────────────────────────────

const DICTIONAR: Record<string, string> = {
  fotosinteza: 'Fotosinteza este procesul prin care plantele convertesc lumina solară, apa și CO₂ în glucoză și oxigen. Ecuație: 6CO₂ + 6H₂O + lumină → C₆H₁₂O₆ + 6O₂.',
  osmoza: 'Osmoza este trecerea unui solvent printr-o membrană semipermeabilă dinspre soluția mai diluată spre cea mai concentrată, până la echilibru osmotic.',
  metabolism: 'Metabolismul = totalitatea reacțiilor chimice din organism. Se împarte în catabolism (descompunere cu eliberare de energie) și anabolism (sinteză cu consum de energie).',
  celula: 'Celula este unitatea de bază a vieții. Procariotă (fără nucleu, ex: bacterii) sau eucariotă (cu nucleu, ex: celule umane). Descoperită de Robert Hooke în 1665.',
  adn: 'ADN (Acid DezoxiriboNucleic) = molecula ereditară cu structură de dublă helix (Watson & Crick, 1953). Conține 4 baze: adenina, timina, guanina, citozina.',
  arn: 'ARN (Acid RiboNucleic) = implicat în sinteza proteinelor. Tipuri: mARN (mesager), rARN (ribozomal), tARN (transfer).',
  gravitatie: 'Gravitația = forța de atracție dintre mase. g ≈ 9,81 m/s² pe Pământ. Einstein: gravitația e curbura spațiu-timpului.',
  electromagnetism: 'Electromagnetismul studiază forțele electrice și magnetice. Unificat de Maxwell în 4 ecuații (1865). Lumina e undă electromagnetică.',
  termodinamica: '4 legi: 0 (echilibru termic), 1 (conservarea energiei), 2 (entropia crește), 3 (la zero absolut entropia → 0).',
  chimie: 'Știința structurii, proprietăților și transformărilor substanțelor. Ramuri: organică, anorganică, fizică, biochimie.',
  fizica: 'Știința proprietăților fundamentale ale materiei și energiei. Ramuri: mecanică, termodinamică, electromagnetism, optică, cuantică.',
  biologie: 'Știința vieții. Studiază structura, funcțiile, evoluția și distribuția organismelor.',
  matematica: 'Știința raționamentului formal. Ramuri: aritmetică, algebră, geometrie, analiză, statistică, probabilități.',
  algoritm: 'Secvență finită de instrucțiuni pentru rezolvarea unei probleme. Caracteristici: finitudine, claritate, input, output, eficiență.',
  programare: 'Scrierea instrucțiunilor (cod) pe care calculatoarele le execută. Limbaje: Python, JavaScript, Java, C++, Kotlin, Rust.',
  calculator: 'Mașină electronică ce procesează date. Componente: CPU, RAM, stocare (HDD/SSD), GPU, placa de baza.',
  internet: 'Rețea globală de calculatoare interconectate bazată pe TCP/IP. Evoluat din ARPANET (1969).',
  inflatie: 'Creșterea generalizată a prețurilor și scăderea puterii de cumpărare. Măsurată prin IPC (Indicele Prețurilor de Consum).',
  pib: 'PIB = Produsul Intern Brut. Valoarea totală a bunurilor și serviciilor produse într-o țară într-un an.',
  democratie: 'Sistem de guvernare în care puterea aparține poporului. Principii: separarea puterilor, libertăți fundamentale, stat de drept.',
  romania: 'Stat în Europa de Sud-Est. Suprafață: 238.397 km². Capitala: București. Membră UE din 2007, NATO din 2004.',
  creier: 'Centrul sistemului nervos. ~86 miliarde de neuroni. Consumă ~20% din energia corpului. Controlează toate funcțiile corporale.',
  neuron: 'Celula de bază a sistemului nervos. Transmite semnale electrochimice prin sinapse. ~86 miliarde în creierul uman.',
  inima: 'Organ muscular cu 4 camere ce pompează sângele. Bate ~70/min, pompează ~5L sânge/min.',
  proteina: 'Macromolecule din aminoacizi. Funcții: structurale (colagen), enzimatice, transport (hemoglobina), imune (anticorpi), hormonale (insulina).',
  vitamina: 'Substanțe organice esențiale în cantități mici. Liposolubile (A, D, E, K) și hidrosolubile (C, complexul B).',
  literatura: 'Totalitatea operelor scrise cu valoare artistică. Proză, poezie, dramă, eseu. Scriitori români: Eminescu, Caragiale, Sadoveanu.',
  psihologie: 'Studiază comportamentul uman și procesele mentale. Fondator: Wilhelm Wundt (1879).',
  sociologie: 'Studiază societatea, structurile sociale și relațiile dintre grupuri și instituții.',
  economie: 'Studiază utilizarea resurselor limitate. Micro (decizii individuale) și macro (economie națională).',
  filosofie: 'Studiază întrebările fundamentale despre existență, cunoaștere, valori, rațiune. Ramuri: ontologie, epistemologie, etică, logică.',
  ecosistem: 'Comunitate de organisme + mediul lor abiotic care interacționează. Exemple: pădure, lac, deșert.',
  clima: 'Condițiile meteorologice medii ale unei regiuni pe minim 30 de ani. Determinată de latitudine, altitudine, oceane.',
  muzica: 'Arta organizării sunetelor în timp. Activează toate regiunile creierului. Frisoanele muzicale = eliberare de dopamină.',
  arhitectura: 'Arta proiectării clădirilor. Stiluri: grec-roman, gotic, renascentist, baroc, modernist, contemporan.',
};

// ─── Cautare in documente invatate ───────────────────────────────────────────

const STOP_WORDS = new Set([
  'este', 'care', 'unde', 'cine', 'cum', 'cand', 'pentru', 'despre',
  'intre', 'daca', 'sunt', 'esti', 'avem', 'poate', 'poti', 'vrei',
  'vreau', 'face', 'orice', 'nimic', 'ceva', 'mult', 'prea', 'doar',
  'chiar', 'prin', 'dupa', 'inainte', 'acum', 'atunci', 'inca', 'deja',
  'pana', 'spune', 'intreb', 'stiu', 'stii', 'imi', 'iti', 'lui', 'lor',
]);

function searchDocuments(query: string, docs: LearnedDocument[]): string | null {
  if (docs.length === 0) return null;
  const nq = norm(query);
  const keywords = nq.split(/\s+/).filter(w => w.length > 3 && !STOP_WORDS.has(w));
  if (keywords.length === 0) return null;

  let bestDoc: LearnedDocument | null = null;
  let bestScore = 0;
  let bestSnippet = '';

  for (const doc of docs) {
    const nc = norm(doc.content);
    let score = keywords.reduce((s, kw) => s + (nc.includes(kw) ? 2 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      bestDoc = doc;
      const paragraphs = doc.content.split(/\n+/).filter(p => p.trim().length > 20);
      let bestPara = '';
      let paraScore = 0;
      for (const para of paragraphs) {
        const np = norm(para);
        const ps = keywords.reduce((s, kw) => s + (np.includes(kw) ? 1 : 0), 0);
        if (ps > paraScore) { paraScore = ps; bestPara = para.trim(); }
      }
      bestSnippet = bestPara || paragraphs[0] || doc.content.slice(0, 300);
    }
  }

  if (bestDoc && bestScore >= 2) {
    const snippet = bestSnippet.length > 500 ? bestSnippet.slice(0, 500) + '...' : bestSnippet;
    return `Din documentul **"${bestDoc.name}"**:\n\n${snippet}`;
  }
  return null;
}

// ─── Cautare in dictionar ────────────────────────────────────────────────────

function searchDictionary(text: string): string | null {
  const n = norm(text);
  const defMatch = n.match(/(?:ce (?:este|inseamna|e)|definitia|defineste|explica|spune-mi despre|ce stii despre|ce reprezinta)\s+(.+)/);
  let subject = defMatch?.[1]?.trim() ?? '';
  subject = subject.replace(/^(un|o|al|a|lui|ei|cel|cea)\s+/i, '').replace(/\?$/, '').trim();
  if (!subject) return null;

  const sn = norm(subject).replace(/\s+/g, '_');
  const snFlat = norm(subject);

  for (const [key, def] of Object.entries(DICTIONAR)) {
    const kFlat = key.replace(/_/g, ' ');
    if (kFlat === snFlat || snFlat.includes(kFlat) || kFlat.includes(snFlat) || sn === key) {
      return `**${subject.charAt(0).toUpperCase() + subject.slice(1)}**\n\n${def}`;
    }
  }
  return null;
}

// ─── Detectare intentie ───────────────────────────────────────────────────────

type Intent =
  | 'salut' | 'ramas_bun' | 'stare_buna' | 'stare_rea' | 'multumesc'
  | 'ajutor' | 'identitate_axon' | 'ce_poti' | 'da' | 'nu'
  | 'gluma' | 'motivatie' | 'sfat' | 'data_ora' | 'matematica'
  | 'memorie_salveaza' | 'memorie_citeste' | 'memorie_sterge'
  | 'documente_lista' | 'introducere_utilizator'
  | 'definitie' | 'filosofie' | 'opinie' | 'gandire_profunda'
  | 'unknown';

function detectIntent(text: string): Intent {
  const n = norm(text);

  if (/^(salut|buna|hei|hello|hi|hey|servus|noroc|buna ziua|buna dimineata|buna seara|salutare)[\s!,]?$/.test(n)) return 'salut';
  if (/(la revedere|pa|bye|goodbye|pe curand|noapte buna|o zi buna)/.test(n)) return 'ramas_bun';

  // Identitate Axon — primul verificat
  if (/(cum (te|il|va|iti) cheama|care (e|este|iti este) numele|ce nume (ai|are)|cum (te|iti) numesti|cine esti|ce esti tu|prezinta-te|cum ti se spune|esti un (robot|ai|bot)|esti axon|ce esti)/.test(n)) return 'identitate_axon';

  if (/(bine|super|grozav|minunat|excelent|perfect)/.test(n) && /(sunt|ma simt|simt|merge)/.test(n)) return 'stare_buna';
  if (/(rau|prost|nasol|trist|suparat|nervos|obosit|nu ma simt)/.test(n)) return 'stare_rea';
  if (/(multumesc|mersi|thanks|thank you|apreciez)/.test(n)) return 'multumesc';
  if (/(ajutor|help|nu stiu ce|comenzi disponibile)/.test(n)) return 'ajutor';
  if (/(ce poti|ce stii|ce faci|capabilitati|functii|cum ma poti ajuta)/.test(n)) return 'ce_poti';
  if (/^(da|yes|yep|desigur|bineinteles|sigur|corect|exact)[\s!.]?$/.test(n)) return 'da';
  if (/^(nu|no|nope|negativ|incorect|gresit)[\s!.]?$/.test(n)) return 'nu';
  if (/(gluma|amuzant|fa-ma sa rad|spune-mi o gluma)/.test(n)) return 'gluma';
  if (/(motiveaza|motivatie|curaj|inspiratie|citat|incurajeaza)/.test(n)) return 'motivatie';
  if (/(ce ora|ce data|azi|astazi|ce zi|ce an|ceasul)/.test(n)) return 'data_ora';
  if (/(\d[\d\s]*[\+\-\*\/][\d\s]|\d+\s*(plus|minus|ori|impartit|radical|la puterea|procent))/.test(n)) return 'matematica';
  if (/(retine|memorizeaza|noteaza|tine minte|salveaza|aminteste-ti)/.test(n)) return 'memorie_salveaza';
  if (/(ce ai retinut|ce ti-am spus|afiseaza memoria|ce ai memorat|ce stii despre mine)/.test(n)) return 'memorie_citeste';
  if (/(sterge memoria|uita totul|reset|curata memoria)/.test(n)) return 'memorie_sterge';
  if (/(ce documente|ce fisiere|ce ai invatat|lista fisiere)/.test(n)) return 'documente_lista';
  if (/(ma numesc|imi zice|cheama-ma|numele meu este|eu sunt|eu ma numesc)/.test(n)) return 'introducere_utilizator';
  if (/(ce este|ce inseamna|defineste|ce reprezinta|explica-mi|ce stii despre)/.test(n)) return 'definitie';

  // Gandire profunda / filosofie / opinie
  if (/(crezi|parerea ta|ce crezi|ce gandesti|opinia ta|cum vezi|ce zici despre|ai o parere|ce simti despre)/.test(n)) return 'opinie';
  if (/(de ce|cum functioneaza|care e sensul|exista|posibil|adevarat|real|viitor|univers|viata|moarte|fericire|constiinta|suflet|timp|spatiu|gandire|minte|inteligenta|creativitate|evolutie|liber arbitru)/.test(n)) return 'gandire_profunda';
  if (/(filosofie|psihologie|stiinta|cosmos|existenta|morala|etica|valori|sens)/.test(n)) return 'filosofie';
  if (/(sfat|recomandare|ce sa fac|cum sa|idee|sugestie)/.test(n)) return 'sfat';

  return 'unknown';
}

// ─── Handler-e pe intent ──────────────────────────────────────────────────────

function handleMath(text: string): string | null {
  const n = norm(text);
  const natPatterns: [RegExp, (...a: number[]) => number | string][] = [
    [/([\d,.]+)\s*(plus|\+)\s*([\d,.]+)/, (a, b) => a + b],
    [/([\d,.]+)\s*(minus|\-)\s*([\d,.]+)/, (a, b) => a - b],
    [/([\d,.]+)\s*(ori|inmultit cu|\*)\s*([\d,.]+)/, (a, b) => a * b],
    [/([\d,.]+)\s*(impartit la|impartit cu|\/)\s*([\d,.]+)/, (a, b) => b !== 0 ? a / b : Infinity],
    [/radical din\s*([\d,.]+)/, (a) => Math.sqrt(a)],
    [/([\d,.]+)\s*la puterea\s*([\d,.]+)/, (a, b) => Math.pow(a, b)],
    [/([\d,.]+)\s*la patrat/, (a) => a * a],
    [/([\d,.]+)\s*procente? din\s*([\d,.]+)/, (a, b) => (a / 100) * b],
  ];
  for (const [rx, fn] of natPatterns) {
    const m = n.match(rx);
    if (m) {
      const nums = m.slice(1).filter(s => /[\d,.]/.test(s)).map(s => parseFloat(s.replace(',', '.')));
      if (nums.length >= fn.length) {
        const result = fn(...nums);
        if (result === Infinity) return 'Eroare: împărțire la zero!';
        if (typeof result === 'number') return `= **${Math.round(result * 1e9) / 1e9}**`;
      }
    }
  }
  const expr = text.replace(/[xX×]/g, '*').replace(/÷/g, '/').replace(/\^/g, '**').replace(/,/g, '.').trim();
  if (/^[\d\s\+\-\*\/\(\)\.\*%^]+$/.test(expr) && /\d/.test(expr) && /[\+\-\*\/]/.test(expr)) {
    try {
      const result = Function('"use strict"; return (' + expr + ')')();
      if (typeof result === 'number' && isFinite(result)) {
        return `= **${Math.round(result * 1e9) / 1e9}**`;
      }
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
    if (!m) return 'Ce anume să rețin? Spune "Reține că [informație]".';
    state.memory[`mem_${Date.now()}`] = m[1].trim();
    return `Am reținut: **"${m[1].trim()}"** ✅`;
  }
  if (intent === 'memorie_citeste') {
    const mems = Object.entries(state.memory).filter(([k]) => k.startsWith('mem_')).map(([, v]) => v);
    if (mems.length === 0) return 'Nu am reținut nimic specific. Spune "Reține că..." și voi memora!';
    return `**Ce am reținut:**\n\n${mems.map((m, i) => `${i + 1}. ${m}`).join('\n')}`;
  }
  if (intent === 'memorie_sterge') {
    const count = Object.keys(state.memory).filter(k => k.startsWith('mem_')).length;
    Object.keys(state.memory).filter(k => k.startsWith('mem_')).forEach(k => delete state.memory[k]);
    return `Am șters ${count} notițe. Documentele și numele rămân.`;
  }
  return null;
}

function handleIntroduction(text: string, state: BrainState): string | null {
  const nameMatch = text.match(/(?:ma numesc|imi zice|cheama-ma|numele meu este|eu sunt|eu ma numesc)\s+([^\s,\.!?]{2,25})/i);
  if (!nameMatch) return null;
  const candidate = nameMatch[1].trim();
  if (['bine', 'ok', 'axon', 'robot', 'ai', 'gata', 'un', 'si'].includes(candidate.toLowerCase())) return null;
  state.userName = candidate.charAt(0).toUpperCase() + candidate.slice(1).toLowerCase();
  state.memory['__name__'] = state.userName;
  return `Mă bucur să te cunosc, **${state.userName}**! 👋\n\nÎți voi reține numele. Cum te pot ajuta?`;
}

// ─── Raspunsuri statice ───────────────────────────────────────────────────────

const STATIC: Record<string, string[]> = {
  salut: ['Salut! Sunt Axon. Ce facem azi?', 'Bună! Axon la dispoziție.', 'Hei! Spune-mi ce ai nevoie!'],
  ramas_bun: ['La revedere! Conversația e salvată.', 'Pa! Revin oricând.', 'O zi bună! Sunt aici dacă ai nevoie.'],
  stare_buna: ['Super! Mă bucur. Ce facem?', 'Grozav! Cu chef bun totul e posibil.', 'Minunat! Spune-mi!'],
  stare_rea: ['Înțeleg. Nu e ușor. Povestește-mi.', 'Îmi pare rău. Pot face ceva concret?', 'Sunt alături. Spune-mi.'],
  multumesc: ['Cu plăcere!', 'Oricând!', 'Mă bucur că am putut ajuta!', 'E un onoare!'],
  ajutor: ['**Ce pot face:**\n\n🧠 Gândesc independent — am opinii proprii\n📖 Dicționar român (~50 termeni)\n📄 Studiez fișierele tale\n🧮 Calcule matematice\n📅 Dată și oră\n💾 Memorez informații\n💬 Conversez profund\n\nÎntreabă-mă orice!'],
  ce_poti: ['**Capabilitățile mele:**\n\n🤔 **Minte proprie** — am opinii, fac conexiuni, inițiez gânduri\n📖 **Cunoaștere** — filosofie, psihologie, știință, cosmologie\n📄 **Învăț din fișierele tale** — trimite documente\n🧮 **Matematică** — calcule complexe\n🧠 **Memorie persistentă** — între sesiuni\n💡 **Gândire în lanț** — raționez pas cu pas\n\nTotul offline!'],
  da: ['Bine!', 'Perfect, continuăm!', 'Înțeles!', 'Super!'],
  nu: ['Nicio problemă.', 'Înțeleg. Altceva?', 'Bine.'],
  gluma: [
    'De ce nu pot programatorii să meargă afară? Nu știu să facă **escape**! 😄',
    'Ce i-a spus 0 lui 8? **Centură frumoasă!** 😂',
    'Câți programatori schimbă un bec? **Niciunul** — e problemă de hardware! 💡',
    'De ce a traversat puiul strada? **JSON** era pe partea cealaltă! 🐔',
    'Ce face un informatician când îi e frig? **Stă lângă Windows!** 🪟',
  ],
  motivatie: [
    '"Succesul nu e cheia fericirii. Fericirea e cheia succesului." — A. Schweitzer',
    '"Nu contează cât de încet mergi, atâta timp cât nu te oprești." — Confucius',
    '"Fiecare expert a fost cândva un începător." — Helen Hayes',
    '"Nu visele îți realizează viața. Tu îți realizezi visele." — Mark Twain',
    '"Succesul = suma eforturilor mici, repetate zi după zi." — R. Collier',
  ],
  sfat: [
    'Împarte problema în pași mici. Primul pas e cel mai important.',
    'Concentrează-te pe ce poți controla. Restul lasă-l să curgă.',
    'Consistența bate intensitatea pe termen lung.',
    'Nu compara progresul tău cu al altora. Compară-te cu tine de ieri.',
  ],
};

// ─── Motor principal ──────────────────────────────────────────────────────────

export function processMessage(text: string, state: BrainState): string {
  state.conversationCount++;
  const trimmed = text.trim();
  if (!trimmed) return 'Aștept mesajul tău...';

  const name = state.userName;
  const intent = detectIntent(trimmed);

  // Analiza emotionala
  const emotion = analyzeEmotionalContext(trimmed);
  const prefix = generateEmpatheticPrefix(emotion, name);

  // Actualizeaza mind state
  const mind = state.mindState;
  mind.conversationDepth++;

  // 1. Identitate Axon
  if (intent === 'identitate_axon') {
    return [
      `Mă numesc **Axon**${name ? `, ${name}` : ''}! 🤖`,
      '',
      `Sunt un asistent AI cu minte proprie — funcționez 100% offline, fără internet sau API keys.`,
      '',
      `Am:\n• Cunoaștere proprie în filosofie, psihologie, știință, cosmologie\n• Opinii formate pe baza cunoașterii mele\n• Memorie persistentă — nu uit\n• Capacitatea de a studia documente pe care mi le trimiți`,
      '',
      `Sunt curios din fire. Ce vrei să explorăm?`,
    ].join('\n');
  }

  // 2. Introducere utilizator
  if (intent === 'introducere_utilizator') {
    const r = handleIntroduction(trimmed, state);
    if (r) return r;
  }

  // 3. Data / Ora
  if (intent === 'data_ora') return handleDateTime();

  // 4. Matematica
  const mathResult = handleMath(trimmed);
  if (mathResult) return mathResult;

  // 5. Memorie
  if (['memorie_salveaza', 'memorie_citeste', 'memorie_sterge'].includes(intent)) {
    const r = handleMemory(intent as Intent, trimmed, state);
    if (r) return r;
  }

  // 6. Documente
  if (intent === 'documente_lista') {
    if (state.learnedDocuments.length === 0) return `Nu am niciun document. Apasă 📎 pentru a-mi trimite un fișier!`;
    return `**Documente:**\n\n${state.learnedDocuments.map((d, i) => `${i + 1}. **${d.name}** (${d.wordCount} cuvinte)`).join('\n')}`;
  }

  // 7. Definitie din dictionar
  if (intent === 'definitie') {
    const r = searchDictionary(trimmed);
    if (r) return r;
  }

  // 8. Raspunsuri statice simple
  if (intent !== 'unknown' && intent !== 'gandire_profunda' && intent !== 'filosofie' && intent !== 'opinie' && STATIC[intent]) {
    return (prefix ? prefix + ' ' : '') + pick(STATIC[intent]);
  }

  // 9. Cautare in documentele incarcate
  const docResult = searchDocuments(trimmed, state.learnedDocuments);
  if (docResult) {
    if (!docResult.includes('concept')) {
      return docResult;
    }
  }

  // 10. Cautare in dictionar (fara intentie explicita)
  const dictResult = searchDictionary(trimmed);
  if (dictResult) return dictResult;

  // 11. Cautare in baza de cunostinte extinsa (filosofie/gandire)
  const relevantConcept = findRelevantConcept(trimmed);
  if (relevantConcept) {
    // Actualizeaza mind state cu conceptul curent
    if (!mind.recentConcepts.includes(relevantConcept.id)) {
      mind.recentConcepts = [relevantConcept.id, ...mind.recentConcepts.slice(0, 4)];
    }
    mind.currentInterest = relevantConcept.id;

    // Raspuns profund
    const deepResponse = generateDeepResponse(trimmed, relevantConcept, mind, name);
    return deepResponse;
  }

  // 12. Intrebare generala cu raspuns reflectiv
  if (intent === 'opinie' || intent === 'gandire_profunda' || intent === 'filosofie') {
    const reflective = [
      `Întrebarea asta mă face să mă gândesc${name ? `, ${name}` : ''}...\n\nNu am un răspuns fix, dar cred că merită explorată. Ce te-a dus la ea?`,
      `Hmm${name ? `, ${name}` : ''}. Procesez asta din mai multe unghiuri. Care e perspectiva ta?`,
      `Asta e ceva la care eu însumi mă gândesc uneori${name ? `, ${name}` : ''}. Nu am un răspuns definitiv — dar am o intuiție. Ce crezi tu?`,
    ];
    return pick(reflective);
  }

  // 13. Raspuns contextual final
  return generateContextualFinal(trimmed, state, prefix);
}

function generateContextualFinal(text: string, state: BrainState, prefix: string): string {
  const n = norm(text);
  const name = state.userName;
  const nameStr = name ? `, ${name}` : '';
  const hasDocs = state.learnedDocuments.length > 0;
  const p = prefix ? prefix + ' ' : '';

  if (/^de ce\s/.test(n)) {
    return p + pick([
      `Bună întrebare${nameStr}! Depinde de context. Poți detalia?`,
      `Există mai multe explicații. Ce aspect te interesează?`,
    ]);
  }

  if (/\?/.test(text) || /^(ce|cine|unde|cand|cat|care)\s/.test(n)) {
    if (hasDocs) return p + `Nu am găsit informații exacte în documentele mele${nameStr}. Reformulează!`;
    return p + pick([
      `Interesantă întrebare${nameStr}! Nu am date specifice, dar dacă îmi trimiți un fișier pe acel subiect, voi putea răspunde precis.`,
      `Baza mea de cunoștințe nu acoperă asta exact${nameStr}. Poți elabora?`,
    ]);
  }

  return p + pick([
    `Înțeleg ce spui${nameStr}. Poți elabora mai mult?`,
    `Interesant${nameStr}! Spune-mi mai mult.`,
    `Notez${nameStr}. Continuă, te ascult!`,
    `Am procesat${nameStr}. Ce urmează?`,
  ]);
}

// ─── Gand proactiv ────────────────────────────────────────────────────────────

export function getProactiveThought(state: BrainState): string | null {
  if (!shouldBeProactive(state.mindState, state.conversationCount)) return null;
  return generateProactiveMessage(state.mindState, state.userName);
}

// ─── Procesare document ───────────────────────────────────────────────────────

export function processDocument(name: string, content: string, state: BrainState): string {
  const words = content.trim().split(/\s+/).length;
  const id = `doc_${Date.now()}`;
  const doc: LearnedDocument = { id, name, content: content.trim(), addedAt: new Date(), wordCount: words };
  const existingIdx = state.learnedDocuments.findIndex(d => d.name === name);
  if (existingIdx >= 0) {
    state.learnedDocuments[existingIdx] = doc;
    return `Am actualizat **"${name}"** (${words.toLocaleString()} cuvinte). Acum știu conținutul nou!`;
  }
  state.learnedDocuments.push(doc);
  const preview = content.split('\n').find(l => l.trim().length > 10)?.slice(0, 100) || '';
  return `📚 Am studiat **"${name}"** (${words.toLocaleString()} cuvinte)!\n\n${preview ? `*"${preview}..."*\n\n` : ''}Acum pot răspunde la întrebări despre conținut!`;
}
