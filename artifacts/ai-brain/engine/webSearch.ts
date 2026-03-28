
// Axon — Motor de căutare online
// Surse: Wikipedia RO, Wikipedia EN, DuckDuckGo Instant Answers
// Fără API key — surse publice gratuite

export interface OnlineResult {
  found: boolean;
  text: string;
  source: string;
  query: string;
}

const TIMEOUT_MS = 8000;

// ─── Timeout fetch helper ───────────────────────────────────────────────────
async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json', 'User-Agent': 'Axon-AI/1.1' },
    });
    return resp;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Wikipedia RO ───────────────────────────────────────────────────────────
async function searchWikipediaRO(query: string): Promise<OnlineResult | null> {
  try {
    // Pasul 1: caută titlul articolului
    const searchUrl = `https://ro.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=3&format=json&origin=*`;
    const searchResp = await fetchWithTimeout(searchUrl);
    if (!searchResp.ok) return null;

    const searchData: any[] = await searchResp.json();
    const titles: string[] = searchData[1] || [];
    if (titles.length === 0) return null;

    // Pasul 2: ia rezumatul primului articol găsit
    const title = encodeURIComponent(titles[0]);
    const summaryUrl = `https://ro.wikipedia.org/api/rest_v1/page/summary/${title}`;
    const summaryResp = await fetchWithTimeout(summaryUrl);
    if (!summaryResp.ok) return null;

    const summary = await summaryResp.json();
    const extract: string = summary.extract || '';
    if (!extract || extract.length < 30) return null;

    // Trunchiem la ~500 caractere pentru lizibilitate
    const text = extract.length > 500
      ? extract.slice(0, 497) + '...'
      : extract;

    return {
      found: true,
      text,
      source: `Wikipedia RO — "${titles[0]}"`,
      query,
    };
  } catch {
    return null;
  }
}

// ─── Wikipedia EN (fallback dacă nu există pe RO) ──────────────────────────
async function searchWikipediaEN(query: string): Promise<OnlineResult | null> {
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=3&format=json&origin=*`;
    const searchResp = await fetchWithTimeout(searchUrl);
    if (!searchResp.ok) return null;

    const searchData: any[] = await searchResp.json();
    const titles: string[] = searchData[1] || [];
    if (titles.length === 0) return null;

    const title = encodeURIComponent(titles[0]);
    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${title}`;
    const summaryResp = await fetchWithTimeout(summaryUrl);
    if (!summaryResp.ok) return null;

    const summary = await summaryResp.json();
    const extract: string = summary.extract || '';
    if (!extract || extract.length < 30) return null;

    const text = extract.length > 500
      ? extract.slice(0, 497) + '...'
      : extract;

    return {
      found: true,
      text: `[Sursă în engleză — tradus automat]\n\n${text}`,
      source: `Wikipedia EN — "${titles[0]}"`,
      query,
    };
  } catch {
    return null;
  }
}

// ─── DuckDuckGo Instant Answers ─────────────────────────────────────────────
async function searchDuckDuckGo(query: string): Promise<OnlineResult | null> {
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1&no_html=1&skip_disambig=1`;
    const resp = await fetchWithTimeout(url);
    if (!resp.ok) return null;

    const data = await resp.json();

    // AbstractText — cel mai relevant
    if (data.AbstractText && data.AbstractText.length > 30) {
      const text = data.AbstractText.length > 400
        ? data.AbstractText.slice(0, 397) + '...'
        : data.AbstractText;
      return {
        found: true,
        text,
        source: `DuckDuckGo${data.AbstractSource ? ' — ' + data.AbstractSource : ''}`,
        query,
      };
    }

    // Answer — răspuns direct (de ex. "Ce înseamnă X")
    if (data.Answer && data.Answer.length > 5) {
      return {
        found: true,
        text: data.Answer,
        source: 'DuckDuckGo — Răspuns instant',
        query,
      };
    }

    // Related topics — primul element dacă nimic altceva nu a mers
    const related: any[] = data.RelatedTopics || [];
    const first = related.find(r => r.Text && r.Text.length > 30);
    if (first) {
      return {
        found: true,
        text: first.Text.slice(0, 400),
        source: 'DuckDuckGo — Sugestii corelate',
        query,
      };
    }

    return null;
  } catch {
    return null;
  }
}

// ─── Detectare intenție de căutare online ───────────────────────────────────
const ONLINE_TRIGGERS = [
  'caută online', 'cauta online', 'cauta pe internet', 'caută pe internet',
  'cauta pe net', 'caută pe net', 'găsește online', 'gaseste online',
  'ce zice internetul', 'ce stie internetul', 'ce știe internetul',
  'cauta informatii', 'caută informații', 'cauta informatii',
  'cauta pe google', 'caută pe google', 'intreaba internetul',
  'întreabă internetul', 'cauta acum', 'caută acum',
];

export function isOnlineIntent(text: string): boolean {
  const lower = text.toLowerCase();
  return ONLINE_TRIGGERS.some(t => lower.includes(t));
}

// Extrage interogarea curată pentru căutare (elimină trigger words)
export function extractSearchQuery(text: string): string {
  let query = text;
  const lower = text.toLowerCase();

  for (const trigger of ONLINE_TRIGGERS) {
    if (lower.includes(trigger)) {
      const idx = lower.indexOf(trigger);
      query = text.slice(idx + trigger.length).trim();
      break;
    }
  }

  // Elimină punctuație finală
  query = query.replace(/[?!.,;:]+$/, '').trim();

  // Dacă e prea scurt, folosim textul original
  return query.length > 2 ? query : text;
}

// ─── Funcția principală de căutare ──────────────────────────────────────────
export async function searchOnline(query: string): Promise<OnlineResult> {
  const cleanQuery = extractSearchQuery(query);

  // Încearcă Wikipedia RO primul
  const roResult = await searchWikipediaRO(cleanQuery);
  if (roResult) return roResult;

  // Fallback: Wikipedia EN
  const enResult = await searchWikipediaEN(cleanQuery);
  if (enResult) return enResult;

  // Fallback final: DuckDuckGo
  const ddgResult = await searchDuckDuckGo(cleanQuery);
  if (ddgResult) return ddgResult;

  return {
    found: false,
    text: 'Nu am găsit informații online despre asta. Încearcă să reformulezi întrebarea sau verifică conexiunea la internet.',
    source: '',
    query: cleanQuery,
  };
}
