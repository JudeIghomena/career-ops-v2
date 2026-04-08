#!/usr/bin/env node
/**
 * career-ops: Migrate existing flat-file data into SQLite
 *
 * Migrates:
 *   data/applications.md  → applications table
 *   data/scan-history.tsv → scan_history table
 *
 * Safe to re-run — skips rows that already exist (by num / url).
 *
 * Usage:
 *   node scripts/db-migrate.mjs [--dry-run]
 *   npm run db:migrate
 */

import Database from 'better-sqlite3';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT     = join(dirname(fileURLToPath(import.meta.url)), '..');
const DB_PATH  = join(ROOT, 'data', 'pipeline.db');
const DRY_RUN  = process.argv.includes('--dry-run');

if (!existsSync(DB_PATH)) {
  console.error('❌ Database not initialised. Run: npm run db:init');
  process.exit(1);
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

const log = (...args) => console.log(...args);

/** Parse a score string like "4.2/5" or "4.2" → 4.2 (float) or null */
function parseScore(raw) {
  if (!raw) return null;
  const m = raw.match(/(\d+\.?\d*)/);
  return m ? parseFloat(m[1]) : null;
}

/** Normalise status to canonical English form */
function normalizeStatus(raw) {
  if (!raw) return 'Evaluated';
  const s = raw.replace(/\*\*/g, '').trim().toLowerCase();
  if (s.includes('interview') || s.includes('entrevista')) return 'Interview';
  if (s === 'offer'          || s.includes('oferta'))      return 'Offer';
  if (s.includes('applied')  || s.includes('aplicado'))   return 'Applied';
  if (s.includes('responded')|| s.includes('respondido')) return 'Responded';
  if (s.includes('rejected') || s.includes('rechazado'))  return 'Rejected';
  if (s.includes('discarded')|| s.includes('descartado')) return 'Discarded';
  if (s.includes('skip')     || s.includes('no aplicar')) return 'SKIP';
  if (s.includes('evaluated')|| s.includes('evaluada'))   return 'Evaluated';
  return raw.trim(); // preserve unknown statuses verbatim
}

// ──────────────────────────────────────────────────────────────────────────────
// Migrate applications.md
// ──────────────────────────────────────────────────────────────────────────────

const APPS_PATH = join(ROOT, 'data', 'applications.md');
let appsInserted = 0, appsSkipped = 0;

if (existsSync(APPS_PATH)) {
  log('\n📋 Migrating data/applications.md …');

  const insertApp = db.prepare(`
    INSERT OR IGNORE INTO applications
      (num, date, company, role, score, score_raw, status, has_pdf, report_path, notes)
    VALUES
      (@num, @date, @company, @role, @score, @score_raw, @status, @has_pdf, @report_path, @notes)
  `);

  const lines = readFileSync(APPS_PATH, 'utf8').split('\n');
  const migrateAll = db.transaction(() => {
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('|')) continue;
      if (trimmed.startsWith('| #') || trimmed.startsWith('|---')) continue;

      // Split by pipe
      const cells = trimmed.split('|').map(c => c.trim()).filter(Boolean);
      if (cells.length < 7) continue;

      // Column order from applications.md:
      // # | Date | Company | Role | Score | Status | PDF | Report | Notes
      const [num, date, company, role, scoreRaw, statusRaw, pdfRaw, reportRaw, notes] = cells;

      // Extract report path from markdown link [001](reports/001-…)
      const reportMatch = reportRaw?.match(/\[.*?\]\(([^)]+)\)/);
      const reportPath  = reportMatch ? reportMatch[1] : null;

      const row = {
        num:         num?.padStart(3, '0') ?? '000',
        date:        date ?? '',
        company:     company ?? '',
        role:        role ?? '',
        score:       parseScore(scoreRaw),
        score_raw:   scoreRaw ?? null,
        status:      normalizeStatus(statusRaw),
        has_pdf:     (pdfRaw ?? '').includes('✅') ? 1 : 0,
        report_path: reportPath,
        notes:       notes ?? null,
      };

      if (DRY_RUN) {
        log(`  [DRY] Would insert: #${row.num} ${row.company} — ${row.role} (${row.status})`);
        appsInserted++;
      } else {
        const info = insertApp.run(row);
        if (info.changes > 0) {
          log(`  ✅ #${row.num} ${row.company} — ${row.role}`);
          appsInserted++;
        } else {
          appsSkipped++;
        }
      }
    }
  });

  migrateAll();
  log(`   Inserted: ${appsInserted}  |  Skipped (already exist): ${appsSkipped}`);
} else {
  log('ℹ️  data/applications.md not found — skipping applications migration');
}

// ──────────────────────────────────────────────────────────────────────────────
// Migrate scan-history.tsv
// ──────────────────────────────────────────────────────────────────────────────

const SCAN_PATH = join(ROOT, 'data', 'scan-history.tsv');
let scanInserted = 0, scanSkipped = 0;

if (existsSync(SCAN_PATH)) {
  log('\n🔍 Migrating data/scan-history.tsv …');

  const insertScan = db.prepare(`
    INSERT OR IGNORE INTO scan_history (url, first_seen, portal, title, company, status)
    VALUES (@url, @first_seen, @portal, @title, @company, @status)
  `);

  const lines = readFileSync(SCAN_PATH, 'utf8').split('\n');
  const migrateScans = db.transaction(() => {
    for (const line of lines) {
      if (!line.trim() || line.startsWith('url\t')) continue;
      const [url, first_seen, portal, title, company, status] = line.split('\t');
      if (!url?.startsWith('http')) continue;

      const row = { url, first_seen: first_seen ?? '', portal: portal ?? '', title: title ?? '', company: company ?? '', status: status?.trim() ?? 'added' };

      if (DRY_RUN) {
        log(`  [DRY] Would insert scan: ${url.slice(0, 60)}…`);
        scanInserted++;
      } else {
        const info = insertScan.run(row);
        if (info.changes > 0) scanInserted++; else scanSkipped++;
      }
    }
  });

  migrateScans();
  log(`   Inserted: ${scanInserted}  |  Skipped (already exist): ${scanSkipped}`);
} else {
  log('ℹ️  data/scan-history.tsv not found — skipping scan history migration');
}

// ──────────────────────────────────────────────────────────────────────────────
// Summary
// ──────────────────────────────────────────────────────────────────────────────

log('\n🎉 Migration complete');
if (DRY_RUN) log('   (dry-run — no data was written)');

const totals = DRY_RUN ? {} : {
  applications: db.prepare('SELECT COUNT(*) as n FROM applications').get().n,
  scan_history: db.prepare('SELECT COUNT(*) as n FROM scan_history').get().n,
};
if (!DRY_RUN) {
  log(`   applications: ${totals.applications} rows`);
  log(`   scan_history:  ${totals.scan_history} rows`);
}

db.close();
