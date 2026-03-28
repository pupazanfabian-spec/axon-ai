
// Axon AI Brain v3 — Motor offline cu dictionar roman si memorie persistenta

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
  // Stiinte
  fotosinteza: 'Fotosinteza este procesul prin care plantele convertesc lumina solară, apa și dioxidul de carbon în glucoză și oxigen. Ecuația: 6CO₂ + 6H₂O + lumină → C₆H₁₂O₆ + 6O₂.',
  osmoza: 'Osmoza este trecerea unui solvent (de obicei apă) printr-o membrană semipermeabilă dinspre soluția mai diluată spre cea mai concentrată, până la atingerea echilibrului osmotic.',
  metabolism: 'Metabolismul reprezintă totalitatea reacțiilor chimice din organism prin care se obține energie și se sintetizează molecule necesare vieții. Se împarte în catabolism (descompunere) și anabolism (sinteză).',
  celula: 'Celula este unitatea structurală și funcțională de bază a tuturor organismelor vii. Poate fi procariotă (fără nucleu delimitat, ex: bacterii) sau eucariotă (cu nucleu delimitat, ex: celule umane).',
  adn: 'ADN (Acid DezoxiriboNucleic) este molecula ereditară care conține informația genetică a organismelor. Are structura de dublă helix descoperită de Watson și Crick în 1953. Conține patru baze azotate: adenina, timina, guanina, citozina.',
  arn: 'ARN (Acid RiboNucleic) este o moleculă implicată în sinteza proteinelor. Există trei tipuri: ARN mesager (mARN), ARN ribozomal (rARN) și ARN de transfer (tARN).',
  gravitatie: 'Gravitația este forța fundamentală de atracție dintre toate obiectele cu masă. Pe Pământ, g ≈ 9,81 m/s². Einstein a descris gravitația ca o curbură a spațiu-timpului în Teoria Relativității Generale.',
  electromagnetism: 'Electromagnetismul este ramura fizicii care studiază forțele electrice și magnetice. A fost unificat de James Clerk Maxwell prin cele patru ecuații ale sale (1865).',
  termodinamica: 'Termodinamica studiază relațiile dintre căldură, energie și lucru mecanic. Are patru legi fundamentale: legea zero (echilibrul termic), prima lege (conservarea energiei), a doua lege (entropia crește), a treia lege (entropia la zero absolut).',
  mecanica: 'Mecanica este ramura fizicii care studiază mișcarea corpurilor și forțele care o cauzează. Include mecanica clasică (Newton), relativistă (Einstein) și cuantică (Planck, Heisenberg, Schrödinger).',
  chimie: 'Chimia studiază structura, proprietățile și transformările substanțelor. Principalele ramuri: chimie organică (compuși cu carbon), chimie anorganică, chimie fizică, biochimie.',
  fizica: 'Fizica este știința care studiază proprietățile fundamentale ale materiei și energiei. Include mecanica, termodinamica, electromagnetismul, optica, fizica cuantică și relativitatea.',
  biologie: 'Biologia este știința vieții, care studiază structura, funcțiile, creșterea, originea și evoluția organismelor. Include zoologia, botanica, genetica, ecologia și microbiologia.',
  matematica: 'Matematica este știința raționamentului formal cu cantități, structuri, spații și schimbări. Ramuri principale: aritmetica, algebra, geometria, analiza matematică, statistica, teoria probabilităților.',
  geometrie: 'Geometria studiază formele, mărimile și proprietățile spațiale ale figurilor. Include geometria euclidiană (plan), geometria spațială, geometria analitică și geometriile neeuclidiece.',
  algebra: 'Algebra este ramura matematicii care folosește simboluri (litere) pentru a reprezenta numere și relații între ele. Include algebra elementară, algebra abstractă și algebra liniară.',
  statistica: 'Statistica este știința colectării, analizării și interpretării datelor. Se împarte în statistică descriptivă (rezumarea datelor) și statistică inferențială (tragerea concluziilor).',
  calcul: 'Calculul infinitezimal (calculus) studiază derivatele și integralele funcțiilor. A fost dezvoltat independent de Newton și Leibniz în secolul XVII.',
  probabilitate: 'Teoria probabilităților studiază fenomenele aleatoare și cuantifică șansele de apariție a evenimentelor. P(A) ∈ [0,1], unde 0 = imposibil și 1 = sigur.',
  // Tehnologie
  inteligenta_artificiala: 'Inteligența Artificială (IA/AI) este domeniul informaticii care creează sisteme capabile să simuleze comportamentul inteligent uman: recunoașterea vorbirii, înțelegerea limbajului, rezolvarea problemelor, luarea deciziilor.',
  algoritm: 'Un algoritm este o secvență finită și bine definită de instrucțiuni pentru rezolvarea unei probleme. Caracteristici: finitudine, definire clară, input, output, eficiență.',
  programare: 'Programarea este procesul de scriere a instrucțiunilor (cod sursă) pe care calculatoarele le execută. Limbaje populare: Python, JavaScript, Java, C++, Kotlin, Swift, Rust.',
  calculator: 'Calculatorul este o mașină electronică care procesează date conform programelor. Componente: CPU (procesor), RAM (memorie), stocare (HDD/SSD), placa de baza, GPU.',
  internet: 'Internetul este rețeaua globală de calculatoare interconectate care permit comunicarea la nivel mondial. A evoluat din ARPANET (1969). Funcționează pe baza protocoalelor TCP/IP.',
  retea: 'O rețea de calculatoare este un grup de dispozitive interconectate care pot schimba informații. Tipuri: LAN (locală), WAN (zonă largă), MAN (metropolitană), Internet (globală).',
  server: 'Un server este un sistem informatic care furnizează servicii altor calculatoare (clienți) dintr-o rețea. Poate fi server web, server de baze de date, server de email, etc.',
  baza_de_date: 'O bază de date este o colecție organizată de informații stocate și accesate electronic. Tipuri principale: relaționale (SQL) și nerelaționale (NoSQL). Exemple: PostgreSQL, MySQL, MongoDB.',
  securitate: 'Securitatea informatică protejează sistemele digitale împotriva atacurilor cibernetice. Include criptografia, firewall-urile, autentificarea, detectarea intruziunilor.',
  criptografie: 'Criptografia este știința securizării comunicațiilor prin codificarea informațiilor. Metode moderne: criptare simetrică (AES), asimetrică (RSA), funcții hash (SHA).',
  // Economie si finante
  economie: 'Economia studiază modul în care indivizii, companiile și guvernele iau decizii privind utilizarea resurselor limitate. Se împarte în microeconomie și macroeconomie.',
  inflatie: 'Inflația reprezintă creșterea generalizată a prețurilor și scăderea puterii de cumpărare a banilor în timp. Se măsoară prin Indicele Prețurilor de Consum (IPC).',
  deflatie: 'Deflația este scăderea generalizată a prețurilor, opusul inflației. Poate indica o recesiune economică. Banca centrală o combate prin politici monetare expansioniste.',
  pib: 'PIB (Produsul Intern Brut) reprezintă valoarea totală a bunurilor și serviciilor produse într-o țară într-un an. Este principalul indicator al mărimii economiei.',
  investitie: 'O investiție reprezintă alocarea de resurse (bani, timp, efort) cu scopul obținerii unui profit viitor. Tipuri: investiții financiare (acțiuni, obligațiuni), imobiliare, în afaceri.',
  actiune: 'O acțiune reprezintă o fracțiune din capitalul social al unei companii. Deținătorul devine coproprietar și poate primi dividende și participa la deciziile companiei.',
  obligatiune: 'O obligațiune este un instrument de datorie prin care emitentul (stat sau companie) se obligă să plătească dobândă periodică și să ramburseze capitalul la scadență.',
  dobanda: 'Dobânda este costul împrumutării banilor sau câștigul din plasarea lor. Se exprimă ca procent anual (rata dobânzii). Poate fi simplă sau compusă.',
  buget: 'Bugetul este un plan financiar care estimează veniturile și cheltuielile pentru o perioadă determinată. Poate fi echilibrat, excedentar sau deficitar.',
  // Geografie si natura
  romania: 'România este un stat în Europa de Sud-Est, cu suprafața de 238.397 km² și aproximativ 19 milioane de locuitori. Capitala este București. Membră UE din 2007 și NATO din 2004.',
  bucuresti: 'Bucureștiul este capitala și cel mai mare oraș al României, cu peste 2 milioane de locuitori. Este centrul economic, cultural și politic al țării. Fondat oficial în 1459.',
  europa: 'Europa este al doilea cel mai mic continent ca suprafață (10,5 milioane km²), dar al treilea ca populație (~748 milioane). Include 44-50 de state, în funcție de definiție.',
  ocean: 'Oceanele acoperă ~71% din suprafața Pământului. Cele cinci oceane: Pacific (cel mai mare), Atlantic, Indian, Arctic (Polar de Nord) și Antarctic (Polar de Sud).',
  clima: 'Clima reprezintă condițiile meteorologice medii ale unei regiuni pe o perioadă îndelungată (minim 30 ani). Factori determinanți: latitudine, altitudine, proximitatea oceanelor, curenții marini.',
  ecosistem: 'Ecosistemul este un sistem format din comunitatea de organisme vii (biocenoză) și mediul lor abiotic (biotop) care interacționează. Exemple: pădure, lac, deșert, recif de corali.',
  // Filosofie, cultura, societate
  filosofie: 'Filosofia este disciplina care studiază întrebările fundamentale despre existență, cunoaștere, valori, rațiune, minte și limbaj. Ramuri: ontologie, epistemologie, etică, logică, estetică.',
  democratie: 'Democrația este un sistem de guvernare în care puterea aparține poporului, exercitată direct sau prin reprezentanți aleși. Principii: separarea puterilor, libertăți fundamentale, stat de drept.',
  drept: 'Dreptul este ansamblul normelor juridice care reglementează comportamentul uman în societate. Se împarte în drept public (constituțional, penal, administrativ) și drept privat (civil, comercial).',
  cultura: 'Cultura reprezintă ansamblul valorilor, tradițiilor, artei, obiceiurilor și cunoștințelor acumulate de o societate. Include limbaj, religie, morală, artă, știință.',
  psihologie: 'Psihologia studiază comportamentul uman și procesele mentale: percepție, cogniție, emoții, personalitate, comportament, relații interpersonale. Fondator modern: Wilhelm Wundt (1879).',
  sociologie: 'Sociologia studiază societatea umană, structurile sociale, relațiile dintre grupuri și instituțiile sociale. Se ocupă cu stratificarea socială, familia, educația, religia.',
  // Biologie si corp uman
  inima: 'Inima este organul muscular care pompează sângele în tot corpul. La adulți, bate ~70 de ori pe minut și pompează ~5 litri de sânge pe minut. Are patru camere: două atrii și doi ventriculi.',
  creier: 'Creierul este centrul de comandă al sistemului nervos. Are ~86 miliarde de neuroni și controlează toate funcțiile corpului. Consumă ~20% din energia corpului, deși reprezintă doar ~2% din masă.',
  neuron: 'Neuronul este celula de bază a sistemului nervos. Transmite semnale electrochimice prin intermediul sinapselor. Un creier uman conține aproximativ 86 miliarde de neuroni.',
  adn2: 'ADN-ul uman conține ~3 miliarde de perechi de baze azotate și ~20.000-25.000 de gene. Dacă s-ar desfăsura ADN-ul dintr-o singură celulă, ar măsura ~2 metri.',
  vitamina: 'Vitaminele sunt substanțe organice esențiale în cantități mici pentru funcționarea normală a organismului. Există vitamine liposolubile (A, D, E, K) și hidrosolubile (C, complexul B).',
  proteina: 'Proteinele sunt macromolecule esențiale formate din aminoacizi. Funcții: structurale (colagen), enzimatice (amilaza), de transport (hemoglobina), imune (anticorpi), hormonale (insulina).',
  // Arta si cultura
  literatura: 'Literatura reprezintă totalitatea operelor scrise, în special cele cu valoare artistică. Include proza, poezia, drama și eseul. Marii scriitori români: Eminescu, Caragiale, Sadoveanu, Rebreanu.',
  muzica: 'Muzica este arta organizării sunetelor în timp. Include melodia, armonia, ritmul și timbrul. Genuri: clasică, jazz, rock, pop, folk, electronică. Instrumente: coarde, suflat, percuție.',
  pictura: 'Pictura este arta de a aplica pigmenți pe o suprafață pentru a crea imagini. Curenturi: realism, impresionism, cubism, abstractionism, pop art. Mari pictori: Da Vinci, Rembrandt, Monet, Picasso.',
  arhitectura: 'Arhitectura este arta și știința proiectării clădirilor și spațiilor. Stiluri: greco-roman, romanic, gotic, renascentist, baroc, clasicist, modernist, contemporan.',
  cinema: 'Cinematografia este arta filmului, care combină imagine în mișcare, sunet și narațiune. A apărut în 1895 cu frații Lumière. Genuri: dramă, comedie, thriller, horror, SF, documentar.',
};

// ─── Cautare in documente invatate ───────────────────────────────────────────

const STOP_WORDS = new Set([
  'este', 'care', 'unde', 'cine', 'cum', 'cand', 'pentru', 'despre',
  'intre', 'daca', 'este', 'sunt', 'esti', 'avem', 'aveți', 'poate',
  'poti', 'vrei', 'vreau', 'face', 'faci', 'orice', 'nimic', 'ceva',
  'mult', 'prea', 'doar', 'chiar', 'prin', 'dupa', 'inainte', 'acolo',
  'aici', 'acum', 'atunci', 'inca', 'deja', 'pana', 'inca', 'spune',
  'intreb', 'stiu', 'stii', 'stie', 'imi', 'iti', 'lui', 'lor', 'sau',
  'insa', 'totusi', 'incat', 'astfel', 'putea',
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
    let score = 0;
    for (const kw of keywords) {
      if (nc.includes(kw)) score += 2;
    }
    if (score > bestScore) {
      bestScore = score;
      bestDoc = doc;
      const paragraphs = doc.content.split(/\n+/).filter(p => p.trim().length > 20);
      let bestPara = '';
      let paraScore = 0;
      for (const para of paragraphs) {
        const np = norm(para);
        let ps = 0;
        for (const kw of keywords) { if (np.includes(kw)) ps++; }
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

  // Detecteaza cerere de definitie
  const defMatch = n.match(/(?:ce (?:este|inseamna|e)|definitia|defineste|explica|descrie|spune-mi despre|ce stii despre|ce reprezinta)\s+(.+)/);
  const directMatch = n.match(/^(.{3,30})\s*\??\s*$/);

  let subject = defMatch?.[1]?.trim() ?? '';

  // Curata subiectul
  subject = subject
    .replace(/^(un|o|al|a|lui|ei|cel|cea|niste)\s+/i, '')
    .replace(/\?$/, '')
    .trim();

  if (!subject && directMatch) {
    subject = directMatch[1].trim();
  }

  if (!subject) return null;

  const subjectNorm = norm(subject).replace(/\s+/g, '_');
  const subjectNoScore = norm(subject).replace(/_/g, ' ');

  // Cauta exact sau partial
  for (const [key, def] of Object.entries(DICTIONAR)) {
    const keyNorm = key.replace(/_/g, ' ');
    if (
      keyNorm === subjectNoScore ||
      subjectNoScore.includes(keyNorm) ||
      keyNorm.includes(subjectNoScore) ||
      subjectNorm === key
    ) {
      return `**${subject.charAt(0).toUpperCase() + subject.slice(1)}**\n\n${def}`;
    }
  }

  return null;
}

// ─── Detectare intentie ───────────────────────────────────────────────────────

type Intent =
  | 'salut' | 'ramas_bun' | 'stare_buna' | 'stare_rea' | 'multumesc'
  | 'ajutor' | 'identitate_axon' | 'ce_poti' | 'da' | 'nu'
  | 'gluma' | 'motivatie' | 'sfat' | 'data_ora'
  | 'memorie_salveaza' | 'memorie_citeste' | 'memorie_sterge'
  | 'documente_lista' | 'introducere_utilizator'
  | 'matematica' | 'definitie' | 'unknown';

function detectIntent(input: string): Intent {
  const n = norm(input);

  // Salutari
  if (/^(salut|buna|hei|hello|hi|hey|servus|noroc|buna ziua|buna dimineata|buna seara|buna seara|salutare)[\s!,]?$/.test(n)) return 'salut';

  // Ramas bun
  if (/(la revedere|pa|bye|goodbye|pe curand|noapte buna|o zi buna|o seara buna)/.test(n)) return 'ramas_bun';

  // Identitate Axon — verificat INAINTE de orice altceva pentru a nu confunda
  if (
    /(cum (te|il|o|va|iti) cheama|care (e|este|iti este|ii este) numele|ce nume (ai|are|ii)|cum (te|iti) numesti|cum te cheama|cine esti|ce esti tu|spune-mi despre tine|prezinta-te|cum iti zici|cum ti se spune|care e numele tau|ce esti|esti un (robot|ai|bot|computer)|esti axon|cine e axon)/.test(n)
  ) return 'identitate_axon';

  // Stare buna
  if (/(bine|super|grozav|minunat|excelent|perfect|extraordinar)/.test(n) && /(sunt|ma simt|simt|merge|totul)/.test(n)) return 'stare_buna';

  // Stare rea
  if (/(rau|prost|nasol|trist|suparat|nervos|obosit|deprimat|nu e bine|nu prea|nu ma simt)/.test(n)) return 'stare_rea';

  // Multumiri
  if (/(multumesc|mersi|thanks|thank you|apreciez|iti multumesc)/.test(n)) return 'multumesc';

  // Ajutor
  if (/(ajutor|help|nu stiu|ce pot face|cum functionezi|comenzi disponibile)/.test(n)) return 'ajutor';

  // Ce poate face
  if (/(ce poti|ce stii|ce faci|capabilitati|functii|ce comenzi|cum ma poti ajuta)/.test(n)) return 'ce_poti';

  // Da/Nu simple
  if (/^(da|yes|yep|desigur|bineinteles|sigur|corect|exact|asa e|asa este)[\s!.]?$/.test(n)) return 'da';
  if (/^(nu|no|nope|negativ|incorect|gresit|nu e asa|nu este asa)[\s!.]?$/.test(n)) return 'nu';

  // Gluma
  if (/(gluma|jokes|amuzant|fa-ma sa rad|ceva funny|spune-mi o gluma|rad si eu)/.test(n)) return 'gluma';

  // Motivatie / citate
  if (/(motiveaza|motivatie|curaj|inspiratie|citat motivational|quote|incurajeaza|da-mi putere)/.test(n)) return 'motivatie';

  // Sfat
  if (/^(sfat|sfatuieste|ce sa fac|cum sa|recomandare|ce recomanzi|idee|sugestie)/.test(n)) return 'sfat';

  // Data / Ora
  if (/(ce ora|ce data|azi|astazi|ce zi e|ce an|ce luna|ceasul|timestamp|cata vreme)/.test(n)) return 'data_ora';

  // Matematica
  if (/(\d[\d\s]*[\+\-\*\/\^][\d\s]|\d+\s*(plus|minus|ori|impartit|radical|la puterea|procent))/.test(n)) return 'matematica';

  // Memorie
  if (/(retine|memorizeaza|noteaza|tine minte|salveaza|aminteste-ti|nu uita)/.test(n)) return 'memorie_salveaza';
  if (/(ce ai retinut|ce ti-am spus|ce noteaza|afiseaza memoria|ce ai memorat|ce stii despre mine|aminteste-mi|memoria ta)/.test(n)) return 'memorie_citeste';
  if (/(sterge memoria|uita totul|reset memorie|curata memoria|uita ce ti-am spus)/.test(n)) return 'memorie_sterge';

  // Documente
  if (/(ce documente|ce fisiere|ce ai invatat|ce materiale|lista fisiere|documente incarcate)/.test(n)) return 'documente_lista';

  // Introducere utilizator
  if (/(ma numesc|imi zice|cheama-ma|numele meu este|eu sunt|eu ma numesc)/.test(n)) return 'introducere_utilizator';

  // Definitie din dictionar
  if (/(ce este|ce inseamna|defineste|ce reprezinta|ce e|explica-mi|spune-mi despre|ce stii despre)/.test(n)) return 'definitie';

  return 'unknown';
}

// ─── Handler-e pe intent ──────────────────────────────────────────────────────

function handleIdentityAxon(state: BrainState): string {
  const name = state.userName ? `, ${state.userName}` : '';
  return pick([
    `Mă numesc **Axon**${name}! 🤖\n\nSunt un asistent AI creat să funcționeze 100% offline, fără internet și fără chei API. Creierul meu rulează direct pe dispozitivul tău.\n\nAm un dicționar român integrat, pot memora informații și pot studia documente pe care mi le trimiți.`,
    `**Axon** — acesta este numele meu${name}! Sunt un AI offline cu memorie persistentă și un dicționar român integrat cu sute de definiții.\n\nTotul funcționează local, fără cloud.`,
    `Sunt **Axon**, asistentul tău AI personal${name}. Nu am nevoie de internet sau servicii externe — tot ce știu este stocat local pe dispozitivul tău.`,
  ]);
}

function handleUserIntroduction(text: string, state: BrainState): string | null {
  const nameMatch = text.match(/(?:ma numesc|imi zice|cheama-ma|numele meu este|eu sunt|eu ma numesc)\s+([^\s,\.!?]{2,25})/i);
  if (!nameMatch) return null;
  const candidate = nameMatch[1].trim();
  const excluded = ['bine', 'ok', 'axon', 'robot', 'ai', 'gata', 'un', 'si', 'sau'];
  if (excluded.includes(candidate.toLowerCase())) return null;

  state.userName = candidate.charAt(0).toUpperCase() + candidate.slice(1).toLowerCase();
  state.memory['__name__'] = state.userName;
  return `Mă bucur să te cunosc, **${state.userName}**! 👋\n\nÎți voi reține numele în această sesiune. Cum te pot ajuta?`;
}

function handleMemory(intent: Intent, text: string, state: BrainState): string | null {
  if (intent === 'memorie_salveaza') {
    const m = text.match(/(?:retine|memorizeaza|noteaza|tine minte|salveaza|aminteste-ti|nu uita)\s+(?:ca\s+|faptul ca\s+)?(.+)/i);
    if (!m) return 'Ce anume să rețin? Spune-mi "Reține că [informație]".';
    const info = m[1].trim();
    state.memory[`mem_${Date.now()}`] = info;
    return `Am reținut: **"${info}"** ✅\n\nPot să îți reamintesc oricând!`;
  }

  if (intent === 'memorie_citeste') {
    const mems = Object.entries(state.memory)
      .filter(([k]) => k.startsWith('mem_'))
      .map(([, v]) => v);
    if (mems.length === 0) {
      return `Nu am reținut nimic specific${state.userName ? `, ${state.userName}` : ''}.\n\nSpune-mi "Reține că..." și voi memora!`;
    }
    return `**Ce am reținut:**\n\n${mems.map((m, i) => `${i + 1}. ${m}`).join('\n')}`;
  }

  if (intent === 'memorie_sterge') {
    const count = Object.keys(state.memory).filter(k => k.startsWith('mem_')).length;
    Object.keys(state.memory).filter(k => k.startsWith('mem_')).forEach(k => delete state.memory[k]);
    return `Am șters ${count} notițe salvate. Memoria documentelor și numele rămân.`;
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
  const s = now.getSeconds().toString().padStart(2, '0');
  return `🕐 **${h}:${m}:${s}**\n📅 ${ZILE[now.getDay()]}, ${now.getDate()} ${LUNI[now.getMonth()]} ${now.getFullYear()}`;
}

function handleMath(text: string): string | null {
  const n = norm(text);

  // Limbaj natural
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

  // Expresie directa
  const expr = text.replace(/[xX×]/g, '*').replace(/÷/g, '/').replace(/\^/g, '**').replace(/,/g, '.').trim();
  if (/^[\d\s\+\-\*\/\(\)\.\^%\*]+$/.test(expr) && /\d/.test(expr) && /[\+\-\*\/]/.test(expr)) {
    try {
      const result = Function('"use strict"; return (' + expr + ')')();
      if (typeof result === 'number' && isFinite(result)) {
        return `= **${Math.round(result * 1e9) / 1e9}**`;
      }
    } catch {}
  }

  return null;
}

// ─── Raspunsuri statice ───────────────────────────────────────────────────────

const RESPONSES: Record<string, string[]> = {
  salut: [
    'Salut! Sunt Axon, gata să te ajut. Ce facem?',
    'Bună! Axon la dispoziție. Ce pot face pentru tine?',
    'Hei! Spune-mi ce ai nevoie!',
    'Salutare! Cu ce te pot ajuta astăzi?',
  ],
  ramas_bun: [
    'La revedere! A fost o plăcere. Revin oricând!',
    'Pa! Conversația a fost salvată. Îți amintesc totul data viitoare.',
    'O zi bună! Sunt aici dacă mai ai nevoie.',
  ],
  stare_buna: [
    'Super! Mă bucur să aud. Ce facem astăzi?',
    'Minunat! Cu chef bun totul merge mai ușor. Spune-mi!',
    'Grozav! Energia bună e contagioasă. Cu ce te ajut?',
  ],
  stare_rea: [
    'Îmi pare rău. Vrei să povestești ce s-a întâmplat?',
    'Înțeleg. Sunt aici, fără grăbire. Spune-mi.',
    'Sper că trece repede. Pot face ceva concret pentru tine?',
  ],
  multumesc: [
    'Cu plăcere! Asta e treaba mea.', 'Oricând! Nu ezita să mă întrebi.',
    'Mă bucur că am putut ajuta! Altceva?', 'E un onoare! Continuăm?',
  ],
  ajutor: [
    'Iată ce pot face:\n\n🧠 **Dicționar român** — "Ce este fotosinteza?"\n📄 **Studiez fișiere** — apasă 📎 și trimite documente\n🧮 **Calcule** — "45 × 32" sau "radical din 144"\n📅 **Dată/Oră** — "Ce oră e?"\n💾 **Memorez** — "Reține că am întâlnire luni"\n💬 **Conversez** — orice subiect\n\nCe vrei să faci?',
  ],
  ce_poti: [
    'Capabilitățile mele:\n\n📖 **Dicționar integrat** — sute de definiții în română\n📄 **Învăț din documente** — trimiți fișiere, eu le studiez\n🧠 **Memorie persistentă** — nu uit între sesiuni\n🧮 **Matematică** — calcule simple și complexe\n📅 **Dată și oră** — exact, offline\n💡 **Sfaturi și motivație**\n😄 **Glume**\n\nTotul funcționează 100% offline!',
  ],
  da: ['Perfect, continuăm!', 'Bine! Spune-mi mai mult.', 'Înțeles!', 'Super!'],
  nu: ['Nicio problemă. Altceva?', 'Bine, cum altfel te pot ajuta?', 'Înțeleg.'],
  gluma: [
    'De ce nu pot programatorii să meargă afară?\nPentru că nu știu să facă **escape**! 😄',
    'Ce i-a spus 0 lui 8?\n**Centură frumoasă!** 😂',
    'Câți programatori schimbă un bec?\n**Niciunul** — e problemă de hardware! 💡',
    'De ce a traversat puiul strada?\nPentru că **JSON** era pe partea cealaltă! 🐔',
    'Ce face un informatician când îi e frig?\n**Stă lângă Windows!** 🪟',
    'Cum se numește un urs polar fără dinți?\n**Gummy bear!** 🐻',
  ],
  motivatie: [
    '"Succesul nu e cheia fericirii. Fericirea e cheia succesului." — Schweitzer',
    '"Nu contează cât de încet mergi, atâta timp cât nu te oprești." — Confucius',
    '"Cel mai bun moment să plantezi un copac a fost acum 20 de ani. Al doilea cel mai bun moment e acum." — proverb chinez',
    '"Fiecare expert a fost cândva un începător." — Helen Hayes',
    '"Nu visele îți realizează viața. Tu îți realizezi visele." — Mark Twain',
    '"Succesul este suma eforturilor mici, repetate zi după zi." — R. Collier',
  ],
  sfat: [
    'Sfatul meu: împarte problema în pași mici. Primul pas e cel mai important.',
    'Concentrează-te pe ce poți controla. Restul lasă-l să curgă.',
    'Consistența bate intensitatea. Puțin în fiecare zi face diferența mare.',
    'Nu compara progresul tău cu al altora. Compară-te cu tine de ieri.',
    'Odihna face parte din productivitate — nu e opusul ei.',
  ],
};

// ─── Motor principal ──────────────────────────────────────────────────────────

export function processMessage(text: string, state: BrainState): string {
  state.conversationCount++;
  const trimmed = text.trim();
  if (!trimmed) return 'Aștept mesajul tău...';

  const name = state.userName ? `, ${state.userName}` : '';
  const intent = detectIntent(trimmed);

  // 1. Identitate Axon — raspuns direct, fara ambiguitate
  if (intent === 'identitate_axon') return handleIdentityAxon(state);

  // 2. Introducere utilizator
  if (intent === 'introducere_utilizator') {
    const r = handleUserIntroduction(trimmed, state);
    if (r) return r;
  }

  // 3. Data / Ora
  if (intent === 'data_ora') return handleDateTime();

  // 4. Matematica
  if (intent === 'matematica') {
    const r = handleMath(trimmed);
    if (r) return r;
  }

  // 5. Matematica detectata si fara intentie explicita (ex: "45+32")
  const mathResult = handleMath(trimmed);
  if (mathResult) return mathResult;

  // 6. Memorie
  if (intent === 'memorie_salveaza' || intent === 'memorie_citeste' || intent === 'memorie_sterge') {
    const r = handleMemory(intent, trimmed, state);
    if (r) return r;
  }

  // 7. Documente — lista
  if (intent === 'documente_lista') {
    if (state.learnedDocuments.length === 0) {
      return `Nu am niciun document${name}. Apasă 📎 pentru a-mi trimite un fișier text!`;
    }
    const list = state.learnedDocuments.map((d, i) => `${i + 1}. **${d.name}** (${d.wordCount} cuvinte)`).join('\n');
    return `**Documente studiate:**\n\n${list}\n\nÎntreabă-mă orice despre ele!`;
  }

  // 8. Definitie din dictionar (intent explicit)
  if (intent === 'definitie') {
    const r = searchDictionary(trimmed);
    if (r) return r;
    return `Nu am definiția exactă a ceea ce ai cerut${name}. Încearcă să reformulezi sau trimite-mi un document pe acel subiect!`;
  }

  // 9. Raspunsuri statice pentru intenti simple
  if (intent !== 'unknown' && RESPONSES[intent]) {
    let resp = pick(RESPONSES[intent]);
    if (intent === 'salut' && state.userName) resp = resp.replace('!', `${name}!`);
    state.lastTopics = [intent, ...state.lastTopics.slice(0, 4)];
    return resp;
  }

  // 10. Cautare in documente incarcate
  const docResult = searchDocuments(trimmed, state.learnedDocuments);
  if (docResult) return docResult;

  // 11. Cautare in dictionar (fara intentie explicita)
  const dictResult = searchDictionary(trimmed);
  if (dictResult) return dictResult;

  // 12. Raspuns contextual
  return generateContextualResponse(trimmed, state, name);
}

function generateContextualResponse(text: string, state: BrainState, name: string): string {
  const n = norm(text);
  const hasDocs = state.learnedDocuments.length > 0;

  if (/^de ce\s/.test(n)) {
    return pick([
      `Bună întrebare${name}! Aceasta depinde de context. Poți detalia mai mult?`,
      `Există mai multe explicații posibile. Ce aspect te interesează cel mai mult?`,
    ]);
  }

  if (/^cum\s(se|poti|pot|fac|faci|functioneaza|merge|ajung|obtin)/.test(n)) {
    return pick([
      `Procesul implică mai mulți pași${name}. Poți fi mai specific?`,
      `Depinde de situație. Spune-mi mai multe detalii!`,
    ]);
  }

  if (/\?/.test(text) || /^(ce|cine|unde|cand|cat|care)\s/.test(n)) {
    if (hasDocs) {
      return pick([
        `Nu am găsit informații exacte în documentele mele${name}. Reformulează!`,
        `Hmm, nu am date specifice. Dacă îmi trimiți un document pe tema asta, voi putea ajuta!`,
      ]);
    }
    return pick([
      `Interesantă întrebare${name}! Nu am date specifice, dar dacă îmi trimiți un fișier pe acel subiect, voi putea răspunde precis.`,
      `Baza mea de cunoștințe offline nu acoperă asta exact${name}. Trimite-mi un document și voi învăța!`,
    ]);
  }

  return pick([
    `Înțeleg ce spui${name}. Poți elabora mai mult?`,
    `Interesant${name}! Spune-mi mai mult.`,
    `Notez asta${name}. Continuă, te ascult!`,
    `Am procesat mesajul${name}. Ce urmează?`,
  ]);
}

// ─── Procesare document ───────────────────────────────────────────────────────

export function processDocument(name: string, content: string, state: BrainState): string {
  const words = content.trim().split(/\s+/).length;
  const id = `doc_${Date.now()}`;

  const doc: LearnedDocument = { id, name, content: content.trim(), addedAt: new Date(), wordCount: words };

  const existingIdx = state.learnedDocuments.findIndex(d => d.name === name);
  if (existingIdx >= 0) {
    state.learnedDocuments[existingIdx] = doc;
    return `Am actualizat documentul **"${name}"** (${words.toLocaleString()} cuvinte). Acum știu conținutul nou!`;
  }

  state.learnedDocuments.push(doc);
  const preview = content.split('\n').find(l => l.trim().length > 10)?.slice(0, 120) || '';
  return `📚 Am studiat **"${name}"** (${words.toLocaleString()} cuvinte)!\n\n${preview ? `*"${preview}${preview.length >= 120 ? '...' : ''}"*\n\n` : ''}Acum pot răspunde la întrebări despre conținut. Încearcă!`;
}
