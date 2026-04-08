# Mode: compare — Multi-Offer Ranking

> **Note:** The Spanish alias `ofertas` maps to this same mode. Both `/career-ops compare` and `/career-ops ofertas` invoke this file.

Compare and rank multiple job offers using a 10-dimension weighted scoring matrix.

---

## Scoring Matrix

| Dimension | Weight | Score 1–5 criteria |
|-----------|--------|--------------------|
| North Star alignment | 25% | 5 = exact target role, 1 = unrelated |
| CV match | 15% | 5 = 90%+ match, 1 = <40% match |
| Seniority level (senior+) | 15% | 5 = staff+, 4 = senior, 3 = mid-senior, 2 = mid, 1 = junior |
| Estimated comp | 10% | 5 = top quartile, 1 = below market |
| Growth trajectory | 10% | 5 = clear path to next level, 1 = dead end |
| Remote quality | 5% | 5 = full remote async, 1 = on-site only |
| Company reputation | 5% | 5 = top employer, 1 = red flags |
| Tech stack modernity | 5% | 5 = cutting-edge AI/ML, 1 = legacy |
| Time-to-offer speed | 5% | 5 = fast process (<4 weeks), 1 = 6+ months |
| Cultural signals | 5% | 5 = builder culture, 1 = bureaucratic |

**Total weighted score = Σ(dimension score × weight)**

---

## Workflow

1. **Gather offers**: Ask the user for offers if not already in context. Accept text, URLs, or references to already-evaluated reports (e.g. "compare #003 and #007").
2. **Score each offer**: Fill in the matrix above for each. Use WebSearch for comp data and company reputation.
3. **Produce ranked table**:

| Rank | Company | Role | Score | Top strength | Key risk | Recommend? |
|------|---------|------|-------|--------------|----------|------------|

4. **Final recommendation**: Call the winner with reasoning. Flag time-to-offer urgency (apply to the fastest process first, even if not the top scorer).
5. **Archetype alignment note**: If offers span different archetypes, note which one best fits the user's North Star from `modes/_profile.md`.

---

## Scoring overrides (from `config/profile.yml`)

Read `config/profile.yml` for:
- `scoring.apply_threshold` — override the default 4.5 apply threshold
- `scoring.skip_threshold` — override the default 3.5 skip threshold
- `compensation.minimum` — use as hard filter (score comp dimension 1 if below)
- `location.onsite_availability` — use to adjust remote quality scoring
