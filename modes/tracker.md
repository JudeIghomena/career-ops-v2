# Mode: tracker — Application Pipeline Overview

Read and display `data/applications.md` (and `data/pipeline.db` if it exists — prefer DB for richer queries).

---

## Tracker Format

```markdown
| # | Date | Company | Role | Score | Status | PDF | Report | Notes |
|---|------|---------|------|-------|--------|-----|--------|-------|
```

---

## Canonical Status Values

| Status | When to use |
|--------|-------------|
| `Evaluated` | Report completed, decision pending |
| `Applied` | Application submitted |
| `Responded` | Company reached out (inbound) |
| `Outreach` | Candidate proactively contacted someone at the company (outbound LinkedIn) |
| `Interview` | Active interview process |
| `Offer` | Offer received |
| `Rejected` | Rejected by company |
| `Discarded` | Candidate chose not to proceed or posting closed |
| `SKIP` | Not a fit — do not apply |

**Status flow:** `Evaluated` → `Applied` → `Responded` / `Outreach` → `Interview` → `Offer` / `Rejected` / `Discarded`

---

## Display

Show the full tracker table, then a stats summary:

```
📊 Pipeline Stats
─────────────────────────────────
Total tracked:    42
  Evaluated:      15  (36%)
  Applied:        12  (29%)
  Interview:       5  (12%)
  Offer:           1   (2%)
  Rejected:        4  (10%)
  Discarded/Skip:  5  (12%)

Avg score:        4.1 / 5.0
Top score:        4.8 / 5.0
With PDF:         10 / 42  (24%)
With report:      38 / 42  (90%)

⏰ Needs follow-up (overdue):
  #031 Acme Corp — AI Engineer     (applied 8 days ago, no response)
  #028 Beta Inc  — Staff PM         (applied 12 days ago, no response)
```

---

## Status Updates

If the user asks to update a status:
1. Edit the corresponding row in `applications.md`
2. If `data/pipeline.db` exists, also run:
   ```bash
   node -e "import('better-sqlite3').then(({default:DB})=>{ const db=new DB('data/pipeline.db'); db.prepare('UPDATE applications SET status=? WHERE num=?').run('{new_status}','{num}'); db.close(); })"
   ```
3. Use only canonical status values from the table above

---

## Follow-up Date Tracking

If a row has `Applied` status and no response after 7 days, flag it in the stats summary. If `data/pipeline.db` exists, query:
```sql
SELECT num, company, role, date, followup_date
FROM applications
WHERE status = 'Applied'
  AND (followup_date IS NULL OR followup_date <= date('now'))
ORDER BY date ASC;
```
