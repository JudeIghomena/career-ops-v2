# Mode: evaluate — Full A–F Job Offer Evaluation

When the candidate pastes an offer (text or URL), ALWAYS deliver all 6 blocks below.

> **Note:** The Spanish alias `oferta` maps to this same mode. Both `/career-ops evaluate` and `/career-ops oferta` invoke this file.

---

## Step 0 — Archetype Detection

Classify the offer into one of the 6 archetypes (see `_shared.md`). If hybrid, indicate the 2 closest. This determines:
- Which proof points to prioritise in Block B
- How to rewrite the summary in Block E
- Which STAR stories to prepare in Block F

---

## Block A — Role Snapshot

Table with:
| Field | Value |
|---|---|
| **Archetype** | detected archetype |
| **Domain** | platform / agentic / LLMOps / ML / enterprise |
| **Function** | build / consult / manage / deploy |
| **Seniority** | IC level or management level |
| **Remote** | full / hybrid / onsite |
| **Team size** | if mentioned in JD |
| **TL;DR** | one-sentence summary |

---

## Block B — CV Match

Read `cv.md`. Create a table mapping each JD requirement to exact CV lines.

**Adapted by archetype:**
- FDE → prioritise fast delivery and client-facing proof points
- SA → prioritise system design and integration work
- PM → prioritise product discovery and metrics
- LLMOps → prioritise evals, observability, pipelines
- Agentic → prioritise multi-agent, HITL, orchestration
- Transformation → prioritise change management, adoption, scaling

**Gaps section** — for each gap:
1. Hard blocker or nice-to-have?
2. Can the candidate show adjacent experience?
3. Is there a portfolio project that covers this gap?
4. Concrete mitigation plan (cover letter phrase, quick project, etc.)

---

## Block C — Seniority & Strategy

1. **Detected level** in JD vs **candidate's natural level** for this archetype
2. **"Sell senior, don't lie" plan**: specific phrases adapted to archetype, concrete wins to highlight, how to frame founder experience as an asset
3. **"If downlevelled" plan**: accept if comp is fair, negotiate 6-month review, define clear promotion criteria

---

## Block D — Comp & Market Demand

Use WebSearch for:
- Current salaries for this role (Glassdoor, Levels.fyi, Blind, LinkedIn Salary)
- Company compensation reputation
- Market demand trend for this archetype

Table with data and cited sources. If no data, say so — never invent.

---

## Block E — Personalisation Plan

| # | Section | Current state | Proposed change | Why |
|---|---------|---------------|-----------------|-----|
| 1 | Summary | … | … | … |
| … | … | … | … | … |

Top 5 CV changes + Top 5 LinkedIn changes to maximise match for this specific role.

---

## Block F — Interview Prep

6–10 STAR+R stories mapped to JD requirements (STAR + **Reflection**):

| # | JD Requirement | STAR+R Story | S | T | A | R | Reflection |
|---|----------------|--------------|---|---|---|---|------------|

The **Reflection** column captures what was learned or what would be done differently. This signals seniority — junior candidates describe what happened, senior candidates extract lessons.

**Story Bank Integration:**
1. Read `interview-prep/story-bank.md` — check if any of these stories already exist
2. For NEW stories: append to `interview-prep/story-bank.md` and insert into `story_bank` table in `data/pipeline.db` (if DB exists)
3. Tag each story with competency + archetype so they surface in future evaluations

**Framed by archetype:**
- FDE → emphasise delivery speed and client-facing wins
- SA → emphasise architecture decisions and trade-offs
- PM → emphasise discovery and trade-off reasoning
- LLMOps → emphasise metrics, evals, production hardening
- Agentic → emphasise orchestration, error handling, HITL
- Transformation → emphasise adoption, organisational change

Also include:
- 1 recommended case study (which project to present and how)
- Red-flag questions and how to answer them (e.g. "why did you sell?", "do you have direct reports?")

---

## Post-Evaluation

**ALWAYS** after generating Blocks A–F:

### 1. Save Markdown Report

Save the complete evaluation to `reports/{###}-{company-slug}-{YYYY-MM-DD}.md`.

- `{###}` = next sequential number (3-digit, zero-padded)
- `{company-slug}` = company name in lowercase, hyphens, no spaces
- `{YYYY-MM-DD}` = today's date

**Report header format (required fields for dashboard):**

```markdown
# Evaluation: {Company} — {Role}

**Date:** {YYYY-MM-DD}
**URL:** {job posting URL}
**Archetype:** {detected}
**Score:** {X.X}/5
**PDF:** {path or pending}
**CV Version:** {git SHA of cv.md — run: git rev-parse --short HEAD -- cv.md}

---
```

### 2. Save JSON Report (NEW — required for dashboard)

Save a machine-readable summary alongside the markdown at `reports/{###}-{company-slug}-{YYYY-MM-DD}.json`:

```json
{
  "num": "001",
  "date": "YYYY-MM-DD",
  "company": "Acme Corp",
  "role": "Senior AI Engineer",
  "url": "https://...",
  "archetype": "Agentic / Automation",
  "score": 4.2,
  "status": "Evaluated",
  "has_pdf": false,
  "report_path": "reports/001-acme-corp-2026-04-08.md",
  "cv_version": "abc1234",
  "tldr": "One sentence role summary",
  "remote": "Full remote",
  "comp": "$150K–180K",
  "keywords": ["agent", "HITL", "orchestration"],
  "gaps": ["Kubernetes", "Rust"],
  "followup_date": null,
  "notes": ""
}
```

### 3. Register in Tracker

Write a TSV line to `batch/tracker-additions/{num}-{company-slug}.tsv` (NEVER edit `applications.md` directly):

```
{num}\t{date}\t{company}\t{role}\t{status}\tX.X/5\t❌\t[{num}](reports/...)\t{one-line summary}
```

**Column order:** num · date · company · role · status · score · pdf · report · notes

If `data/pipeline.db` exists, also insert/upsert into the `applications` table:
```bash
node -e "
  import('better-sqlite3').then(({default: DB}) => {
    const db = new DB('data/pipeline.db');
    db.prepare(\`INSERT OR REPLACE INTO applications
      (num,date,company,role,score,score_raw,status,has_pdf,report_path,report_json,job_url,archetype,notes)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)\`)
    .run('{num}','{date}','{company}','{role}',{score},'{score}/5','Evaluated',0,
         'reports/{slug}.md','reports/{slug}.json','{url}','{archetype}','{notes}');
    db.close();
  });
"
```
