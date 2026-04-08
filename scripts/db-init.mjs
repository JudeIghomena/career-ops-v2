#!/usr/bin/env node
/**
 * career-ops: SQLite database initialiser
 *
 * Creates (or migrates) data/pipeline.db with the canonical schema.
 * Safe to re-run — uses CREATE TABLE IF NOT EXISTS throughout.
 *
 * Usage:
 *   node scripts/db-init.mjs
 *   npm run db:init
 */

import Database from 'better-sqlite3';
import { mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = join(ROOT, 'data');
const DB_PATH = join(DATA_DIR, 'pipeline.db');

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(DB_PATH);

// Enable WAL mode for concurrent read safety
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  -- ───────────────────────────────────────────────
  -- Core application tracker
  -- ───────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS applications (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    num           TEXT    NOT NULL UNIQUE,          -- zero-padded seq, e.g. "007"
    date          TEXT    NOT NULL,                  -- YYYY-MM-DD
    company       TEXT    NOT NULL,
    role          TEXT    NOT NULL,
    score         REAL,                              -- 1.0 – 5.0 numeric
    score_raw     TEXT,                              -- original string e.g. "4.2/5"
    status        TEXT    NOT NULL DEFAULT 'Evaluated',
    has_pdf       INTEGER NOT NULL DEFAULT 0,        -- boolean
    report_path   TEXT,                             -- relative path to .md report
    report_json   TEXT,                             -- relative path to .json report
    job_url       TEXT,
    cv_version    TEXT,                              -- git SHA of cv.md at time of eval
    followup_date TEXT,                              -- YYYY-MM-DD or NULL
    archetype     TEXT,
    notes         TEXT,
    created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
    updated_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
  );

  -- Auto-update updated_at on every write
  CREATE TRIGGER IF NOT EXISTS applications_updated_at
    AFTER UPDATE ON applications
    FOR EACH ROW
    BEGIN
      UPDATE applications SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now')
      WHERE id = OLD.id;
    END;

  -- ───────────────────────────────────────────────
  -- Scan history (replaces scan-history.tsv)
  -- ───────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS scan_history (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    url        TEXT    NOT NULL UNIQUE,
    first_seen TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
    last_seen  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
    portal     TEXT,
    title      TEXT,
    company    TEXT,
    status     TEXT    NOT NULL DEFAULT 'added'
    -- status values: added | skipped_title | skipped_dup | skipped_expired | pending
  );

  -- ───────────────────────────────────────────────
  -- Story bank (replaces interview-prep/story-bank.md)
  -- ───────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS story_bank (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    competency   TEXT    NOT NULL,    -- e.g. "System Design", "HITL", "Delivery Speed"
    archetype    TEXT,                -- archetype this story is strongest for
    situation    TEXT    NOT NULL,
    task         TEXT    NOT NULL,
    action       TEXT    NOT NULL,
    result       TEXT    NOT NULL,
    reflection   TEXT,               -- What you learned / what you'd do differently
    source_eval  TEXT,               -- report num where this story was first generated
    created_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
  );

  -- ───────────────────────────────────────────────
  -- Batch processing state (replaces batch-state.tsv)
  -- ───────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS batch_jobs (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id     TEXT    NOT NULL,    -- run identifier, e.g. "2026-04-08T10:00:00Z"
    url          TEXT    NOT NULL,
    status       TEXT    NOT NULL DEFAULT 'pending',
    -- status: pending | processing | completed | failed | skipped
    started_at   TEXT,
    completed_at TEXT,
    report_num   TEXT,
    score        REAL,
    error_msg    TEXT,
    retries      INTEGER NOT NULL DEFAULT 0
  );

  -- ───────────────────────────────────────────────
  -- Indexes for common query patterns
  -- ───────────────────────────────────────────────
  CREATE INDEX IF NOT EXISTS idx_apps_status   ON applications(status);
  CREATE INDEX IF NOT EXISTS idx_apps_score    ON applications(score);
  CREATE INDEX IF NOT EXISTS idx_apps_company  ON applications(company);
  CREATE INDEX IF NOT EXISTS idx_scan_url      ON scan_history(url);
  CREATE INDEX IF NOT EXISTS idx_scan_company  ON scan_history(company);
  CREATE INDEX IF NOT EXISTS idx_stories_comp  ON story_bank(competency);
  CREATE INDEX IF NOT EXISTS idx_batch_status  ON batch_jobs(status);
`);

console.log(`✅ career-ops database ready: ${DB_PATH}`);
console.log(`   Tables: applications, scan_history, story_bank, batch_jobs`);
db.close();
