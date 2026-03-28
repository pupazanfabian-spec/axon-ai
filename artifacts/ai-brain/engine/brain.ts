
// AI Brain - Motor de inteligenta artificiala offline
// Nu foloseste API keys sau internet - totul ruleaza local

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface BrainState {
  memory: Record<string, string>;
  userName: string | null;
  conversationCount: number;
}

// Baza de cunostinte extinsa
const KNOWLEDGE_BASE: Record<string, string[]> = {
  salut: [
    'Salut! Sunt Axon, asistentul tau AI offline. Cu ce te pot ajuta?',
    'Bună ziua! Sunt Axon, gata să te ajut. Ce dorești?',
    'Hei! Mă bucur că vorbim. Sunt Axon, AI-ul tău personal. Ce pot face pentru tine?',
  ],
  bine: [
    'Mă bucur! Cum te pot ajuta?',
    'Super! Spune-mi cu ce poți folosi ajutor astăzi.',
    'Perfect! Sunt aici pentru tine.',
  ],
  multumesc: [
    'Cu plăcere! Altceva pot face pentru tine?',
    'Nu e nicio problemă! Sunt mereu aici dacă ai nevoie.',
    'Oricând! Mă bucur că am putut ajuta.',
  ],
  rau: [
    'Îmi pare rău să aud asta. Ce s-a întâmplat?',
    'Sper să te simți mai bine curând. Pot face ceva pentru tine?',
    'Înțeleg. Uneori lucrurile sunt grele. Sunt aici dacă vrei să vorbești.',
  ],
  ajutor: [
    'Bineînțeles! Pot să te ajut cu:\n• Calcule matematice\n• Informații generale\n• Conversație\n• Ora și data\n• Definiții de cuvinte\n• Și multe altele!\n\nCe dorești?',
  ],
  cine_esti: [
    'Sunt Axon, un asistent AI creat să funcționeze complet offline. Am un creier propriu bazat pe procesare de limbaj natural și o bază de cunoștințe extinsă. Nu am nevoie de internet sau chei API - totul rulează direct pe dispozitivul tău!',
    'Mă numesc Axon! Sunt un AI offline care poate înțelege și răspunde în română. Procesez limbajul natural local, fără conexiune la internet.',
  ],
  ce_poti: [
    'Pot face multe lucruri:\n\n🧮 Calcule matematice complexe\n📅 Să îți spun data și ora\n💬 Să purtăm conversații\n📖 Să definesc cuvinte\n🎯 Să răspund la întrebări\n💡 Să îți dau sfaturi\n🧠 Să memorez informații în sesiune\n\nCere-mi orice!',
  ],
  da: [
    'Înțeles! Continuăm.',
    'Bine, spune-mi mai mult.',
    'Perfect!',
  ],
  nu: [
    'În regulă, nu e nicio problemă.',
    'Bine, cum pot altfel să te ajut?',
    'Înțeleg. Dacă se schimbă ceva, sunt aici.',
  ],
};

// Detectarea intentiei
function detectIntent(text: string): string {
  const lower = text.toLowerCase().trim();

  // Salutări
  if (/^(salut|buna|bun[ăa]|hei|hello|hi|hey|servus|noroc)(\s|!|,|$)/.test(lower)) return 'salut';
  
  // Stare buna
  if (/(bine|super|grozav|minunat|excelent|ok|okay)/.test(lower) && /(sunt|ma simt|simt|îmi merge|merge)/.test(lower)) return 'bine';
  
  // Stare rea
  if (/(rau|prost|nasol|trist|suparat|nervos|obosit)/.test(lower) && /(sunt|ma simt|simt)/.test(lower)) return 'rau';
  
  // Multumiri
  if (/(multumesc|mersi|thanks|thank you|ti-am ramane|iti multumesc)/.test(lower)) return 'multumesc';
  
  // Ajutor
  if (/(ajutor|help|ajuta-ma|ajuta ma|nu stiu|ce poti|ce stii)/.test(lower)) return 'ajutor';
  
  // Identitate
  if (/(cine esti|ce esti|cum te cheama|cum iti zice|prezinta|spune-mi despre tine)/.test(lower)) return 'cine_esti';
  
  // Capabilitati
  if (/(ce poti|ce stii|ce faci|capabilitati|functii|ajuta|poti sa)/.test(lower)) return 'ce_poti';
  
  // Da/Nu
  if (/^(da|yes|yep|desigur|bineinteles|sigur)(\s|!|\.|$)/.test(lower)) return 'da';
  if (/^(nu|no|nope|negativ)(\s|!|\.|$)/.test(lower)) return 'nu';
  
  return 'unknown';
}

// Calcule matematice
function tryMath(text: string): string | null {
  const mathPattern = /[\d\s\+\-\*\/\(\)\.\,\^%]+/g;
  const clean = text
    .replace(/[xX×]/g, '*')
    .replace(/÷/g, '/')
    .replace(/\^/g, '**')
    .replace(/,/g, '.')
    .replace(/([0-9])\s*%/g, '($1/100)')
    .trim();
    
  // Detecteaza daca e o expresie matematica
  if (/^\s*[\d\(\-][\d\s\+\-\*\/\(\)\.\^%]*\s*$/.test(clean)) {
    try {
      const safeExpr = clean.replace(/[^0-9\+\-\*\/\(\)\.\s\%\*]/g, '');
      if (safeExpr.length > 0 && /\d/.test(safeExpr)) {
        const result = Function('"use strict"; return (' + safeExpr + ')')();
        if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
          return Math.round(result * 1000000) / 1000000 + '';
        }
      }
    } catch {}
  }
  return null;
}

// Extrage operatia matematica din text
function extractMathFromText(text: string): string | null {
  const lower = text.toLowerCase();
  
  // Adunare
  let m = lower.match(/cat[ăa]\s+(?:face|e|este|fac|este)?\s*([\d,\.]+)\s*(?:plus|\+|si)\s*([\d,\.]+)/);
  if (m) {
    const a = parseFloat(m[1].replace(',', '.'));
    const b = parseFloat(m[2].replace(',', '.'));
    return (a + b).toString();
  }
  
  // Scadere
  m = lower.match(/([\d,\.]+)\s*(?:minus|\-)\s*([\d,\.]+)/);
  if (m) {
    const a = parseFloat(m[1].replace(',', '.'));
    const b = parseFloat(m[2].replace(',', '.'));
    return (a - b).toString();
  }
  
  // Inmultire
  m = lower.match(/([\d,\.]+)\s*(?:ori|înmulțit cu|\*|x)\s*([\d,\.]+)/);
  if (m) {
    const a = parseFloat(m[1].replace(',', '.'));
    const b = parseFloat(m[2].replace(',', '.'));
    return (a * b).toString();
  }
  
  // Impartire
  m = lower.match(/([\d,\.]+)\s*(?:împărțit la|impartit la|\/)\s*([\d,\.]+)/);
  if (m) {
    const a = parseFloat(m[1].replace(',', '.'));
    const b = parseFloat(m[2].replace(',', '.'));
    if (b !== 0) return (a / b).toString();
    return 'imposibil (împărțire la zero)';
  }
  
  // Radical / sqrt
  m = lower.match(/(?:radical din|radacina din|sqrt)\s*([\d,\.]+)/);
  if (m) {
    const a = parseFloat(m[1].replace(',', '.'));
    return Math.sqrt(a).toFixed(6).replace(/\.?0+$/, '');
  }
  
  // Putere
  m = lower.match(/([\d,\.]+)\s*(?:la puterea|la pătrat|la cub|ridicat la)\s*([\d,\.]+)?/);
  if (m) {
    const a = parseFloat(m[1].replace(',', '.'));
    const b = m[2] ? parseFloat(m[2].replace(',', '.')) : 
               lower.includes('pătrat') || lower.includes('patrat') ? 2 :
               lower.includes('cub') ? 3 : null;
    if (b !== null) return Math.pow(a, b).toString();
  }
  
  return null;
}

// Ora si data
function getDateTime(text: string): string | null {
  const lower = text.toLowerCase();
  
  if (/(ce or[ăa]|ora exact[ăa]|cat[ăa] e ceasul|ceasul)/.test(lower)) {
    const now = new Date();
    const h = now.getHours().toString().padStart(2, '0');
    const m = now.getMinutes().toString().padStart(2, '0');
    const s = now.getSeconds().toString().padStart(2, '0');
    return `Ora exactă este: ${h}:${m}:${s}`;
  }
  
  if (/(ce dat[ăa]|azi|astazi|ce zi|ziua de azi|data de azi)/.test(lower)) {
    const now = new Date();
    const zile = ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'];
    const luni = ['ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie', 'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie'];
    return `Astăzi este ${zile[now.getDay()]}, ${now.getDate()} ${luni[now.getMonth()]} ${now.getFullYear()}.`;
  }
  
  if (/(ce an|in ce an|ce sezon|ce luna|luna curenta)/.test(lower)) {
    const now = new Date();
    const luni = ['ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie', 'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie'];
    const month = now.getMonth();
    const sezon = month >= 2 && month <= 4 ? 'primăvară' :
                  month >= 5 && month <= 7 ? 'vară' :
                  month >= 8 && month <= 10 ? 'toamnă' : 'iarnă';
    return `Suntem în ${luni[month]} ${now.getFullYear()} — ${sezon}.`;
  }
  
  return null;
}

// Definitii si informatii
function getDefinition(text: string): string | null {
  const lower = text.toLowerCase();
  
  const definitions: Record<string, string> = {
    inteligenta: 'Inteligența este capacitatea de a înțelege, a raționa, a rezolva probleme și a se adapta la situații noi. Există mai multe tipuri: verbală, logico-matematică, spațială, muzicală, interpersonală și intrapersonală.',
    calculator: 'Un calculator este o mașină electronică care prelucrează date conform unor instrucțiuni programate. Componentele principale sunt: procesor (CPU), memorie (RAM), stocare (HDD/SSD) și interfețele de intrare/ieșire.',
    internet: 'Internetul este o rețea globală de computere interconectate care permite comunicarea și schimbul de informații la nivel mondial. A fost creat în 1969 ca ARPANET și a devenit public în anii 1990.',
    robot: 'Un robot este o mașină programabilă capabilă să execute sarcini automat. Robiotica combină inginerie mecanică, electrică și informatică pentru a crea sisteme autonome sau semi-autonome.',
    apa: 'Apa (H₂O) este o substanță chimică esențială pentru viață. Se prezintă în trei stări: lichidă (apă), solidă (gheață) și gazoasă (abur). Acoperă aproximativ 71% din suprafața Pământului.',
    lumina: 'Lumina este radiație electromagnetică vizibilă pentru ochiul uman. Se propagă cu viteza de aproximativ 299.792 km/s în vid. Este compusă din fotoni și poate manifesta atât comportament ondulatoriu cât și corpuscular.',
    gravitatie: 'Gravitația este forța de atracție dintre obiecte cu masă. Pe Pământ, accelerația gravitațională este de ~9.81 m/s². Einstein a descris gravitația ca o curbură a spațiu-timpului în teoria relativității generale.',
    adn: 'ADN (Acid DezoxiriboNucleic) este molecula care conține informația genetică a organismelor vii. Are structura de dublă helix și conține secvențe numite gene care codifică proteinele necesare vieții.',
    matematica: 'Matematica este știința care se ocupă cu studiul cantității, structurii, spațiului și schimbării. Include ramuri ca aritmetica, algebra, geometria, calculul infinitezimal și statistica.',
    fizica: 'Fizica este știința care studiază proprietățile fundamentale ale materiei și energiei, și interacțiunile dintre ele. Include mecanica, termodinamica, electromagnetismul, optica și fizica cuantică.',
    chimie: 'Chimia este știința care studiază proprietățile, compoziția, structura și transformările substanțelor. Se ocupă cu atomi, molecule, reacții chimice și legăturile dintre ele.',
    biologie: 'Biologia este știința vieții, care studiază organismele vii, structura, funcțiile, creșterea, originea, evoluția și distribuția lor. Include botanica, zoologia, microbiologia și genetica.',
    programare: 'Programarea este procesul de creare a instrucțiunilor (cod) pe care calculatoarele le urmează pentru a executa sarcini. Limbajele populare includ Python, JavaScript, Java, C++ și Kotlin.',
    romania: 'România este o țară în Europa de Sud-Est, cu capitala București. Are o populație de ~19 milioane de locuitori și o suprafață de ~238.000 km². Este membră UE din 2007 și NATO din 2004.',
  };
  
  if (/(ce este|ce înseamn[ăa]|definit[ie]|spune-mi despre|explica-mi|ce stii despre)\s+(.+)/.test(lower)) {
    const subject = lower.match(/(ce este|ce înseamn[ăa]|definit[ie]|spune-mi despre|explica-mi|ce stii despre)\s+(.+)/)?.[2]?.trim();
    if (subject) {
      for (const [key, def] of Object.entries(definitions)) {
        if (subject.includes(key) || key.includes(subject)) {
          return def;
        }
      }
    }
  }
  
  return null;
}

// Comenzi speciale
function handleCommand(text: string, state: BrainState): string | null {
  const lower = text.toLowerCase().trim();
  
  // Memorie - salveaza informatii
  const memorizeMatch = lower.match(/(?:retine|memorizeaza|noteaza|aminteste-ti)\s+(?:ca\s+)?(.+)/);
  if (memorizeMatch) {
    const info = memorizeMatch[1];
    const key = 'info_' + Date.now();
    state.memory[key] = info;
    return `Am reținut: "${info}". Îți voi aminti dacă ai nevoie!`;
  }
  
  // Recupereaza memorie
  if (/(ce ai retinut|ce ti-am spus|ce stii despre mine|aminteste-mi)/.test(lower)) {
    const memories = Object.values(state.memory).filter(v => !v.startsWith('name:'));
    if (memories.length === 0) return 'Nu am reținut nimic specific până acum. Poți să îmi spui să rețin ceva cu "Reține că..."';
    return `Iată ce am reținut:\n${memories.map((m, i) => `${i + 1}. ${m}`).join('\n')}`;
  }
  
  // Introducere / Nume
  const nameMatch = lower.match(/(?:ma numesc|sunt|name is|imi spui|cheama-ma)\s+([a-zăâîșț]+(?:\s+[a-zăâîșț]+)?)/i);
  if (nameMatch && !/(ma numesc azi|sunt bine|sunt ok)/.test(lower)) {
    const name = nameMatch[1].trim();
    if (name.length > 1 && name.length < 30) {
      state.userName = name.charAt(0).toUpperCase() + name.slice(1);
      state.memory['name:'] = state.userName;
      return `Mă bucur să te cunosc, ${state.userName}! 👋 Cum te pot ajuta?`;
    }
  }
  
  // Stergere memorie
  if (/(sterge memoria|uita totul|reset memorie|curata memoria)/.test(lower)) {
    const name = state.userName;
    Object.keys(state.memory).forEach(k => delete state.memory[k]);
    state.userName = name;
    return 'Am șters tot ce am reținut! Pot porni de la zero acum.';
  }
  
  // Glume
  if (/(o gluma|spune-mi o gluma|fa-ma sa rad|amuzant)/.test(lower)) {
    const jokes = [
      'De ce nu pot programatorii să meargă afară? Pentru că nu știu să facă escape! 😄',
      'Ce i-a spus 0 lui 8? Centura frumoasă! 😂',
      'Un cal intră într-un bar. Barmanii îl întreabă: "De ce ești atât de trist?" Calul: "De ce ești atât de smecherlos?" 🐴',
      'Câți programatori sunt necesari pentru a schimba un bec? Niciunul, e o problemă de hardware! 💡',
    ];
    return jokes[Math.floor(Math.random() * jokes.length)];
  }
  
  // Motivatie
  if (/(motiveaza-ma|da-mi curaj|am nevoie de motivatie|inspiratie)/.test(lower)) {
    const quotes = [
      '"Succesul nu e cheia fericirii. Fericirea este cheia succesului." – Albert Schweitzer',
      '"Nu contează cât de încet mergi, atâta timp cât nu te oprești." – Confucius',
      '"Cea mai bună modalitate de a prezice viitorul este să îl creezi." – Peter Drucker',
      '"Încearcă nu. Fă, sau nu face. Nu există încearcă." – Yoda',
      '"Fiecare expert a fost cândva un începător." – Helen Hayes',
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  }
  
  // Numara
  const countMatch = lower.match(/(?:numara|numar[ăa]|count)\s+(?:de la\s+)?(\d+)\s+(?:la|pana la|until)\s+(\d+)/);
  if (countMatch) {
    const start = parseInt(countMatch[1]);
    const end = parseInt(countMatch[2]);
    if (Math.abs(end - start) <= 20) {
      const nums = [];
      if (start <= end) {
        for (let i = start; i <= end; i++) nums.push(i);
      } else {
        for (let i = start; i >= end; i--) nums.push(i);
      }
      return nums.join(', ');
    }
    return `Numărul de la ${start} la ${end}: ${start}, ${start + 1}, ... ${end} (${Math.abs(end - start) + 1} numere total)`;
  }
  
  return null;
}

// Raspunsuri generice inteligente
function generateGenericResponse(text: string, state: BrainState): string {
  const lower = text.toLowerCase();
  const name = state.userName ? `, ${state.userName}` : '';
  
  // Intrebare cu "de ce"
  if (/^de ce/.test(lower)) {
    const responses = [
      `Aceasta este o întrebare bună${name}! Fenomenul acesta apare din mai multe motive complexe. Poți fi mai specific?`,
      `Hmm, "${text}" este o întrebare filozofică interesantă. Ce te-a determinat să te gândești la asta?`,
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  // Intrebare cu "cum"
  if (/^cum/.test(lower)) {
    return `Procesul pentru "${text.replace(/^cum\s+/i, '')}" implică mai mulți pași. Ai putea detalia mai mult ce anume vrei să știi?`;
  }
  
  // Intrebare cu "cand"
  if (/^când|^cand/.test(lower)) {
    return `Momentul exact depinde de mai mulți factori${name}. Poți oferi mai mult context?`;
  }
  
  // Intrebare generala
  if (/\?$/.test(text) || /^(ce|cine|unde|care|cat|cata|cati|cate)/.test(lower)) {
    const responses = [
      `Întrebare interesantă${name}! Bazele mele de cunoștințe offline acoperă multe domenii. Reformulează puțin și voi face tot posibilul să ajut!`,
      `Hmm${name}, aceasta este o zonă complexă. Spune-mi mai multe detalii și voi analiza!`,
      `Bună întrebare! Îmi voi folosi toată baza de cunoștințe pentru a-ți răspunde. Poți fi mai specific?`,
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  // Raspuns generic
  const generics = [
    `Înțeleg ce spui${name}. Poți elabora mai mult?`,
    `Interesant${name}! Spune-mi mai mult.`,
    `Am procesat mesajul tău. Ce altceva dorești să aflu?`,
    `Sunt aici${name}. Continuă, te ascult!`,
  ];
  return generics[Math.floor(Math.random() * generics.length)];
}

// Functia principala a creierului AI
export function processMessage(text: string, state: BrainState): string {
  state.conversationCount++;
  const trimmed = text.trim();
  
  if (!trimmed) return 'Aștept mesajul tău...';
  
  // 1. Verificare comenzi speciale
  const command = handleCommand(trimmed, state);
  if (command) return command;
  
  // 2. Verificare data/ora
  const dateTime = getDateTime(trimmed);
  if (dateTime) return dateTime;
  
  // 3. Verificare calcul matematic explicit
  const textMath = extractMathFromText(trimmed);
  if (textMath !== null) {
    return `Rezultatul calculului este: **${textMath}**`;
  }
  
  // 4. Verificare expresie matematica directa
  const directMath = tryMath(trimmed);
  if (directMath !== null) {
    return `= **${directMath}**`;
  }
  
  // 5. Definitii
  const definition = getDefinition(trimmed);
  if (definition) return definition;
  
  // 6. Detectare intentie
  const intent = detectIntent(trimmed);
  if (intent !== 'unknown' && KNOWLEDGE_BASE[intent]) {
    const responses = KNOWLEDGE_BASE[intent];
    let response = responses[Math.floor(Math.random() * responses.length)];
    
    // Personalizeaza cu numele
    if (state.userName && !response.includes(state.userName)) {
      if (intent === 'salut') {
        response = response.replace('!', `, ${state.userName}!`);
      }
    }
    return response;
  }
  
  // 7. Raspuns generic inteligent
  return generateGenericResponse(trimmed, state);
}
