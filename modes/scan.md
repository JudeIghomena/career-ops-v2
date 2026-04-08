# Mode: scan — Portal Scanner (Incremental Job Discovery)

Scans configured job portals, filters by title relevance, and adds **only new** offers to the pipeline. Uses a persistent cache to avoid re-processing listings seen in previous scans.

---

## Recommended execution

Run as a subagent to avoid consuming the main context window:

```
Agent(
    subagent_type="general-purpose",
    prompt="[contents of this file + specific run data]",
    run_in_background=True
)
```

---

## Configuration

Read `portals.yml`:
- `search_queries` — WebSearch queries with `site:` filters (broad discovery)
- `tracked_companies` — specific companies with `careers_url` for direct navigation
- `title_filter` — positive / negative / seniority_boost keywords for title filtering

---

## Delta / Incremental Scan (CRITICAL)

**Before launching any Playwright session**, determine which URLs are genuinely new.

### If `data/pipeline.db` exists (preferred):

```sql
-- A URL is "seen" if it appears in scan_history with any status
SELECT url FROM scan_history WHERE url = ?
```

Use this check before navigating to any job listing URL. Only Playwright-verify URLs that are NOT in the database.

### Fallback (no DB): use `data/scan-history.tsv`

Read the TSV and build an in-memory set of seen URLs before scanning.

**Result**: On a typical incremental run across 45 companies, expect 80–90% of listings to be cache hits. Playwright only launches for genuinely new listings.

---

## Discovery Strategy (3 levels)

### Level 1 — Playwright Direct (PRIMARY)

For each company in `tracked_companies` with `enabled: true` and `careers_url` defined:
1. `browser_navigate` to `careers_url`
2. `browser_snapshot` — read ALL visible job listings
3. Extract `{title, url, company}` from each listing
4. **Delta check**: skip URLs already in `scan_history` (DB or TSV)
5. Apply title filter to remaining URLs
6. If page is paginated, follow pagination for new listings only

If `careers_url` fails (404, redirect): try `scan_query` as fallback, annotate for manual URL update.

### Level 2 — Greenhouse API (COMPLEMENTARY)

For companies with `api:` defined in `portals.yml`:
1. WebFetch the Greenhouse JSON API: `boards-api.greenhouse.io/v1/boards/{slug}/jobs`
2. Extract `{title, url, company}` from response
3. Delta check against cache
4. Title filter on new URLs only

Faster than Playwright but Greenhouse-only. Run alongside Level 1 (dedup results).

### Level 3 — WebSearch Queries (BROAD DISCOVERY)

For each query in `search_queries` with `enabled: true`:
1. WebSearch with the configured query
2. Extract `{title, url, company}` from each result
3. Delta check against cache — most results will be cache hits on incremental runs
4. Title filter on new URLs
5. **Liveness verification required** (see below) for any URL that passes title filter

**Execution priority:** Level 1 → Level 2 → Level 3 (all run, results merged and deduped)

---

## Workflow

1. **Read config**: `portals.yml`
2. **Load seen-URL cache**:
   - If `data/pipeline.db` exists: query `scan_history` table
   - Else: read `data/scan-history.tsv` into memory
3. **Read dedup sources**: `data/applications.md` + `data/pipeline.md`

4. **Level 1 — Playwright scan** (batches of 3–5 companies):
   - For each company: navigate → snapshot → extract listings → delta check → title filter → accumulate new

5. **Level 2 — Greenhouse APIs** (parallel):
   - WebFetch JSON APIs → extract → delta check → title filter → accumulate new

6. **Level 3 — WebSearch queries** (parallel where possible):
   - Search → extract → delta check → title filter → **liveness check** → accumulate new

7. **Deduplicate** across all 3 levels + existing `applications.md` / `pipeline.md`

8. **Liveness verification for Level 3 results only** (sequential — NEVER parallel Playwright):
   For each new Level-3 URL:
   - `browser_navigate` → `browser_snapshot`
   - **Active**: title + description + Apply button visible
   - **Expired**: redirect to `?error=true`, "job no longer available", or empty page (<300 chars)
   - If expired: record `skipped_expired` in cache, discard

9. **Record ALL findings** in cache:
   - New added → status `added`
   - Filtered by title → status `skipped_title`
   - Duplicate → status `skipped_dup`
   - Expired → status `skipped_expired`

   **If `data/pipeline.db` exists:**
   ```bash
   node -e "
     import('better-sqlite3').then(({default:DB})=>{
       const db = new DB('data/pipeline.db');
       const upsert = db.prepare(\`
         INSERT INTO scan_history (url,portal,title,company,status)
         VALUES (?,?,?,?,?)
         ON CONFLICT(url) DO UPDATE SET last_seen=strftime('%Y-%m-%dT%H:%M:%SZ','now'), status=excluded.status
       \`);
       // call upsert for each URL
       db.close();
     });
   "
   ```

   **Fallback (no DB):** append new rows to `data/scan-history.tsv`.

10. **Add new verified offers** to `data/pipeline.md` as:
    ```
    - [ ] {url} | {company} | {title}
    ```

---

## Title Filtering

From `portals.yml` `title_filter`:
- At least 1 keyword from `positive` must appear in title (case-insensitive)
- 0 keywords from `negative` must appear
- `seniority_boost` keywords increase priority but are not required

---

## Title & Company Extraction from WebSearch

Results typically arrive as: `"Job Title @ Company"`, `"Job Title | Company"`, or `"Job Title — Company"`.

Regex: `(.+?)(?:\s*[@|—–-]\s*|\s+at\s+)(.+?)$`

Platform patterns:
- **Ashby**: `"Senior AI PM (Remote) @ EverAI"` → title: `Senior AI PM`, company: `EverAI`
- **Greenhouse**: `"AI Engineer at Anthropic"` → title: `AI Engineer`, company: `Anthropic`
- **Lever**: `"Product Manager - AI @ Temporal"` → title: `Product Manager - AI`, company: `Temporal`

---

## Private / Login-Gated URLs

If a URL is not publicly accessible:
1. Save JD text to `jds/{company}-{role-slug}.md`
2. Add to `pipeline.md` as: `- [ ] local:jds/{company}-{role-slug}.md | {company} | {title}`

---

## Scan Summary Output

```
Portal Scan — {YYYY-MM-DD}
━━━━━━━━━━━━━━━━━━━━━━━━━━
Cache hits (skipped):   312  (saved 312 Playwright launches)
Queries executed:         N
Listings found:           N  total
  Filtered by title:      N  relevant
  Duplicates:             N  (already evaluated or in pipeline)
  Expired (Level 3):      N  dead links
  NEW added to pipeline:  N  ✅

  + {company} | {title} | {portal}
  ...

→ Run /career-ops pipeline to evaluate the new offers.
```

---

## `careers_url` Management

Each company in `tracked_companies` must have a `careers_url` (direct link to jobs page).

**Known platform patterns:**
- **Ashby:** `https://jobs.ashbyhq.com/{slug}`
- **Greenhouse:** `https://job-boards.greenhouse.io/{slug}` or `.eu.greenhouse.io/{slug}`
- **Lever:** `https://jobs.lever.co/{slug}`
- **Custom:** Company's own careers page

**If `careers_url` is missing:** Search once → confirm with Playwright → save to `portals.yml`.
**If `careers_url` returns 404:** Note in summary → try `scan_query` fallback → flag for manual update.
