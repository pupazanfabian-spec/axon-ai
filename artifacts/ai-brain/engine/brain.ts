
// Axon AI Brain v2 - Motor avansat offline
// Suporta memorie extinsa, documente invatate, conversatie contextuala

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
}

// ─── Utilitare ────────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

// ─── Cautare in documente invatate ───────────────────────────────────────────

function searchDocuments(query: string, docs: LearnedDocument[]): string | null {
  if (docs.length === 0) return null;

  const nq = normalize(query);
  const keywords = nq
    .split(/\s+/)
    .filter(w => w.length > 3)
    .filter(w => !['este', 'care', 'unde', 'cine', 'cum', 'cand', 'pentru', 'despre', 'intre', 'daca'].includes(w));

  if (keywords.length === 0) return null;

  let bestDoc: LearnedDocument | null = null;
  let bestScore = 0;
  let bestSnippet = '';

  for (const doc of docs) {
    const normalizedContent = normalize(doc.content);
    let score = 0;
    for (const kw of keywords) {
      if (normalizedContent.includes(kw)) score += 2;
    }
    if (score > bestScore) {
      bestScore = score;
      bestDoc = doc;

      // Extrage cel mai relevant paragraf
      const paragraphs = doc.content.split(/\n+/).filter(p => p.trim().length > 20);
      let bestPara = '';
      let paraScore = 0;
      for (const para of paragraphs) {
        const np = normalize(para);
        let ps = 0;
        for (const kw of keywords) {
          if (np.includes(kw)) ps++;
        }
        if (ps > paraScore) {
          paraScore = ps;
          bestPara = para.trim();
        }
      }
      bestSnippet = bestPara || paragraphs[0] || doc.content.slice(0, 300);
    }
  }

  if (bestDoc && bestScore >= 2) {
    const snippet = bestSnippet.length > 400 ? bestSnippet.slice(0, 400) + '...' : bestSnippet;
    return `Din documentul **"${bestDoc.name}"**:\n\n${snippet}`;
  }

  return null;
}

// ─── Detectare intentie ───────────────────────────────────────────────────────

type Intent =
  | 'salut' | 'ramas_bun' | 'bine' | 'rau' | 'multumesc'
  | 'ajutor' | 'cine_esti' | 'ce_poti' | 'da' | 'nu'
  | 'gluma' | 'motivatie' | 'sfat'
  | 'matematica' | 'data_ora' | 'memorie' | 'documente'
  | 'unknown';

function detectIntent(text: string): Intent {
  const n = normalize(text);

  if (/^(salut|buna|bun[a]?|hei|hello|hi|hey|servus|noroc|buna ziua|buna dimineata|buna seara)[\s!,]?$/.test(n)) return 'salut';
  if (/(la revedere|pa|bye|goodbye|pe curand|noapte buna|o zi buna)/.test(n)) return 'ramas_bun';
  if (/(bine|super|grozav|minunat|excelent|perfect|extraordinar)/.test(n) && /(sunt|ma simt|simt|merge|e totul)/.test(n)) return 'bine';
  if (/(rau|prost|nasol|trist|suparat|nervos|obosit|nu e bine)/.test(n) && /(sunt|ma simt|simt)/.test(n)) return 'rau';
  if (/(multumesc|mersi|thanks|thank you|iti multumesc|apreciez)/.test(n)) return 'multumesc';
  if (/(ajutor|help|nu stiu ce|nu inteleg)/.test(n) && /(poti|ma|cum)/.test(n)) return 'ajutor';
  if (/(cine esti|ce esti|cum te cheama|prezinta|spune despre tine|ce esti tu)/.test(n)) return 'cine_esti';
  if (/(ce poti|ce stii|ce faci|capabilitati|functii|ce comenzi)/.test(n)) return 'ce_poti';
  if (/^(da|yes|yep|desigur|bineinteles|sigur|corect|exact|asa e)[\s!.]?$/.test(n)) return 'da';
  if (/^(nu|no|nope|negativ|incorect|gresit|nu e asa)[\s!.]?$/.test(n)) return 'nu';
  if (/(gluma|jokes|amuzant|fa-ma sa rad|ceva funny|rade)/.test(n)) return 'gluma';
  if (/(motiveaza|motivatie|curaj|inspiratie|citat|quote|incurajeaza)/.test(n)) return 'motivatie';
  if (/(sfat|recomandare|ce sa fac|cum sa fac mai bine|idee|sugestie)/.test(n)) return 'sfat';
  if (/(\d[\d\s\+\-\*\/\(\)\.]*[\+\-\*\/][\d\s\+\-\*\/\(\)\.]|\d+\s*(plus|minus|ori|impartit|la puterea|radical))/.test(n)) return 'matematica';
  if (/(ce ora|ce data|azi|astazi|ce zi|ce an|ce luna|ceasul)/.test(n)) return 'data_ora';
  if (/(retine|memorizeaza|noteaza|ce ai retinut|sterge memoria|uita tot|aminteste)/.test(n)) return 'memorie';
  if (/(documente|fisiere|ce ai invatat|ai invatat|studi|materiale|ce stii din)/.test(n)) return 'documente';

  return 'unknown';
}

// ─── Raspunsuri la intenti ────────────────────────────────────────────────────

const RESPONSES: Record<string, string[]> = {
  salut: [
    'Salut! Sunt Axon, gata să te ajut. Cu ce începem?',
    'Bună ziua! Axon la dispoziție. Ce pot face pentru tine?',
    'Hei! Mă bucur că vorbim. Spune-mi ce ai nevoie!',
    'Salut! Sunt online și activ. Cum te pot ajuta astăzi?',
  ],
  ramas_bun: [
    'La revedere! A fost o plăcere să vorbim.',
    'Pa! Revin oricând ai nevoie de mine.',
    'O zi bună! Sunt aici dacă mai ai întrebări.',
    'Noapte bună! Conversația noastră a fost salvată.',
  ],
  bine: [
    'Super! Mă bucur să aud asta. Ce putem face astăzi?',
    'Minunat! Energia pozitivă e contagioasă. Cum te pot ajuta?',
    'Grozav! Cu chef bun totul e posibil. Spune-mi!',
  ],
  rau: [
    'Îmi pare rău să aud asta. Vrei să vorbim despre ce s-a întâmplat?',
    'Înțeleg. Uneori lucrurile sunt grele. Sunt aici, povestește-mi.',
    'Sper că trece curând. Pot face ceva concret pentru tine?',
  ],
  multumesc: [
    'Cu plăcere! Asta e treaba mea.',
    'Oricând! Nu ezita să mă întrebi din nou.',
    'Mă bucur că am putut ajuta! Altceva?',
    'E un onoare! Continuăm cu altceva?',
  ],
  ajutor: [
    'Sigur! Pot ajuta cu:\n\n🧮 Calcule matematice\n📅 Dată și oră\n📄 Studiu documente trimise de tine\n🧠 Memorie și notițe\n💬 Conversație\n💡 Sfaturi și motivație\n😄 Glume\n\nCe dorești?',
  ],
  cine_esti: [
    'Sunt **Axon**, un asistent AI construit să funcționeze 100% offline.\n\nNu am nevoie de internet sau chei API — creierul meu rulează direct pe dispozitivul tău.\n\nPoți să îmi trimiți fișiere, să mă înveți lucruri noi, și le voi reține pentru conversațiile noastre.',
    'Mă numesc **Axon**. Sunt un AI offline cu memorie persistentă.\n\nDeosebirea față de alți asistenți: totul rămâne pe dispozitivul tău, nimic nu merge în cloud.',
  ],
  ce_poti: [
    'Iată ce pot face:\n\n📄 **Studiez fișiere** — trimite-mi documente text și le voi analiza\n🧠 **Memorez informații** — spune "Reține că..." și nu uit\n🧮 **Calcule** — matematică simplă și complexă\n📅 **Dată/Oră** — îți spun exact\n💬 **Conversez** — întreabă-mă orice\n💪 **Motivez** — citate și sfaturi\n😄 **Glume** — când ai nevoie de o pauză\n\nCe vrei să faci?',
  ],
  da: [
    'Perfect, continuăm!', 'Bine! Spune-mi mai mult.', 'Înțeles!', 'Super, mergem înainte.',
  ],
  nu: [
    'Nicio problemă. Altceva pot face?', 'Bine, cum altfel te pot ajuta?', 'Înțeleg. Spune-mi ce vrei.',
  ],
  gluma: [
    'De ce nu pot programatorii să meargă afară?\nPentru că nu știu să facă **escape**! 😄',
    'Ce i-a spus 0 lui 8?\n**Centură frumoasă!** 😂',
    'Câți programatori sunt necesari pentru a schimba un bec?\n**Niciunul** — e o problemă de hardware! 💡',
    'De ce a traversat puiul strada?\nPentru că **JSON** era pe partea cealaltă! 🐔',
    'Ce face un informatician când îi e frig?\n**Stă lângă Windows!** 🪟',
  ],
  motivatie: [
    '"Succesul nu e cheia fericirii. Fericirea este cheia succesului." — A. Schweitzer',
    '"Nu contează cât de încet mergi, atâta timp cât nu te oprești." — Confucius',
    '"Cea mai bună modalitate de a prezice viitorul este să îl creezi." — Peter Drucker',
    '"Fiecare expert a fost cândva un începător." — Helen Hayes',
    '"Încearcă nu. Fă, sau nu face." — Yoda',
    '"Visele nu funcționează dacă tu nu muncești." — John C. Maxwell',
  ],
  sfat: [
    'Sfatul meu: împarte problema mare în pași mici. Primul pas este cel mai important.',
    'Concentrează-te pe ce poți controla. Restul lasă-l să curgă.',
    'Consistența bate intensitatea. Puțin în fiecare zi face diferența.',
    'Nu compara progresul tău cu al altora. Compară-te cu tine de ieri.',
  ],
};

// ─── Calcule matematice ───────────────────────────────────────────────────────

function tryMathExpression(text: string): string | null {
  const clean = text
    .replace(/[xX×]/g, '*')
    .replace(/÷/g, '/')
    .replace(/\^/g, '**')
    .replace(/,/g, '.')
    .trim();

  if (/^\s*[\-\d\(][\d\s\+\-\*\/\(\)\.\*%]*\s*$/.test(clean)) {
    try {
      const safe = clean.replace(/[^0-9\+\-\*\/\(\)\.\s%\*]/g, '');
      if (safe.length > 0 && /\d/.test(safe) && /[\+\-\*\/]/.test(safe)) {
        const result = Function('"use strict"; return (' + safe + ')')();
        if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
          return (Math.round(result * 1e9) / 1e9).toString();
        }
      }
    } catch {}
  }
  return null;
}

function tryMathNaturalLanguage(text: string): string | null {
  const n = normalize(text);

  const patterns: [RegExp, (a: number, b: number) => number | string][] = [
    [/([\d,.]+)\s*(plus|\+|si adaugat)\s*([\d,.]+)/, (a, b) => a + b],
    [/([\d,.]+)\s*(minus|\-|scazut cu)\s*([\d,.]+)/, (a, b) => a - b],
    [/([\d,.]+)\s*(ori|inmultit cu|\*|x)\s*([\d,.]+)/, (a, b) => a * b],
    [/([\d,.]+)\s*(impartit la|impartit cu|\/)\s*([\d,.]+)/, (a, b) => b !== 0 ? a / b : 'eroare: împărțire la zero'],
    [/radical din\s*([\d,.]+)/, (a) => Math.sqrt(a)],
    [/([\d,.]+)\s*la puterea\s*([\d,.]+)/, (a, b) => Math.pow(a, b)],
    [/([\d,.]+)\s*la patrat/, (a) => a * a],
    [/([\d,.]+)\s*procente? din\s*([\d,.]+)/, (a, b) => (a / 100) * b],
    [/cat\s*(?:e|este|face)\s*([\d,.]+)\s*(plus|\+)\s*([\d,.]+)/, (a, b) => a + b],
  ];

  for (const [regex, fn] of patterns) {
    const m = n.match(regex);
    if (m) {
      const nums = m.slice(1).filter(s => /[\d,.]/.test(s)).map(s => parseFloat(s.replace(',', '.')));
      if (nums.length >= (fn.length)) {
        const result = fn(nums[0], nums[1]);
        const formatted = typeof result === 'number'
          ? (Math.round(result * 1e9) / 1e9).toString()
          : result;
        return formatted.toString();
      }
    }
  }

  return null;
}

// ─── Data si ora ──────────────────────────────────────────────────────────────

function getDateTime(text: string): string | null {
  const n = normalize(text);
  const now = new Date();

  const ZILE = ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'];
  const LUNI = ['ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie',
    'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie'];
  const SEZOANE = ['iarnă', 'iarnă', 'primăvară', 'primăvară', 'primăvară',
    'vară', 'vară', 'vară', 'toamnă', 'toamnă', 'toamnă', 'iarnă'];

  if (/(ce ora|ora exacta|cat e ceasul|ceasul)/.test(n)) {
    const h = now.getHours().toString().padStart(2, '0');
    const m = now.getMinutes().toString().padStart(2, '0');
    const s = now.getSeconds().toString().padStart(2, '0');
    return `Ora exactă: **${h}:${m}:${s}**`;
  }

  if (/(ce data|azi|astazi|ce zi|ziua de azi|data de azi)/.test(n)) {
    return `Astăzi este **${ZILE[now.getDay()]}, ${now.getDate()} ${LUNI[now.getMonth()]} ${now.getFullYear()}**.`;
  }

  if (/(ce an|ce luna|ce sezon|in ce an)/.test(n)) {
    const sezon = SEZOANE[now.getMonth()];
    return `Suntem în **${LUNI[now.getMonth()]} ${now.getFullYear()}** — ${sezon}.`;
  }

  return null;
}

// ─── Comenzi de memorie ───────────────────────────────────────────────────────

function handleMemoryCommand(text: string, state: BrainState): string | null {
  const n = normalize(text);

  // Salveaza informatie
  const retineMatch = text.match(/(?:retine|memorizeaza|noteaza|aminteste-ti|salveaza)\s+(?:ca\s+|faptul ca\s+)?(.+)/i);
  if (retineMatch) {
    const info = retineMatch[1].trim();
    const key = `mem_${Date.now()}`;
    state.memory[key] = info;
    return `Am reținut: **"${info}"**\n\nPoți să mă întrebi oricând și îți voi aminti!`;
  }

  // Afisare memorie
  if (/(ce ai retinut|ce ti-am spus|ce stii despre mine|aminteste-mi|afiseaza memoria)/.test(n)) {
    const mems = Object.entries(state.memory)
      .filter(([k]) => k.startsWith('mem_'))
      .map(([, v]) => v);

    if (mems.length === 0) {
      return 'Nu am reținut nimic încă. Spune-mi "Reține că..." și voi memora!';
    }
    return `**Ce am reținut:**\n\n${mems.map((m, i) => `${i + 1}. ${m}`).join('\n')}`;
  }

  // Stergere memorie
  if (/(sterge memoria|uita totul|reset|curata memoria)/.test(n)) {
    Object.keys(state.memory).forEach(k => {
      if (k.startsWith('mem_')) delete state.memory[k];
    });
    return 'Am șters toate notițele! Memoria documentelor rămâne intactă.';
  }

  return null;
}

// ─── Comenzi legate de documente ─────────────────────────────────────────────

function handleDocumentQuery(text: string, state: BrainState): string | null {
  const n = normalize(text);

  if (/(ce documente|ce fisiere|ce ai invatat|ce materiale|ce stii din|lista documente)/.test(n)) {
    if (state.learnedDocuments.length === 0) {
      return 'Nu am niciun document încărcat încă.\n\nApasă butonul 📎 pentru a-mi trimite un fișier text pe care să îl studiez!';
    }
    const list = state.learnedDocuments
      .map((d, i) => `${i + 1}. **${d.name}** (${d.wordCount} cuvinte)`)
      .join('\n');
    return `**Documente studiate:**\n\n${list}\n\nPoți să mă întrebi orice despre ele!`;
  }

  return null;
}

// ─── Introducere si nume ──────────────────────────────────────────────────────

function handleIntroduction(text: string, state: BrainState): string | null {
  const nameMatch = text.match(/(?:ma numesc|sunt|imi spui|cheama-ma|numele meu este)\s+([A-ZĂÂÎȘȚ][a-zăâîșț]+(?:\s+[A-ZĂÂÎȘȚ][a-zăâîșț]+)?)/);
  if (nameMatch) {
    const candidate = nameMatch[1].trim();
    const excluded = ['bine', 'ok', 'aci', 'here', 'gata', 'axon'];
    if (!excluded.includes(candidate.toLowerCase()) && candidate.length > 1) {
      state.userName = candidate;
      state.memory['__name__'] = candidate;
      return `Mă bucur să te cunosc, **${candidate}**! 👋\n\nAcum că știu cine ești, pot personaliza mai bine răspunsurile. Ce vrei să facem?`;
    }
  }
  return null;
}

// ─── Motor principal ──────────────────────────────────────────────────────────

export function processMessage(text: string, state: BrainState): string {
  state.conversationCount++;
  const trimmed = text.trim();
  if (!trimmed) return 'Aștept mesajul tău...';

  const name = state.userName ? `, ${state.userName}` : '';

  // 1. Introducere / Nume
  const intro = handleIntroduction(trimmed, state);
  if (intro) return intro;

  // 2. Comenzi memorie
  const memCmd = handleMemoryCommand(trimmed, state);
  if (memCmd) return memCmd;

  // 3. Interogare documente
  const docQuery = handleDocumentQuery(trimmed, state);
  if (docQuery) return docQuery;

  // 4. Data / Ora
  const dt = getDateTime(trimmed);
  if (dt) return dt;

  // 5. Matematica in limbaj natural
  const nlMath = tryMathNaturalLanguage(trimmed);
  if (nlMath !== null) return `Rezultat: **${nlMath}**`;

  // 6. Expresie matematica directa
  const exprMath = tryMathExpression(trimmed);
  if (exprMath !== null) return `= **${exprMath}**`;

  // 7. Cautare in documente invatate
  const docResult = searchDocuments(trimmed, state.learnedDocuments);
  if (docResult) return docResult;

  // 8. Detectare intentie
  const intent = detectIntent(trimmed);
  if (intent !== 'unknown' && RESPONSES[intent]) {
    let resp = pick(RESPONSES[intent]);
    if (state.userName && intent === 'salut') {
      resp = resp.replace('!', `${name}!`);
    }
    // Track topic
    state.lastTopics = [intent, ...state.lastTopics.slice(0, 4)];
    return resp;
  }

  // 9. Raspuns contextual generic
  return generateContextualResponse(trimmed, state, name);
}

function generateContextualResponse(text: string, state: BrainState, name: string): string {
  const n = normalize(text);

  // Intrebari cu "de ce"
  if (/^de ce/.test(n)) {
    return pick([
      `Bună întrebare${name}! Aceasta ține de mai mulți factori. Poți detalia mai mult contextul?`,
      `Hmm, există mai multe explicații pentru asta. Ce aspect te interesează cel mai mult?`,
      `Fenomenul acesta are cauze multiple. Spune-mi mai mult și voi analiza!`,
    ]);
  }

  // Intrebari cu "cum"
  if (/^cum/.test(n)) {
    return pick([
      `Procesul implică mai mulți pași${name}. Ai putea fi mai specific?`,
      `Depinde de context. Spune-mi mai multe detalii!`,
      `Există mai multe metode. Care e situația exactă?`,
    ]);
  }

  // Intrebari cu "ce"
  if (/^ce\s/.test(n)) {
    const hasDocs = state.learnedDocuments.length > 0;
    if (hasDocs) {
      return pick([
        `Nu am găsit informații exacte despre asta în documentele mele${name}. Reformulează și voi căuta din nou!`,
        `Hmm, nu am date specifice despre asta. Dacă îmi trimiți un document pe tema asta, o să învăț!`,
      ]);
    }
    return pick([
      `Interesantă întrebare${name}! Dacă îmi trimiți documente pe tema asta, pot răspunde mai precis.`,
      `Nu am date specifice acum, dar dacă îmi încarci un fișier pe acest subiect, voi putea ajuta!`,
    ]);
  }

  // Afirmatie / comentariu
  return pick([
    `Înțeleg ce spui${name}. Poți elabora mai mult?`,
    `Interesant${name}! Spune-mi mai mult, ascult.`,
    `Notez asta${name}. Continuă!`,
    `Ai un punct bun acolo${name}. Ce urmează?`,
    `Înțeleg perspectiva ta${name}. Cum pot ajuta?`,
  ]);
}

// ─── Procesare document incarcat ─────────────────────────────────────────────

export function processDocument(
  name: string,
  content: string,
  state: BrainState
): string {
  const words = content.trim().split(/\s+/).length;
  const id = `doc_${Date.now()}`;

  const doc: LearnedDocument = {
    id,
    name,
    content: content.trim(),
    addedAt: new Date(),
    wordCount: words,
  };

  // Inlocuieste daca exista un document cu acelasi nume
  const existingIdx = state.learnedDocuments.findIndex(d => d.name === name);
  if (existingIdx >= 0) {
    state.learnedDocuments[existingIdx] = doc;
    return `Am actualizat documentul **"${name}"** (${words} cuvinte).\n\nAcum știu conținutul actualizat. Întreabă-mă orice despre el!`;
  }

  state.learnedDocuments.push(doc);

  // Rezumat rapid
  const firstLine = content.split('\n').find(l => l.trim().length > 10) || '';
  const preview = firstLine.length > 100 ? firstLine.slice(0, 100) + '...' : firstLine;

  return `Am studiat documentul **"${name}"** (${words} cuvinte)! 📚\n\n${preview ? `Prima linie: *"${preview}"*\n\n` : ''}Acum pot răspunde la întrebări despre conținutul lui. Încearcă!`;
}
