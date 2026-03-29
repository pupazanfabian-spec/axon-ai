
// Axon — Bază de date locală SQLite
// Gestionează: knowledge_entries, web_cache, dynamic_concepts, learned_facts
// expo-sqlite v15 (async API)

import * as SQLite from 'expo-sqlite';

let _db: SQLite.SQLiteDatabase | null = null;

// ─── Deschide / Inițializează DB ─────────────────────────────────────────────

export async function getDB(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync('axon_v3.db');
  await initSchema(_db);
  return _db;
}

async function initSchema(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS knowledge_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      label TEXT,
      source TEXT DEFAULT 'user',
      domain TEXT DEFAULT 'general',
      importance REAL DEFAULT 0.5,
      access_count INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      last_accessed INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_ke_domain ON knowledge_entries(domain);
    CREATE INDEX IF NOT EXISTS idx_ke_importance ON knowledge_entries(importance);
    CREATE INDEX IF NOT EXISTS idx_ke_last_accessed ON knowledge_entries(last_accessed);

    CREATE TABLE IF NOT EXISTS web_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      query_hash TEXT NOT NULL UNIQUE,
      query_text TEXT NOT NULL,
      result_json TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      ttl_hours INTEGER DEFAULT 48
    );

    CREATE INDEX IF NOT EXISTS idx_wc_hash ON web_cache(query_hash);

    CREATE TABLE IF NOT EXISTS dynamic_concepts (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      domain TEXT DEFAULT 'general',
      description TEXT NOT NULL,
      related_json TEXT DEFAULT '[]',
      facts_json TEXT DEFAULT '[]',
      axon_opinion TEXT,
      created_at INTEGER NOT NULL,
      source TEXT DEFAULT 'user'
    );

    CREATE TABLE IF NOT EXISTS learned_facts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      confidence REAL DEFAULT 0.7,
      source TEXT DEFAULT 'user',
      category TEXT DEFAULT 'general',
      created_at INTEGER NOT NULL
    );
  `);
}

// ─── Knowledge Entries ────────────────────────────────────────────────────────

export interface KnowledgeEntry {
  id?: number;
  content: string;
  label?: string;
  source?: string;
  domain?: string;
  importance?: number;
  access_count?: number;
  created_at?: number;
  last_accessed?: number;
}

export async function insertKnowledgeEntry(entry: KnowledgeEntry): Promise<number> {
  const db = await getDB();
  const now = Date.now();
  const result = await db.runAsync(
    `INSERT OR IGNORE INTO knowledge_entries
      (content, label, source, domain, importance, access_count, created_at, last_accessed)
     VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
    [
      entry.content,
      entry.label ?? null,
      entry.source ?? 'user',
      entry.domain ?? 'general',
      entry.importance ?? 0.5,
      now,
      now,
    ]
  );
  return result.lastInsertRowId;
}

export async function searchKnowledgeEntries(
  query: string,
  limit = 5,
): Promise<KnowledgeEntry[]> {
  const db = await getDB();
  const q = `%${query.toLowerCase()}%`;
  const rows = await db.getAllAsync<KnowledgeEntry>(
    `SELECT * FROM knowledge_entries
     WHERE lower(content) LIKE ? OR lower(label) LIKE ?
     ORDER BY importance DESC, access_count DESC
     LIMIT ?`,
    [q, q, limit]
  );
  return rows;
}

export async function bumpKnowledgeAccess(id: number): Promise<void> {
  const db = await getDB();
  const now = Date.now();
  await db.runAsync(
    `UPDATE knowledge_entries SET
       access_count = access_count + 1,
       last_accessed = ?,
       importance = MIN(1.0, importance + 0.05)
     WHERE id = ?`,
    [now, id]
  );
}

export async function getAllKnowledgeEntries(domain?: string): Promise<KnowledgeEntry[]> {
  const db = await getDB();
  if (domain) {
    return db.getAllAsync<KnowledgeEntry>(
      'SELECT * FROM knowledge_entries WHERE domain = ? ORDER BY importance DESC',
      [domain]
    );
  }
  return db.getAllAsync<KnowledgeEntry>(
    'SELECT * FROM knowledge_entries ORDER BY importance DESC'
  );
}

// ─── Web Cache ────────────────────────────────────────────────────────────────

function hashQuery(query: string): string {
  let hash = 0;
  for (let i = 0; i < query.length; i++) {
    const chr = query.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export async function getCachedWebResult(query: string): Promise<any | null> {
  const db = await getDB();
  const qHash = hashQuery(query.toLowerCase().trim());
  const now = Date.now();
  const row = await db.getFirstAsync<{ result_json: string; created_at: number; ttl_hours: number }>(
    'SELECT result_json, created_at, ttl_hours FROM web_cache WHERE query_hash = ?',
    [qHash]
  );
  if (!row) return null;

  const expiresAt = row.created_at + row.ttl_hours * 3600 * 1000;
  if (now > expiresAt) {
    await db.runAsync('DELETE FROM web_cache WHERE query_hash = ?', [qHash]);
    return null;
  }

  try {
    return JSON.parse(row.result_json);
  } catch {
    return null;
  }
}

export async function setCachedWebResult(
  query: string,
  result: any,
  ttlHours = 48,
): Promise<void> {
  const db = await getDB();
  const qHash = hashQuery(query.toLowerCase().trim());
  const now = Date.now();
  await db.runAsync(
    `INSERT OR REPLACE INTO web_cache
       (query_hash, query_text, result_json, created_at, ttl_hours)
     VALUES (?, ?, ?, ?, ?)`,
    [qHash, query, JSON.stringify(result), now, ttlHours]
  );
}

// ─── Dynamic Concepts ─────────────────────────────────────────────────────────

export interface DBDynamicConcept {
  id: string;
  label: string;
  domain: string;
  description: string;
  related_json: string;
  facts_json: string;
  axon_opinion?: string | null;
  created_at: number;
  source: string;
}

export async function saveDynamicConcept(concept: {
  id: string;
  label: string;
  domain: string;
  description: string;
  related: string[];
  facts: string[];
  axonOpinion?: string;
  source?: string;
}): Promise<void> {
  const db = await getDB();
  const now = Date.now();
  await db.runAsync(
    `INSERT OR IGNORE INTO dynamic_concepts
       (id, label, domain, description, related_json, facts_json, axon_opinion, created_at, source)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      concept.id,
      concept.label,
      concept.domain,
      concept.description,
      JSON.stringify(concept.related),
      JSON.stringify(concept.facts),
      concept.axonOpinion ?? null,
      now,
      concept.source ?? 'user',
    ]
  );
}

export async function loadAllDynamicConcepts(): Promise<DBDynamicConcept[]> {
  const db = await getDB();
  return db.getAllAsync<DBDynamicConcept>(
    'SELECT * FROM dynamic_concepts ORDER BY created_at DESC'
  );
}

// ─── Learned Facts ────────────────────────────────────────────────────────────

export async function insertLearnedFact(
  content: string,
  confidence = 0.7,
  source = 'user',
  category = 'general',
): Promise<void> {
  const db = await getDB();
  const now = Date.now();
  await db.runAsync(
    `INSERT INTO learned_facts (content, confidence, source, category, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [content, confidence, source, category, now]
  );
}

export async function getRecentLearnedFacts(limit = 50): Promise<{ content: string; confidence: number; source: string; category: string }[]> {
  const db = await getDB();
  return db.getAllAsync(
    'SELECT content, confidence, source, category FROM learned_facts ORDER BY created_at DESC LIMIT ?',
    [limit]
  );
}

// ─── Auto-Pruning ──────────────────────────────────────────────────────────────

export async function autoPruneKnowledge(): Promise<number> {
  const db = await getDB();
  const cutoff = Date.now() - 60 * 24 * 3600 * 1000; // 60 zile
  const result = await db.runAsync(
    `DELETE FROM knowledge_entries
     WHERE importance < 0.2
       AND last_accessed < ?
       AND access_count < 3`,
    [cutoff]
  );

  // Curăță și cache-ul expirat
  const now = Date.now();
  await db.runAsync(
    `DELETE FROM web_cache
     WHERE (created_at + ttl_hours * 3600000) < ?`,
    [now]
  );

  return result.changes;
}

// ─── Statistici ───────────────────────────────────────────────────────────────

export async function getDBStats(): Promise<{
  knowledgeCount: number;
  cacheCount: number;
  conceptsCount: number;
  factsCount: number;
}> {
  const db = await getDB();
  const [k, c, dc, lf] = await Promise.all([
    db.getFirstAsync<{ cnt: number }>('SELECT COUNT(*) as cnt FROM knowledge_entries'),
    db.getFirstAsync<{ cnt: number }>('SELECT COUNT(*) as cnt FROM web_cache'),
    db.getFirstAsync<{ cnt: number }>('SELECT COUNT(*) as cnt FROM dynamic_concepts'),
    db.getFirstAsync<{ cnt: number }>('SELECT COUNT(*) as cnt FROM learned_facts'),
  ]);
  return {
    knowledgeCount: k?.cnt ?? 0,
    cacheCount: c?.cnt ?? 0,
    conceptsCount: dc?.cnt ?? 0,
    factsCount: lf?.cnt ?? 0,
  };
}
