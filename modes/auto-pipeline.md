# Mode: auto-pipeline — Full Automatic Pipeline

When the user pastes a JD (text or URL) without an explicit sub-command, run the ENTIRE pipeline sequentially:

---

## Step 0 — Extract JD

If the input is a **URL** (not pasted JD text), extract the content in priority order:

1. **Playwright (preferred):** Most job portals (Lever, Ashby, Greenhouse, Workday) are SPAs. Use `browser_navigate` + `browser_snapshot` to render and read the JD.
2. **WebFetch (fallback):** For static pages (ZipRecruiter, WeLoveProduct, company career pages).
3. **WebSearch (last resort):** Search for role title + company on portals that index JDs as static HTML.

If none work: ask the candidate to paste the JD text manually or share a screenshot.

If the input **is already JD text**: use it directly, no fetch needed.

---

## Step 1 — Full Evaluation (A–F)

Execute exactly as per the `evaluate` mode (read `modes/oferta.md` for all Blocks A–F).

Read scoring thresholds from `config/profile.yml`:
- `scoring.apply_threshold` (default 4.5) — trigger Step 4 (application answers)
- `scoring.skip_threshold` (default 3.5) — warn user before continuing

---

## Step 2 — Save Markdown Report

Save the complete evaluation to `reports/{###}-{company-slug}-{YYYY-MM-DD}.md` (see format in `modes/oferta.md`).

Required header fields: **URL**, **Archetype**, **Score**, **PDF**, **CV Version**.

---

## Step 3 — Save JSON Report

Save machine-readable summary to `reports/{###}-{company-slug}-{YYYY-MM-DD}.json` (see schema in `modes/oferta.md`).

---

## Step 4 — Generate PDF

Execute the full `pdf` pipeline (read `modes/pdf.md`).

---

## Step 5 — Draft Application Answers *(only if score ≥ apply_threshold)*

If final score ≥ `scoring.apply_threshold` from profile:

1. **Extract form questions**: Use Playwright to navigate to the form and snapshot. If unavailable, use generic questions below.
2. **Generate answers** using the tone guidelines.
3. **Append to report** as section `## G) Draft Application Answers`.

### Generic questions (use if form is not extractable)
- Why are you interested in this role?
- Why do you want to work at [Company]?
- Tell us about a relevant project or achievement.
- What makes you a good fit for this position?
- How did you hear about this role?

### Answer tone — "I'm choosing you"
The candidate has options and is choosing this company for concrete reasons.

| Rule | Example |
|------|---------|
| Confident, not arrogant | "I've spent the past year building production AI agent systems — your role is where I want to apply that next." |
| Specific, not generic | Always reference something REAL from the JD and something REAL from the candidate's experience |
| Direct, no fluff | 2–4 sentences per answer. No "I'm passionate about…" or "I'd love the opportunity to…" |
| Proof over claims | "Built X that achieved Y" not "I'm great at X" |

**Per-question framework:**
- **Why this role?** → "Your [specific JD element] maps directly to [specific thing I built]."
- **Why this company?** → Something concrete: "I've been using [product] for [time/purpose]."
- **Relevant experience?** → One quantified proof point: "Built [X] that [metric]."
- **Good fit?** → "I sit at the intersection of [A] and [B], which is exactly where this role lives."
- **How did you hear?** → Honest: "Found through [portal/scan], evaluated against my criteria, it scored highest."

**Language**: Always match the JD language (EN default).

---

## Step 6 — Update Tracker

Write a TSV line to `batch/tracker-additions/{num}-{company-slug}.tsv` with all columns marked complete (✅ or ❌).

If `data/pipeline.db` exists, also upsert into the `applications` table (see `modes/oferta.md` for the insert statement).

---

**If any step fails**: continue with remaining steps, mark the failed step as pending in the tracker notes column.
