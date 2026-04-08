#!/usr/bin/env node
/**
 * career-ops: Batch Orchestrator
 *
 * Replaces batch/batch-runner.sh — a Node.js orchestrator that:
 *   1. Reads pending URLs from batch/batch-input.tsv
 *   2. Tracks progress atomically in data/pipeline.db (or batch-state.tsv fallback)
 *   3. Manages concurrency safely — no TSV race conditions
 *   4. Supports resumability, dry-run, retry-failed, and parallel N workers
 *
 * Usage:
 *   node scripts/batch-orchestrator.mjs [options]
 *   npm run batch:run
 *
 * Options:
 *   --dry-run          List pending jobs without processing
 *   --retry-failed     Only retry previously failed jobs
 *   --start-from N     Skip jobs with id < N
 *   --parallel N       Max concurrent claude workers (default: 1)
 *   --max-retries N    Attempts per job (default: 2)
 *   --limit N          Stop after N jobs (useful for test runs)
 */

import { execFileSync, spawn } from 'node:child_process';
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// ──────────────────────────────────────────────────────────────────────────────
// Parse CLI args
// ──────────────────────────────────────────────────────────────────────────────

const args    = process.argv.slice(2);
const DRY_RUN    = args.includes('--dry-run');
const RETRY_ONLY = args.includes('--retry-failed');
const PARALLEL   = parseInt(args[args.indexOf('--parallel')  + 1] ?? '1', 10);
const MAX_RETRY  = parseInt(args[args.indexOf('--max-retries')+ 1] ?? '2', 10);
const START_FROM = parseInt(args[args.indexOf('--start-from') + 1] ?? '0', 10);
const LIMIT      = parseInt(args[args.indexOf('--limit')      + 1] ?? '0', 10);

// ──────────────────────────────────────────────────────────────────────────────
// State backend — prefer SQLite, fall back to TSV
// ──────────────────────────────────────────────────────────────────────────────

const DB_PATH    = join(ROOT, 'data', 'pipeline.db');
const STATE_PATH = join(ROOT, 'batch', 'batch-state.tsv');
const INPUT_PATH = join(ROOT, 'batch', 'batch-input.tsv');
const LOCK_PATH  = join(ROOT, 'batch', 'batch-runner.pid');

let db = null;
try {
  const { default: Database } = await import('better-sqlite3');
  if (existsSync(DB_PATH)) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
  }
} catch { /* better-sqlite3 not installed — use TSV fallback */ }

// ──────────────────────────────────────────────────────────────────────────────
// Lock file — prevent double execution
// ──────────────────────────────────────────────────────────────────────────────

if (existsSync(LOCK_PATH)) {
  const pid = readFileSync(LOCK_PATH, 'utf8').trim();
  console.error(`❌ Another batch run is in progress (PID ${pid}). If stale, delete: ${LOCK_PATH}`);
  process.exit(1);
}
if (!DRY_RUN) writeFileSync(LOCK_PATH, String(process.pid));

const cleanup = () => {
  try { require('node:fs').unlinkSync(LOCK_PATH); } catch {}
  if (db) db.close();
};
process.on('exit', cleanup);
process.on('SIGINT', () => { cleanup(); process.exit(130); });
process.on('SIGTERM', () => { cleanup(); process.exit(143); });

// ──────────────────────────────────────────────────────────────────────────────
// Load batch-input.tsv
// ──────────────────────────────────────────────────────────────────────────────

if (!existsSync(INPUT_PATH)) {
  console.error(`❌ ${INPUT_PATH} not found. Add URLs first.`);
  process.exit(1);
}

const inputLines = readFileSync(INPUT_PATH, 'utf8').split('\n').filter(Boolean);
const batchId    = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

// Parse entries: id \t url \t source \t notes
const entries = inputLines
  .filter(l => !l.startsWith('id\t') && l.trim())
  .map(line => {
    const [id, url, source, notes] = line.split('\t');
    return { id: id?.trim(), url: url?.trim(), source: source?.trim(), notes: notes?.trim() };
  })
  .filter(e => e.id && e.url?.startsWith('http'));

// ──────────────────────────────────────────────────────────────────────────────
// Load existing state
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Returns the current state of a job: 'pending' | 'completed' | 'failed'
 */
function getJobState(id, url) {
  if (db) {
    const row = db.prepare('SELECT status, retries FROM batch_jobs WHERE url=? ORDER BY id DESC LIMIT 1').get(url);
    return row ?? { status: 'pending', retries: 0 };
  }
  // TSV fallback
  if (!existsSync(STATE_PATH)) return { status: 'pending', retries: 0 };
  const lines = readFileSync(STATE_PATH, 'utf8').split('\n');
  for (const line of lines) {
    const parts = line.split('\t');
    if (parts[0] === id) return { status: parts[2] ?? 'pending', retries: parseInt(parts[8] ?? '0', 10) };
  }
  return { status: 'pending', retries: 0 };
}

function setJobState(id, url, status, extras = {}) {
  if (db) {
    const existing = db.prepare('SELECT id FROM batch_jobs WHERE batch_id=? AND url=?').get(batchId, url);
    if (existing) {
      db.prepare(`UPDATE batch_jobs SET status=?, ${Object.keys(extras).map(k=>k+'=?').join(',')}, ${status==='processing'?'started_at':'completed_at'}=? WHERE id=?`)
        .run(status, ...Object.values(extras), new Date().toISOString(), existing.id);
    } else {
      db.prepare('INSERT INTO batch_jobs (batch_id, url, status) VALUES (?,?,?)').run(batchId, url, status);
    }
    return;
  }
  // TSV fallback — append row
  const row = [id, url, status, extras.started_at ?? '', extras.completed_at ?? '', extras.report_num ?? '-', extras.score ?? '-', extras.error_msg ?? '-', extras.retries ?? 0].join('\t');
  const existing = existsSync(STATE_PATH) ? readFileSync(STATE_PATH, 'utf8') : 'id\turl\tstatus\tstarted_at\tcompleted_at\treport_num\tscore\terror\tretries\n';
  writeFileSync(STATE_PATH, existing + row + '\n');
}

// ──────────────────────────────────────────────────────────────────────────────
// Filter pending jobs
// ──────────────────────────────────────────────────────────────────────────────

let pending = entries.filter(e => {
  const { status, retries } = getJobState(e.id, e.url);
  if (status === 'completed') return false;
  if (RETRY_ONLY && status !== 'failed') return false;
  if (status === 'failed' && retries >= MAX_RETRY) return false;
  if (parseInt(e.id, 10) < START_FROM) return false;
  return true;
});

if (LIMIT > 0) pending = pending.slice(0, LIMIT);

console.log(`\n🗂  career-ops Batch Orchestrator`);
console.log(`   Batch ID:   ${batchId}`);
console.log(`   Input:      ${entries.length} total, ${pending.length} pending`);
console.log(`   Parallel:   ${PARALLEL}`);
if (DRY_RUN) console.log(`   Mode:       DRY RUN — no processing`);
console.log('');

if (pending.length === 0) {
  console.log('✅ Nothing to process.');
  process.exit(0);
}

if (DRY_RUN) {
  pending.forEach(e => console.log(`  [DRY] Would process: #${e.id} ${e.url.slice(0, 70)}`));
  process.exit(0);
}

// ──────────────────────────────────────────────────────────────────────────────
// Worker function — calls claude with batch-prompt.md as system prompt
// ──────────────────────────────────────────────────────────────────────────────

const LOGS_DIR = join(ROOT, 'batch', 'logs');
mkdirSync(LOGS_DIR, { recursive: true });
mkdirSync(join(ROOT, 'batch', 'tracker-additions'), { recursive: true });

async function processJob(entry) {
  const { id, url, notes } = entry;
  console.log(`  ▶ #${id} ${url.slice(0, 60)}…`);

  setJobState(id, url, 'processing', { started_at: new Date().toISOString() });

  // Determine next sequential report number
  let reportNum = '001';
  try {
    const { readdirSync } = await import('node:fs');
    const reports = readdirSync(join(ROOT, 'reports')).filter(f => f.endsWith('.md'));
    const maxNum  = reports.reduce((max, f) => {
      const m = f.match(/^(\d+)-/);
      return m ? Math.max(max, parseInt(m[1], 10)) : max;
    }, 0);
    reportNum = String(maxNum + 1).padStart(3, '0');
  } catch {}

  // Build the worker prompt
  const systemPromptPath = join(ROOT, 'batch', 'batch-prompt.md');
  const prompt = `Process this job offer.
URL: ${url}
Report number: ${reportNum}
Batch ID: ${id}
Notes: ${notes ?? ''}

Follow the full evaluate mode pipeline (modes/oferta.md). Save the markdown report, JSON report, and tracker TSV.`;

  const logPath = join(LOGS_DIR, `${reportNum}-${id}.log`);
  const logStream = (await import('node:fs')).createWriteStream(logPath);

  return new Promise((resolve) => {
    const claudeArgs = [
      '--dangerously-skip-permissions',
      '--print',
    ];
    if (existsSync(systemPromptPath)) {
      claudeArgs.push('--append-system-prompt-file', systemPromptPath);
    }
    claudeArgs.push(prompt);

    const child = spawn('claude', claudeArgs, {
      cwd: ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    child.stdout.on('data', d => { stdout += d; logStream.write(d); });
    child.stderr.on('data', d => logStream.write(d));

    child.on('close', (code) => {
      logStream.end();
      if (code === 0) {
        // Try to parse score from stdout JSON
        let score = null;
        try { score = JSON.parse(stdout.match(/\{[\s\S]+\}/)?.[0])?.score; } catch {}
        console.log(`  ✅ #${id} → report ${reportNum}${score ? ` (score: ${score})` : ''}`);
        setJobState(id, url, 'completed', { completed_at: new Date().toISOString(), report_num: reportNum, score: score ?? '-' });
        resolve({ ok: true, id, reportNum, score });
      } else {
        console.error(`  ❌ #${id} failed (exit ${code}) — see ${logPath}`);
        setJobState(id, url, 'failed', { completed_at: new Date().toISOString(), error_msg: `exit ${code}` });
        resolve({ ok: false, id });
      }
    });
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// Concurrency runner
// ──────────────────────────────────────────────────────────────────────────────

const results = { ok: 0, failed: 0 };
const queue   = [...pending];

async function runWithConcurrency() {
  const slots = Array.from({ length: PARALLEL }, async () => {
    while (queue.length > 0) {
      const job = queue.shift();
      if (!job) break;
      const result = await processJob(job);
      if (result.ok) results.ok++; else results.failed++;
    }
  });
  await Promise.all(slots);
}

await runWithConcurrency();

// ──────────────────────────────────────────────────────────────────────────────
// Merge tracker additions
// ──────────────────────────────────────────────────────────────────────────────

try {
  execFileSync('node', ['merge-tracker.mjs'], { cwd: ROOT, stdio: 'inherit' });
} catch {
  console.warn('⚠️  merge-tracker.mjs failed — run manually: npm run merge');
}

console.log(`\n🎉 Batch complete: ${results.ok} succeeded, ${results.failed} failed`);
if (results.failed > 0) console.log(`   Retry failed: node scripts/batch-orchestrator.mjs --retry-failed`);
