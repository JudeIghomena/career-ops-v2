# Career-Ops v2 — Full Installation Manual

> **Access this guide anytime (no GitHub account needed):**
> `https://raw.githubusercontent.com/JudeIghomena/career-ops-v2/main/INSTALLATION.md`
> Or visit: `https://github.com/JudeIghomena/career-ops-v2`

---

## What is Career-Ops?

Career-Ops is an AI-powered job search pipeline that runs inside **Claude Code** — Anthropic's AI coding CLI. It turns Claude into a personal career agent that:

- Evaluates job offers with a structured scoring system (1–5)
- Generates ATS-optimised CVs tailored to each role
- Scans 45+ job portals and tracks new listings incrementally
- Manages your full application pipeline with a terminal dashboard
- Builds a reusable STAR+R interview story bank over time

**No server. No subscription beyond Claude. Everything runs locally on your machine.**

---

## What You Need Before Starting

| Requirement | Why | Cost |
|---|---|---|
| macOS, Linux, or Windows (WSL) | Runs locally on your machine | Free |
| Claude Pro account | Powers the AI engine | $20/mo (claude.ai) |
| Node.js 18+ | Runs the scripts | Free |
| npm 9+ | Installs packages | Free (comes with Node.js) |
| Go 1.21+ | Runs the visual dashboard | Free (optional) |
| Homebrew (macOS only) | Easiest way to install tools | Free |

---

## Part 1 — Install the Prerequisites

### 1.1 Install Homebrew (macOS only)

Open your **Terminal** (press `Cmd + Space`, type `Terminal`, press Enter) and run:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Wait for it to finish, then run:

```bash
brew --version
```

You should see something like `Homebrew 4.x.x`. If yes, move to the next step.

---

### 1.2 Install Node.js and npm

**macOS:**
```bash
brew install node
```

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Windows (WSL):**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Verify it worked:**
```bash
node --version   # should show v18.x.x or higher
npm --version    # should show 9.x.x or higher
```

---

### 1.3 Install Go (for the visual dashboard — optional but recommended)

**macOS:**
```bash
brew install go
```

**Linux:**
```bash
sudo apt-get install -y golang-go
```

**Windows (WSL):**
```bash
sudo apt-get install -y golang-go
```

**Verify it worked:**
```bash
go version   # should show go1.21.x or higher
```

> **Note:** Go is only needed for the terminal dashboard UI. Career-Ops works fully without it.

---

### 1.4 Install Claude Code CLI

This is the main tool that runs Career-Ops. Install it globally with npm:

```bash
npm install -g @anthropic-ai/claude-code
```

**Verify it worked:**
```bash
claude --version
```

You should see a version number. If you see `command not found`, close your terminal, reopen it, and try again.

---

## Part 2 — Download Career-Ops

You have two options — choose the one that suits you:

### Option A — Download as a ZIP (easiest, no Git needed)

1. Go to: **https://github.com/JudeIghomena/career-ops-v2**
2. Click the green **"Code"** button
3. Click **"Download ZIP"**
4. Unzip it into your preferred folder, e.g. your home folder
5. Rename the folder from `career-ops-v2-main` to `career-ops`

Then open Terminal and navigate to it:
```bash
cd ~/career-ops
```

### Option B — Clone with Git (recommended for staying up to date)

If you have Git installed:
```bash
git clone https://github.com/JudeIghomena/career-ops-v2.git ~/career-ops
cd ~/career-ops
```

**Check if Git is installed:**
```bash
git --version
```

If not installed: `brew install git` (macOS) or `sudo apt-get install git` (Linux).

---

## Part 3 — Set Up Career-Ops

All commands below are run from inside the career-ops folder. Make sure you are there:

```bash
cd ~/career-ops
```

### 3.1 Install dependencies

```bash
npm install
```

This installs Playwright (for browser automation and PDF generation) and better-sqlite3 (for the database). It may take 1–2 minutes on the first run.

**Expected output:** You should see packages downloading and a success message. No red errors.

---

### 3.2 Install Playwright browsers

Playwright needs a Chromium browser to generate PDFs and verify job listings:

```bash
npx playwright install chromium
```

This downloads a ~150MB browser. Only needed once.

---

### 3.3 Initialise the database

```bash
npm run db:init
```

This creates `data/pipeline.db` — the SQLite database that stores your applications, scan history, and story bank.

**Expected output:**
```
✅ career-ops database ready: data/pipeline.db
   Tables: applications, scan_history, story_bank, batch_jobs
```

---

## Part 4 — Connect to Claude

### 4.1 Log in with your Claude Pro account

```bash
claude
```

On first run, Claude Code opens a browser window automatically. Log in with the **same email/Google account you use for claude.ai Pro**.

After logging in, you will be returned to the terminal and see the Claude Code prompt.

> **Note:** If you have an Anthropic API key instead of Claude Pro, you can set it manually:
> ```bash
> export ANTHROPIC_API_KEY=sk-ant-your-key-here
> ```
> Or add it to your shell profile (`~/.zshrc` or `~/.bashrc`).

---

## Part 5 — First Run: Onboarding

Once you are inside Claude Code (you will see a `>` prompt), the system automatically detects it is a fresh install and enters **onboarding mode**.

Simply type:

```
Set me up
```

Claude will guide you through 4 steps:

---

### Step 1 — Your CV

Claude will ask you to:
- **Option A:** Paste your CV text directly into the chat
- **Option B:** Share your LinkedIn profile URL (Claude extracts the info)
- **Option C:** Tell Claude about your experience and it drafts a CV for you

A `cv.md` file is created in your project folder. This is your CV source of truth — Claude reads it for every evaluation.

---

### Step 2 — Your Profile

Claude creates `config/profile.yml` and asks for:
- Full name and email
- Your target roles (e.g. "Senior AI Engineer", "Staff ML Engineer")
- Salary target range and currency
- Location and timezone

This configures the scoring system to evaluate roles against YOUR criteria.

---

### Step 3 — Job Portals

Claude sets up `portals.yml` — a pre-configured list of 45+ companies and job board queries. It will ask if you want to customise the search keywords for your target roles.

---

### Step 4 — Ready

Claude confirms setup is complete and shows you what you can do next. You are ready to go.

---

## Part 6 — Using Career-Ops

### Evaluate a job offer

The simplest way — just paste a job URL into Claude Code:

```
https://jobs.lever.co/anthropic/some-role
```

Claude automatically runs the full pipeline:
1. Fetches and reads the job description
2. Evaluates it across 6 dimensions (score 1–5)
3. Saves a full report to `reports/`
4. Generates a tailored PDF CV to `output/`
5. Adds it to your tracker

---

### Available commands

| Command | What it does |
|---|---|
| `/career-ops evaluate` | Evaluate a single job offer |
| `/career-ops compare` | Compare and rank multiple offers side by side |
| `/career-ops scan` | Scan all configured portals for new listings |
| `/career-ops tracker` | View your full application pipeline |
| `/career-ops outreach` | Draft a LinkedIn message for a specific company |
| `/career-ops pdf` | Generate an ATS-optimised CV for a role |
| `/career-ops interview-prep` | Prepare STAR stories for a specific company |
| `/career-ops pipeline` | Process all pending URLs in your inbox |
| `/career-ops batch` | Bulk-evaluate multiple offers at once |
| `/career-ops deep` | Deep research on a specific company |

> **Tip:** Spanish aliases also work — `oferta`, `ofertas`, `contacto` route to the same commands.

---

### Useful npm scripts (run from terminal, not Claude Code)

| Command | What it does |
|---|---|
| `npm run db:init` | Initialise the database (run once) |
| `npm run db:migrate` | Import existing data into the database |
| `npm run merge` | Merge pending tracker additions |
| `npm run normalize` | Fix any non-standard status labels |
| `npm run dedup` | Remove duplicate tracker entries |
| `npm run batch:run` | Run the batch processor |
| `npm run batch:dry` | Preview batch jobs without running |
| `npm run batch:retry` | Retry failed batch jobs |
| `npm run doctor` | Diagnose common setup issues |
| `npm run verify` | Verify pipeline integrity |

---

## Part 7 — The Visual Dashboard (Optional)

The dashboard gives you a terminal UI showing your full pipeline.

### 7.1 Run the dashboard

```bash
cd ~/career-ops/dashboard
go run . --path ~/career-ops
```

First run downloads Go dependencies (~30 seconds). Subsequent runs are instant.

### 7.2 Dashboard keyboard shortcuts

| Key | Action |
|---|---|
| `↑` `↓` | Navigate through offers |
| `←` `→` | Switch filter tabs (All / Evaluated / Applied / Interview…) |
| `s` | Toggle sort: score → date → company |
| `Enter` | View the full evaluation report |
| `o` | Open the original job URL in your browser |
| `v` | Switch between list and grouped view |
| `Esc` | Quit the dashboard |

---

## Part 8 — Folder Structure Reference

After setup, your project looks like this:

```
career-ops/
├── cv.md                     ← Your CV (you create this)
├── article-digest.md         ← Optional: proof points and case studies
├── portals.yml               ← Job portals config (you create from template)
├── config/
│   └── profile.yml           ← Your personal profile (you create from example)
├── modes/                    ← AI instruction files (system layer — do not edit)
├── data/
│   ├── pipeline.db           ← SQLite database (auto-created)
│   ├── applications.md       ← Application tracker table
│   ├── pipeline.md           ← Pending job URLs inbox
│   └── scan-history.tsv      ← Scan cache fallback
├── reports/                  ← Evaluation reports (.md + .json per offer)
├── output/                   ← Generated PDF CVs
├── interview-prep/
│   └── story-bank.md         ← Accumulated STAR+R stories
├── scripts/                  ← Orchestration scripts (db-init, db-migrate, batch)
├── dashboard/                ← Go terminal UI source
└── templates/                ← CV HTML template and portal example config
```

**Files you own (never overwritten by updates):**
`cv.md`, `config/profile.yml`, `modes/_profile.md`, `portals.yml`, `article-digest.md`, everything in `data/`, `reports/`, `output/`, `interview-prep/`

**System files (auto-updatable):**
Everything in `modes/`, `scripts/`, `templates/`, `dashboard/`, root `.mjs` files

---

## Part 9 — Troubleshooting

### `claude: command not found`
Claude Code is not installed or not in your PATH. Run:
```bash
npm install -g @anthropic-ai/claude-code
```
Then close and reopen your terminal.

### `go: command not found`
Go is not installed. Run `brew install go` (macOS) or `sudo apt-get install golang-go` (Linux). The dashboard is optional — career-ops works without it.

### `Error: could not find applications.md`
The database file is missing. Run:
```bash
echo "# Applications Tracker

| # | Date | Company | Role | Score | Status | PDF | Report | Notes |
|---|------|---------|------|-------|--------|-----|--------|-------|" > ~/career-ops/data/applications.md
```

### `npm install` fails with node-gyp errors
better-sqlite3 requires native compilation. Install build tools:
- **macOS:** `xcode-select --install`
- **Linux:** `sudo apt-get install -y build-essential python3`

Then run `npm install` again.

### Playwright can't launch browser
```bash
npx playwright install chromium
npx playwright install-deps chromium
```

### PDF generation fails
Make sure Playwright is installed and Chromium is downloaded (see above). Then:
```bash
npm run doctor
```
This runs a full diagnostic and tells you what is missing.

---

## Part 10 — Updating Career-Ops

### If you cloned with Git:
```bash
cd ~/career-ops
git pull origin main
npm install          # picks up any new dependencies
npm run db:migrate   # safe to re-run, adds new columns if any
```

### If you downloaded a ZIP:
Re-download from `https://github.com/JudeIghomena/career-ops-v2` and replace the system files. Your personal data (`cv.md`, `config/profile.yml`, `data/`, `reports/`) is safe — these are never in the system layer.

---

## Quick Start Checklist

Copy this and tick off as you go:

```
[ ] Installed Node.js (node --version shows v18+)
[ ] Installed npm (npm --version shows 9+)
[ ] Installed Go (go version — optional, for dashboard)
[ ] Installed Claude Code (claude --version)
[ ] Downloaded career-ops (ZIP or git clone)
[ ] Ran: npm install
[ ] Ran: npx playwright install chromium
[ ] Ran: npm run db:init
[ ] Logged in: claude  (browser auth with Claude Pro account)
[ ] Typed: "Set me up"  (onboarding wizard)
[ ] Pasted first job URL to evaluate
[ ] Ran dashboard: cd dashboard && go run . --path ~/career-ops
```

---

## Support

- **Original project:** https://github.com/santifer/career-ops
- **This fork:** https://github.com/JudeIghomena/career-ops-v2
- **Claude Code docs:** https://docs.anthropic.com/claude-code
- **Playwright docs:** https://playwright.dev

---

*Career-Ops v2.0 — re-engineered fork by Jude Ighomena*
*Original system by Santiago Fernández de Valderrama (santifer.io) — MIT License*
