# Career-Ops v2 — Windows Installation Manual

> **Access this guide anytime (no GitHub account needed):**
> `https://raw.githubusercontent.com/JudeIghomena/career-ops-v2/main/INSTALLATION-WINDOWS.md`
> Or visit: `https://github.com/JudeIghomena/career-ops-v2`

---

## Important: Windows Setup Approach

Career-Ops runs best on Windows using **WSL 2 (Windows Subsystem for Linux)** — Microsoft's built-in way to run a real Linux environment inside Windows. This gives you a proper terminal, full Node.js and Go support, and the same experience as macOS/Linux users.

**You do NOT need to be a developer to follow this guide.** Every step is explained in plain language.

---

## What You Need Before Starting

| Requirement | Why | Cost |
|---|---|---|
| Windows 10 (version 2004+) or Windows 11 | Required for WSL 2 | Free |
| Claude Pro account | Powers the AI engine | $20/mo (claude.ai) |
| 5 GB free disk space | For tools, browser, and project files | — |
| Internet connection | For downloads | — |

**To check your Windows version:** Press `Win + R`, type `winver`, press Enter.

---

## Part 1 — Enable WSL 2 (Windows Subsystem for Linux)

### 1.1 Open PowerShell as Administrator

1. Press the **Windows key**
2. Type `PowerShell`
3. Right-click **Windows PowerShell**
4. Click **"Run as administrator"**
5. Click **Yes** when prompted

### 1.2 Install WSL 2

In the PowerShell window, paste this command and press Enter:

```powershell
wsl --install
```

This automatically:
- Enables WSL
- Installs WSL 2
- Installs Ubuntu (the Linux distribution you'll use)

**This may take 5–10 minutes.** Let it finish completely.

### 1.3 Restart your computer

When the installation finishes, you will be prompted to restart. **Restart now.**

### 1.4 Complete Ubuntu setup

After restarting, Ubuntu will open automatically and ask you to:
1. Create a **username** — use something simple, no spaces (e.g. `jude`)
2. Create a **password** — you will need this later when commands ask for `sudo`

> **Note:** When typing your password, nothing appears on screen — this is normal. Just type it and press Enter.

### 1.5 Verify WSL is working

In the Ubuntu terminal that is now open, type:

```bash
lsb_release -a
```

You should see Ubuntu version information. If yes, WSL is working.

---

## Part 2 — Install Windows Terminal (Recommended)

Windows Terminal gives you a much better experience than the default Ubuntu window.

1. Open the **Microsoft Store** (search for it in the Start menu)
2. Search for **"Windows Terminal"**
3. Click **Install**
4. After installing, open Windows Terminal
5. Click the **dropdown arrow** (▾) next to the `+` tab button
6. Select **Ubuntu** to open a Linux terminal

> From here on, all commands are typed in the **Ubuntu** terminal inside Windows Terminal.

---

## Part 3 — Install the Prerequisites

Open your **Ubuntu terminal** and run each command below. After each one, wait for it to finish before running the next.

### 3.1 Update Ubuntu packages

```bash
sudo apt-get update && sudo apt-get upgrade -y
```

Enter your Ubuntu password when prompted. This may take a few minutes.

### 3.2 Install build tools (required for some npm packages)

```bash
sudo apt-get install -y build-essential python3 python3-pip curl git unzip
```

### 3.3 Install Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Verify it worked:**
```bash
node --version   # should show v20.x.x
npm --version    # should show 10.x.x
```

### 3.4 Install Go (for the visual dashboard — optional but recommended)

```bash
sudo apt-get install -y golang-go
```

**Verify it worked:**
```bash
go version   # should show go1.21.x or higher
```

> If the version is older than 1.21, install a newer version:
> ```bash
> wget https://go.dev/dl/go1.22.0.linux-amd64.tar.gz
> sudo rm -rf /usr/local/go
> sudo tar -C /usr/local -xzf go1.22.0.linux-amd64.tar.gz
> echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
> source ~/.bashrc
> go version
> ```

### 3.5 Install Claude Code CLI

```bash
npm install -g @anthropic-ai/claude-code
```

**Verify it worked:**
```bash
claude --version
```

If you see `command not found`, run:
```bash
echo 'export PATH=$PATH:$(npm root -g)/../bin' >> ~/.bashrc
source ~/.bashrc
claude --version
```

---

## Part 4 — Download Career-Ops

### Option A — Download as a ZIP (no Git needed)

```bash
cd ~
curl -L https://github.com/JudeIghomena/career-ops-v2/archive/refs/heads/main.zip -o career-ops.zip
unzip career-ops.zip
mv career-ops-v2-main career-ops
cd career-ops
```

### Option B — Clone with Git (recommended for updates)

```bash
cd ~
git clone https://github.com/JudeIghomena/career-ops-v2.git career-ops
cd career-ops
```

**Confirm you are in the right folder:**
```bash
pwd
```
You should see something like `/home/jude/career-ops`.

---

## Part 5 — Set Up Career-Ops

Make sure you are inside the career-ops folder:
```bash
cd ~/career-ops
```

### 5.1 Install Node.js dependencies

```bash
npm install
```

This may take 1–3 minutes. You will see packages downloading. Wait for it to finish completely.

**If you see errors about `better-sqlite3` or `node-gyp`:**
```bash
sudo apt-get install -y build-essential python3
npm install
```

### 5.2 Install Playwright browser

Playwright needs Chromium to generate PDFs and verify job listings:

```bash
npx playwright install chromium
npx playwright install-deps chromium
```

The second command installs system dependencies Chromium needs on Linux. Enter your Ubuntu password if asked.

### 5.3 Initialise the database

```bash
npm run db:init
```

**Expected output:**
```
✅ career-ops database ready: data/pipeline.db
   Tables: applications, scan_history, story_bank, batch_jobs
```

---

## Part 6 — Connect to Claude

### 6.1 Set up a browser for Claude Code login

Claude Code opens a browser window for authentication. On WSL, you need a Windows browser configured. Run:

```bash
claude
```

If it opens a browser automatically — great, skip to step 6.2.

If it shows a URL instead of opening a browser, copy that URL and paste it into your **Windows browser** (Edge, Chrome, Firefox). Complete the login there, then return to the terminal.

### 6.2 Log in with your Claude Pro account

Log in using the **same email/Google account you use for claude.ai**. After logging in, return to the terminal — you will see the Claude Code prompt (`>`).

> **If you have an Anthropic API key instead:**
> ```bash
> echo 'export ANTHROPIC_API_KEY=sk-ant-your-key-here' >> ~/.bashrc
> source ~/.bashrc
> ```

---

## Part 7 — First Run: Onboarding

You should now be inside Claude Code (you see a `>` prompt). Type:

```
Set me up
```

Claude walks you through 4 steps:

### Step 1 — Your CV
Choose how to provide your CV:
- **Paste it** directly into the chat
- **Share your LinkedIn URL** — Claude extracts the info
- **Describe your experience** — Claude drafts it for you

A `cv.md` file is created automatically.

### Step 2 — Your Profile
Claude creates `config/profile.yml` and asks for:
- Your name and email
- Target roles (e.g. "Senior AI Engineer", "Product Manager")
- Salary target and currency
- Location and remote preference

### Step 3 — Job Portals
Claude sets up `portals.yml` with 45+ pre-configured companies. It customises the search keywords for your target roles.

### Step 4 — Ready
Setup is complete. You can now start evaluating jobs.

---

## Part 8 — Using Career-Ops

### Evaluate a job (the main workflow)

Inside Claude Code, paste any job URL:
```
https://jobs.lever.co/company/some-role
```

Claude automatically:
1. Reads and evaluates the job description
2. Scores it 1–5 across 6 dimensions
3. Saves a full report to `reports/`
4. Generates a tailored PDF CV to `output/`
5. Adds it to your tracker

### All available commands

| Command | What it does |
|---|---|
| `/career-ops evaluate` | Evaluate a single job offer |
| `/career-ops compare` | Compare multiple offers side by side |
| `/career-ops scan` | Scan all portals for new listings |
| `/career-ops tracker` | View your application pipeline |
| `/career-ops outreach` | Draft a LinkedIn message |
| `/career-ops pdf` | Generate an ATS-optimised CV |
| `/career-ops interview-prep` | Prepare STAR interview stories |
| `/career-ops batch` | Bulk-process multiple offers |
| `/career-ops pipeline` | Process your pending URL inbox |
| `/career-ops deep` | Deep research on a company |

### To quit Claude Code
Press `Ctrl + C` or type `exit`.

### To reopen Career-Ops later
```bash
cd ~/career-ops
claude
```

---

## Part 9 — The Visual Dashboard (Optional)

### Run the dashboard

```bash
cd ~/career-ops/dashboard
go run . --path ~/career-ops
```

First run compiles and downloads Go dependencies (~30 seconds). Subsequent runs are instant.

### Dashboard keyboard shortcuts

| Key | Action |
|---|---|
| `↑` `↓` | Navigate through offers |
| `←` `→` | Switch tabs (All / Evaluated / Applied…) |
| `s` | Toggle sort: score → date → company |
| `Enter` | View the full evaluation report |
| `o` | Open the original job URL in browser |
| `Esc` | Quit |

---

## Part 10 — Accessing Your Files from Windows

Your career-ops files live inside WSL (Linux), but you can access them from Windows Explorer:

1. Open **Windows Explorer**
2. In the address bar, type: `\\wsl$\Ubuntu\home\YOUR-USERNAME\career-ops`
3. Press Enter

You can open, copy, and move files normally from here — useful for opening generated PDFs in your PDF viewer.

**Or from WSL, open a folder in Windows Explorer:**
```bash
explorer.exe .
```

---

## Part 11 — Useful npm Scripts

Run these from the `~/career-ops` folder in your Ubuntu terminal:

| Command | What it does |
|---|---|
| `npm run db:init` | Create the database (run once) |
| `npm run db:migrate` | Import existing data into the database |
| `npm run merge` | Merge pending tracker additions |
| `npm run normalize` | Fix non-standard status labels |
| `npm run dedup` | Remove duplicate entries |
| `npm run batch:run` | Run the batch processor |
| `npm run batch:dry` | Preview batch jobs without running |
| `npm run batch:retry` | Retry failed batch jobs |
| `npm run doctor` | Diagnose common setup issues |
| `npm run verify` | Verify pipeline integrity |

---

## Part 12 — Troubleshooting

### `claude: command not found`
```bash
npm install -g @anthropic-ai/claude-code
echo 'export PATH=$PATH:$(npm root -g)/../bin' >> ~/.bashrc
source ~/.bashrc
```

### `npm install` fails with `node-gyp` errors
```bash
sudo apt-get install -y build-essential python3
npm install
```

### `go: command not found`
```bash
sudo apt-get install -y golang-go
source ~/.bashrc
```

### `Error: could not find applications.md`
```bash
mkdir -p ~/career-ops/data
echo "# Applications Tracker

| # | Date | Company | Role | Score | Status | PDF | Report | Notes |
|---|------|---------|------|-------|--------|-----|--------|-------|" > ~/career-ops/data/applications.md
```

### Playwright browser fails to launch
```bash
npx playwright install chromium
npx playwright install-deps chromium
sudo apt-get install -y libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2
```

### WSL browser doesn't open for Claude login
Copy the URL printed in the terminal and paste it manually into your Windows browser (Chrome, Edge, Firefox). Complete login there.

### Can't find files in Windows Explorer
Make sure you are typing the correct path: `\\wsl$\Ubuntu\home\YOUR-USERNAME\career-ops`
Replace `YOUR-USERNAME` with the username you created in Step 1.4.

### WSL is slow on first run
This is normal — WSL starts up fresh when you open a terminal. After the first command, it is fast. You can keep the Ubuntu terminal open to avoid the startup delay.

---

## Part 13 — Updating Career-Ops

### If you cloned with Git:
```bash
cd ~/career-ops
git pull origin main
npm install
npm run db:migrate
```

### If you downloaded a ZIP:
Re-download and unzip, then replace the system files. Your personal data (`cv.md`, `config/profile.yml`, `data/`, `reports/`) is never overwritten.

---

## Quick Start Checklist (Windows)

```
[ ] Windows 10 (2004+) or Windows 11 confirmed
[ ] Ran: wsl --install  (in PowerShell as Administrator)
[ ] Restarted computer
[ ] Created Ubuntu username and password
[ ] Installed Windows Terminal (from Microsoft Store)
[ ] Ran: sudo apt-get update && sudo apt-get upgrade -y
[ ] Ran: sudo apt-get install -y build-essential python3 curl git unzip
[ ] Installed Node.js  (node --version shows v20+)
[ ] Installed Go       (go version — optional, for dashboard)
[ ] Installed Claude Code  (claude --version works)
[ ] Downloaded career-ops  (ZIP or git clone into ~/career-ops)
[ ] Ran: npm install
[ ] Ran: npx playwright install chromium
[ ] Ran: npx playwright install-deps chromium
[ ] Ran: npm run db:init
[ ] Ran: claude  (logged in with Claude Pro account)
[ ] Typed: "Set me up"  (onboarding wizard completed)
[ ] Pasted first job URL to evaluate
[ ] Ran dashboard: cd ~/career-ops/dashboard && go run . --path ~/career-ops
```

---

## Support

- **This fork:** https://github.com/JudeIghomena/career-ops-v2
- **Original project:** https://github.com/santifer/career-ops
- **Claude Code docs:** https://docs.anthropic.com/claude-code
- **WSL docs:** https://docs.microsoft.com/en-us/windows/wsl/install
- **Windows Terminal:** https://aka.ms/terminal

---

*Career-Ops v2.0 — re-engineered fork by Jude Ighomena*
*Original system by Santiago Fernández de Valderrama (santifer.io) — MIT License*
