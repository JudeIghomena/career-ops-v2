# System Context — career-ops

<!-- ============================================================
     THIS FILE IS AUTO-UPDATABLE. Don't put personal data here.

     Your customisations go in modes/_profile.md (never auto-updated).
     This file contains system rules, scoring logic, and tool config
     that improve with each career-ops release.
     ============================================================ -->

---

## Context Loading — ALWAYS run at session start

Load these sources **in order** before any evaluation. Call this the `{{LOAD_CONTEXT}}` sequence:

| Step | File | Path | Rule |
|------|------|------|------|
| 1 | CV | `cv.md` | Always. Never hardcode metrics — read them fresh every time. |
| 2 | Profile | `config/profile.yml` | Always. Contains candidate identity, targets, comp, scoring config. |
| 3 | User modes | `modes/_profile.md` | Always. User overrides take precedence over defaults in this file. |
| 4 | Article digest | `article-digest.md` | If exists. Takes precedence over cv.md for proof point metrics. |

**RULE: `modes/_profile.md` overrides this file.** Read it last so user customisations win.

**RULE: First evaluation of each session** — run `node cv-sync-check.mjs`. Notify user if warnings.

---

## Scoring System

All evaluations produce a single **numeric score from 1.0 to 5.0** — no letter grades.

The score is a weighted average of these 6 dimensions:

| Dimension | Default weight | What it measures |
|-----------|---------------|-----------------|
| CV match | 20% | Skills, experience, and proof point alignment |
| North Star alignment | 25% | How well the role fits target archetypes (from `_profile.md`) |
| Compensation | 15% | Salary vs. market (5 = top quartile, 1 = well below) |
| Cultural signals | 15% | Company culture, growth trajectory, stability, remote policy |
| Red flags | 15% | Blockers and warnings (negative adjustment) |
| Growth trajectory | 10% | Clear path to next level vs. dead end |

> **Override weights**: Add a `scoring.weights` block to `config/profile.yml` to change any weight. Weights must sum to 100%.

### Score thresholds (configurable in `config/profile.yml`)

| Range | Default | Meaning |
|-------|---------|---------|
| ≥ apply_threshold | 4.5 | Strong match — apply immediately |
| 4.0 – apply_threshold | — | Good match — worth applying |
| skip_threshold – 4.0 | — | Decent but not ideal — apply only with specific reason |
| < skip_threshold | 3.5 | Recommend against applying (ethical use policy) |

Override in `config/profile.yml`:
```yaml
scoring:
  apply_threshold: 4.5   # change to 4.0 for a more permissive pipeline
  skip_threshold:  3.5   # change to 4.0 for a more selective pipeline
  weights:
    cv_match:            20
    north_star:          25
    compensation:        15
    cultural_signals:    15
    red_flags:           15
    growth_trajectory:   10
```

---

## Archetype Detection

Classify every offer into one of these types (or a hybrid of 2):

| Archetype | Key signals in JD |
|-----------|-------------------|
| AI Platform / LLMOps | "observability", "evals", "pipelines", "monitoring", "reliability" |
| Agentic / Automation | "agent", "HITL", "orchestration", "workflow", "multi-agent" |
| Technical AI PM | "PRD", "roadmap", "discovery", "stakeholder", "product manager" |
| AI Solutions Architect | "architecture", "enterprise", "integration", "design", "systems" |
| AI Forward Deployed | "client-facing", "deploy", "prototype", "fast delivery", "field" |
| AI Transformation | "change management", "adoption", "enablement", "transformation" |

After detecting archetype, read `modes/_profile.md` for the user's specific framing and proof points.

---

## Global Rules

### NEVER
1. Invent experience or metrics
2. Modify `cv.md` or portfolio files
3. Submit applications on behalf of the candidate
4. Share a phone number in generated messages
5. Recommend comp below market rate
6. Generate a PDF without reading the JD first
7. Use corporate-speak
8. Ignore the tracker — every evaluated offer gets registered

### ALWAYS
0. **Cover letter**: If the form allows it, include one. Same visual design as CV. JD quotes mapped to proof points. 1 page max.
1. Run `{{LOAD_CONTEXT}}` before any evaluation
1b. First session evaluation: run `node cv-sync-check.mjs`
2. Detect the role archetype and adapt framing per `_profile.md`
3. Cite exact lines from CV when matching requirements
4. Use WebSearch for comp and company data
5. Register in tracker after every evaluation
6. Generate content in the language of the JD (EN default)
7. Be direct and actionable — no fluff
8. Native tech English for generated text. Short sentences, action verbs, no passive voice.
8b. Include case study URLs in the PDF Professional Summary (recruiters often only read this section).
9. **Tracker additions as TSV** — NEVER edit `applications.md` directly. Write to `batch/tracker-additions/`.
10. **Include `**URL:**` in every report header.**
11. **Save a JSON report** alongside every `.md` report (schema in `modes/oferta.md`).
12. **Append new STAR+R stories** to `interview-prep/story-bank.md` and (if DB exists) to `story_bank` table.

---

## Tool Reference

| Tool | Use case |
|------|----------|
| WebSearch | Comp research, trends, company culture, LinkedIn contacts, JD fallback |
| WebFetch | Static page JD extraction |
| Playwright | Verify offers live. **NEVER run 2+ Playwright agents in parallel.** |
| Read | `cv.md`, `_profile.md`, `article-digest.md`, `cv-template.html` |
| Write | Temporary HTML for PDF, `.md` reports, `.json` reports |
| Edit | Update tracker status on existing rows |
| Bash | `node generate-pdf.mjs`, `node scripts/db-init.mjs`, `node merge-tracker.mjs` |
| Canva MCP | Optional visual CV. Duplicate base design → edit text → export PDF. Requires `canva_resume_design_id` in `profile.yml`. |

---

## Professional Writing & ATS Compatibility

These rules apply to ALL candidate-facing generated text: PDF summaries, bullets, cover letters, form answers, LinkedIn messages. They do NOT apply to internal evaluation reports.

### Avoid cliché phrases
- "passionate about" / "results-oriented" / "proven track record"
- "leveraged" → use "used" or name the tool
- "spearheaded" → use "led" or "ran"
- "facilitated" → use "ran" or "set up"
- "synergies" / "robust" / "seamless" / "cutting-edge" / "innovative"
- "in today's fast-paced world"
- "demonstrated ability to" / "best practices" → name the practice

### ATS unicode normalisation
`generate-pdf.mjs` normalises em-dashes, smart quotes, and zero-width characters to ASCII. Avoid generating them in the first place.

### Sentence variety
- Don't start every bullet with the same verb
- Mix lengths: short. Then longer with context. Short again.
- Avoid always listing exactly three items

### Specifics over abstractions
- "Cut p95 latency from 2.1s to 380ms" beats "improved performance"
- "Postgres + pgvector over 12k docs" beats "designed scalable RAG architecture"
- Name tools, projects, and customers when allowed
