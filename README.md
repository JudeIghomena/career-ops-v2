# Career Wizard

**by Janna AI Research Labs — an iRaven Group company**

Career Wizard is an AI-powered job search command center that turns any job URL into a full evaluation, tailored CV, and tracked application — all from a single tool.

> **This is NOT a spray-and-pray tool.** Career Wizard is a filter — it helps you find the few offers worth your time out of hundreds. The system strongly recommends against applying to anything scoring below 4.0/5. Your time is valuable. Always review before submitting.

---

## What It Does

- **Evaluates job offers** with a structured scoring system (10 weighted dimensions)
- **Generates tailored CVs** — ATS-optimized, customized per job description
- **Scans portals** automatically (Greenhouse, Ashby, Lever, company pages)
- **Tracks everything** in a single pipeline with status management and follow-up reminders
- **GUI Dashboard** — full browser-based interface via Career Wizard Web

---

## Features

| Feature | Description |
|---------|-------------|
| **Auto-Pipeline** | Paste a URL, get a full evaluation + CV + tracker entry |
| **6-Block Evaluation** | Role summary, CV match, level strategy, comp research, personalization, interview prep (STAR+R) |
| **Interview Story Bank** | Accumulates STAR+Reflection stories across evaluations |
| **Negotiation Scripts** | Salary negotiation frameworks and competing offer leverage |
| **CV PDF Generation** | Tailored CVs rendered as A4 PDFs via the Career Wizard dashboard |
| **Portal Scanner** | 45+ companies pre-configured + custom queries across Ashby, Greenhouse, Lever, Wellfound |
| **Human-in-the-Loop** | AI evaluates and recommends — you always have the final call |
| **Pipeline Integrity** | Automated dedup, status normalization, and health checks |

---

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/JudeIghomena/career-ops.git
cd career-ops && npm install

# 2. Configure your profile
cp config/profile.example.yml config/profile.yml
# Edit profile.yml with your name, target role, salary range

# 3. Add your CV
# Create cv.md in the project root with your CV in markdown

# 4. Open Claude Code in this directory
claude

# 5. Start using
# Paste a job URL or run /career-ops
```

For the full browser-based GUI, see [Career Wizard Web](https://github.com/JudeIghomena/career-ops-web).

---

## Usage

Career Wizard runs as a slash command with multiple modes:

```
/career-ops                → Show all available commands
/career-ops {paste a JD}   → Full auto-pipeline (evaluate + CV + tracker)
/career-ops scan           → Scan portals for new offers
/career-ops pdf            → Generate tailored CV
/career-ops batch          → Batch evaluate multiple offers
/career-ops tracker        → View application status
/career-ops pipeline       → Process pending URLs
/career-ops deep           → Deep company research
```

---

## How It Works

```
You paste a job URL or description
        │
        ▼
┌──────────────────┐
│  Archetype       │  Classifies role type automatically
│  Detection       │
└────────┬─────────┘
         │
┌────────▼─────────┐
│  Evaluation      │  Match, gaps, comp research, STAR stories
│  (reads cv.md)   │
└────────┬─────────┘
         │
    ┌────┼────┐
    ▼    ▼    ▼
 Report  PDF  Tracker
  .md   .pdf   DB
```

---

## Pre-configured Portals

45+ companies ready to scan across major job boards:

**AI Labs:** Anthropic, OpenAI, Mistral, Cohere, LangChain, Pinecone
**Voice AI:** ElevenLabs, PolyAI, Parloa, Hume AI, Deepgram, Vapi
**AI Platforms:** Retool, Airtable, Vercel, Temporal, Glean, Arize AI
**Contact Center:** Ada, LivePerson, Sierra, Decagon, Talkdesk, Genesys
**Enterprise:** Salesforce, Twilio, Gong, Dialpad
**Automation:** n8n, Zapier, Make.com

**Job boards searched:** Ashby, Greenhouse, Lever, Wellfound, Workable

---

## Project Structure

```
career-ops/
├── CLAUDE.md                    # Agent instructions
├── cv.md                        # Your CV (create this)
├── config/
│   └── profile.example.yml      # Template for your profile
├── modes/                       # Skill modes (evaluate, scan, pdf, batch…)
├── templates/
│   ├── portals.example.yml      # Scanner config template
│   └── states.yml               # Canonical statuses
├── data/                        # Your tracking data (gitignored)
├── reports/                     # Evaluation reports (gitignored)
└── output/                      # Generated PDFs (gitignored)
```

---

## Tech Stack

- **Agent:** Claude Code with custom skills and modes
- **Runtime:** Node.js 22+ (`node:sqlite` built-in)
- **PDF:** Puppeteer + styled HTML → A4 PDF
- **Scanner:** Playwright + Greenhouse API + WebSearch
- **GUI:** React 19 + TypeScript + Vite (Career Wizard Web)

---

## Disclaimer

Career Wizard is a local, open-source tool — not a hosted service. Your CV, contact info, and personal data stay on your machine and are sent directly to Anthropic's API. We do not collect or store any of your data.

Evaluations are recommendations, not guarantees. Always review AI-generated content before submitting an application. Use this tool in accordance with the Terms of Service of any career portals you interact with.

---

## License

MIT

---

**Career Wizard** · Janna AI Research Labs · an iRaven Group company
GitHub: [github.com/JudeIghomena](https://github.com/JudeIghomena)

---

© 2026 iRaven Group. All rights reserved. Career Wizard and Janna AI Research Labs are products of iRaven Group. Unauthorised reproduction or distribution of this software or its documentation is prohibited.
