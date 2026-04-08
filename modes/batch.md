# Mode: batch — Bulk Offer Processing

Two operating modes:
- **Mode A — Conductor + Chrome**: Claude navigates portals live, spawns workers per offer
- **Mode B — Orchestrator script**: Node.js orchestrator processes pre-collected URLs with full resumability and atomic state

---

## Architecture

```
Mode A: Claude Conductor (claude --chrome --dangerously-skip-permissions)
  │
  │  Chrome: navigates portals (logged-in sessions)
  │  Reads DOM directly — user sees everything in real time
  │
  ├─ Offer 1: reads JD from DOM + URL
  │    └─► claude -p worker → report .md + .json + PDF + tracker-line
  │
  ├─ Offer 2: click next, reads JD + URL
  │    └─► claude -p worker → report .md + .json + PDF + tracker-line
  │
  └─ End: node merge-tracker.mjs → applications.md + summary

Mode B: Node.js Orchestrator (scripts/batch-orchestrator.mjs)
  │
  ├─ Reads batch/batch-input.tsv
  ├─ Tracks state in data/pipeline.db (atomic) or batch/batch-state.tsv (fallback)
  ├─ Manages N parallel claude workers safely
  └─ Merges tracker on completion
```

---

## Files

```
batch/
  batch-input.tsv          # URLs to process (manually added or by conductor)
  batch-state.tsv          # TSV fallback state (auto-generated, gitignored)
  batch-prompt.md          # System prompt template for workers
  logs/                    # One log file per offer (gitignored)
  tracker-additions/       # TSV tracker lines from each worker (gitignored)

scripts/
  batch-orchestrator.mjs   # Mode B orchestrator (replaces batch-runner.sh)
```

---

## Mode A: Conductor + Chrome

1. **Read state**: `data/pipeline.db` (or `batch/batch-state.tsv`) → know what's already processed
2. **Navigate portal**: Chrome → job search URL
3. **Extract URLs**: Read DOM results → extract list → append to `batch-input.tsv`
4. **For each pending URL**:
   a. Chrome: click offer → read JD text from DOM
   b. Save JD to `/tmp/batch-jd-{id}.txt`
   c. Calculate next sequential REPORT_NUM
   d. Execute worker:
      ```bash
      claude -p --dangerously-skip-permissions \
        --append-system-prompt-file batch/batch-prompt.md \
        "Process this offer. URL: {url}. JD: /tmp/batch-jd-{id}.txt. Report: {num}. ID: {id}"
      ```
   e. Update state (completed / failed + score + report_num)
   f. Log to `batch/logs/{num}-{id}.log`
   g. Chrome: go back → next offer
5. **Pagination**: click "Next" → repeat
6. **End**: `node merge-tracker.mjs` → merge + summary

---

## Mode B: Orchestrator Script

```bash
# Basic run (sequential, 1 worker)
npm run batch:run

# Or call directly
node scripts/batch-orchestrator.mjs [OPTIONS]
```

**Options:**
| Flag | Description |
|------|-------------|
| `--dry-run` | List pending jobs without processing |
| `--retry-failed` | Only retry previously failed jobs |
| `--start-from N` | Skip jobs with ID < N |
| `--parallel N` | Number of concurrent workers (default: 1) |
| `--max-retries N` | Max attempts per job (default: 2) |
| `--limit N` | Process only N jobs (useful for test runs) |

**Why Mode B is safer than the old shell script:**
- State written to SQLite with WAL mode — atomic, no TSV race conditions with `--parallel`
- Lock file prevents double execution
- Single Node.js process manages concurrency — no subprocess fan-out issues
- `--retry-failed` reads from DB, not a fragile grep on TSV

---

## State Schema (`batch_jobs` table)

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Auto PK |
| `batch_id` | TEXT | ISO timestamp of the run |
| `url` | TEXT | Job posting URL |
| `status` | TEXT | pending \| processing \| completed \| failed |
| `started_at` | TEXT | ISO timestamp |
| `completed_at` | TEXT | ISO timestamp |
| `report_num` | TEXT | e.g. "007" |
| `score` | REAL | Numeric score 1.0–5.0 |
| `error_msg` | TEXT | Error if failed |
| `retries` | INTEGER | Attempt count |

---

## Worker Output (per offer)

Each worker produces:
1. `reports/{num}-{slug}-{date}.md` — full evaluation report
2. `reports/{num}-{slug}-{date}.json` — machine-readable summary
3. `output/{num}-{slug}.pdf` — ATS-optimised CV (if score ≥ threshold)
4. `batch/tracker-additions/{num}-{slug}.tsv` — tracker line for merge

---

## Error Handling

| Error | Recovery |
|-------|----------|
| URL not accessible | Worker fails → orchestrator marks `failed`, continues |
| JD behind login (Mode A) | Conductor tries DOM. If fails → `failed` |
| Portal layout change (Mode A) | Conductor reasons about HTML, adapts |
| Worker crashes | Orchestrator marks `failed`, continues. Retry with `--retry-failed` |
| Orchestrator dies | Re-run → reads state → skips completed |
| PDF fails | `.md` and `.json` saved. PDF left pending |
| DB not available | Falls back to `batch-state.tsv` automatically |

---

## Resumability

- Re-run at any time — already-completed jobs are skipped automatically
- `batch-runner.pid` lock file prevents accidental parallel runs
- Individual worker failures never cascade to other jobs
