# Contributing to Career Wizard

Thanks for your interest in contributing to Career Wizard — a Janna AI Research Labs product by iRaven Group.

## Before Submitting a PR

**Please open an issue first to discuss the change you'd like to make.** This helps us align on direction before you invest time coding.

PRs without a corresponding issue may be closed if they don't align with the project's architecture or goals.

### What makes a good PR
- Fixes a bug listed in Issues
- Addresses a feature request that was discussed and approved
- Includes a clear description of what changed and why
- Follows the existing code style and project philosophy (simple, minimal, quality over quantity)

## Quick Start

1. Open an issue to discuss your idea
2. Fork the repo
3. Create a branch (`git checkout -b feature/my-feature`)
4. Make your changes
5. Test with a fresh clone
6. Commit and push
7. Open a Pull Request referencing the issue

## What to Contribute

**Good first contributions:**
- Add companies to `templates/portals.example.yml`
- Improve documentation
- Add example CVs for different roles (in `examples/`)
- Report bugs via [Issues](https://github.com/JudeIghomena/career-ops/issues)

**Bigger contributions:**
- New evaluation dimensions or scoring logic
- New skill modes (in `modes/`)
- Script improvements (`.mjs` utilities)

## Guidelines

- Keep modes language-agnostic when possible (Claude handles translation)
- Scripts should handle missing files gracefully (check `existsSync` before `readFileSync`)
- Don't commit personal data (cv.md, profile.yml, reports/)

## What We Do NOT Accept

- **PRs that scrape platforms prohibiting automated access** (LinkedIn, etc.). We actively reject these to respect third-party ToS.
- **PRs that enable auto-submitting applications** without human review. Career Wizard is a decision-support tool, not a spam bot.
- **PRs that add external API dependencies** without prior discussion in an issue.
- **PRs containing personal data** (real CVs, emails, phone numbers). Use `examples/` with fictional data instead.

## Development

```bash
# Scripts
npm run doctor                # Setup validation
node verify-pipeline.mjs      # Health check
```

## Need Help?

- [Open an issue](https://github.com/JudeIghomena/career-ops/issues)

---

© 2026 iRaven Group. All rights reserved.
