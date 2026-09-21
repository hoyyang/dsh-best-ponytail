# dsh-ponytail

![banner](assets/banner.svg)

[Ponytail](https://github.com/DietrichGebert/ponytail) (MIT) packaged for DeepSeek Harness: your AI agent now thinks like the laziest senior dev in the room — **the best code is the code you never write**.

[**中文**](README.md) · [Releases](https://github.com/hoyyang/dsh-ponytail/releases) · [Changelog](CHANGELOG.md)

<p align="center">
  <img src="https://img.shields.io/badge/dsh-0.1.5%2B%20tested-2563eb" alt="dsh">
  <img src="https://img.shields.io/github/v/release/hoyyang/dsh-ponytail" alt="release">
  <img src="https://img.shields.io/github/stars/hoyyang/dsh-ponytail" alt="stars">
  <img src="https://img.shields.io/github/last-commit/hoyyang/dsh-ponytail" alt="last commit">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="license">
</p>

## Install

```sh
dsh plugin add hoyyang/dsh-ponytail
```

Zero config, zero behavior change on install: the always-on injection defaults to off, and all six skills are usable immediately. Tested on dsh 0.1.5. GitHub-only distribution (the npm name is taken by an unrelated package; the GitHub channel is fully functional).

## What you get

### Six skills (passive + explicit invocation)

- **ponytail** — the 7-rung ladder before any code: does it need to exist → already in the codebase → stdlib → native platform → installed dependency → one line → the minimum that works
- **ponytail-review** — over-engineering-only review: reinvented stdlib, needless dependencies, speculative abstractions, dead flexibility; one line per finding: where / what to cut / what replaces it
- **ponytail-audit** — whole-repo bloat audit: a ranked list of what to delete, simplify, or replace with stdlib; report only, no fixes applied
- **ponytail-debt** — harvests every `ponytail:` marker comment into a debt ledger, so "later" never silently becomes "never"
- **ponytail-gain** — the upstream benchmark scoreboard: less code, less cost, more speed (medians)
- **ponytail-help** — quick-reference card for all modes, skills, and commands

### One command, always in reach

- **/ponytail** — switch the always-on level per session (lite / full / ultra / off), effective next turn
- **/ponytail status** — current level and its source (config default or session override)
- **/ponytail reset** — clear the session override, back to config default

### Optional always-on injection (the upstream hook, translated)

- **systemPrompt section** — the ladder is welded into every turn's system prompt; 100% of coding happens under the rules, quick one-line edits included
- **four config levels** — off / lite / full / ultra; full is the level the upstream benchmark measured
- **session override** — `/ponytail off` silences it for this session only; restart falls back to config

### Packaging

- **upstream untouched** — all 193 upstream files (skills, hooks, benchmarks, docs, ...) vendored verbatim under upstream/, pinned to commit e3ba2aa
- **zero tools registered** — nothing enters the tools schema; uninstall leaves no residue
- **MIT with attribution** — upstream © DietrichGebert; the adapter layer is MIT too

## 30-second start

1. Run `dsh plugin add hoyyang/dsh-ponytail`
2. Configure nothing — six skills are already in the catalog
3. Verify: say "ponytail, build me a small X" — the reply should end with `skipped: X, add when Y`
4. Check the level: type `/ponytail status`
5. Want always-on: set `mode` to `full` in the profile config (see below)
6. Hunt over-engineering: say "audit this codebase"
7. Review debt: say "ponytail debt"
8. Silence for this session: `/ponytail off`
9. Back to default: `/ponytail reset`
10. Uninstall: `dsh plugin remove dsh-ponytail` — nothing left behind

## Use cases

- **Rapid prototyping** — "build me X" no longer returns five dependencies and three layers of abstraction
- **Legacy refactors** — review mode hunts only what can be deleted: reinvented stdlib, dead options, scaffolding for a future that never came
- **Review second pass** — beside correctness review, a dedicated complexity hunter, one line per finding
- **Debt inventory** — run the ledger periodically and turn "later" into a visible list
- **Team consistency** — everyone runs the same ruleset; output style stays uniform across agents
- **Cost & speed** — less code means fewer tokens and faster delivery; upstream measured -20% cost, -27% time
- **Learning taste** — watch the agent ask "does this need to exist" first; train your own trade-off instinct
- **Monorepo slimming** — the audit's ranked list doubles as a refactor backlog
- **Dependency hygiene** — ladder rung 5 forces the installed-dependency check before any new package
- **Model migration** — rules are model-agnostic; switch models without switching discipline

## Input / output

| You say / type | You get |
|---|---|
| `/ponytail status` | current level + source + how to switch |
| `/ponytail ultra` | YAGNI-extremist level for this session, next turn |
| "ponytail, add a cache" | the minimal ladder-passed implementation + one `skipped` line |
| "review for over-engineering" | one-line-per-finding deletion list |
| "audit this codebase" | ranked repo-wide bloat list, no fixes applied |
| "ponytail debt" | ledger of every `ponytail:` marker |
| "ponytail gain" | upstream benchmark scoreboard (-54% LOC / -20% cost / -27% time) |
| "stop ponytail" | natural style for this session |

## Advanced (config)

The always-on level lives in the profile config (default off):

```yaml
- id: dsh-ponytail
  config:
    mode: full   # off | lite | full | ultra
```

## How it works

A bundle plugin mapping upstream concepts onto DSH: `skills/` are served through a `ctx.skills` provider (passive trigger by description match); the upstream SessionStart hook's per-turn ruleset injection becomes a `ctx.systemPrompt` section controlled by `config.mode` with in-memory per-session overrides; the upstream `commands/ponytail.toml` level semantics become the `/ponytail` host command. Everything else is vendored verbatim for provenance.

## Reliability & verification

- **Smoke test** — the real `apply()` against a mock ctx: 6 skills registered, ladder body served, level state machine, unknown-level usage message (`npm test`)
- **Cold-start check** — boot-check six static classes (junction / bundle manifest / disabled conflicts / runtime imports / client id consistency / duplicate insert ids) all green
- **Lifecycle** — two measured inject/uninstall cycles: catalog appears/disappears live, junction removed, residue check PASS
- **Fail loud** — missing skill tree, unreadable ruleset, or invalid config throws with the failing path named; no silent fallbacks
- **Security** — no credentials, zero new tools, one dependency (schemastery ^3.18.0), no install scripts
- **Content fidelity** — 193 upstream files byte-identical, pinned commit, auditable
- **Compatibility** — tested on dsh 0.1.5 web profile; degrades with a warning on profiles missing services
- **Upgrade safety** — profile edits are backed up (.bak-timestamp) before writing
- **Clear attribution** — upstream MIT declared separately; adapter code is a single lib/index.js
- **Known limits** — gains concentrate where agents over-build; near zero on already-minimal code; the npm name is taken by an unrelated package, hence GitHub-only

## FAQ

**Why nothing changed after install?** — `mode` defaults to off: the skills are active (passive + explicit), the always-on injection needs opting in. Minimal surprise by design.

**Related to the npm package dsh-ponytail?** — No. That is an independent third-party implementation (ccll, 2026-08); this package skipped npm over the name clash and ships fully via GitHub.

**Does passive triggering miss?** — Sometimes; that is the physical ceiling of on-demand skill loading. Set `mode` to `full` for 100% coverage while coding.

**Are upstream benchmarks/tests really in the package?** — Yes, vendored under upstream/ as provenance reference; they do not run inside DSH.

## Build locally

```sh
npm install && npm run build && npm test   # pure JS, no transpilation: syntax check + smoke test
```

## License

MIT. Upstream [ponytail](https://github.com/DietrichGebert/ponytail) © DietrichGebert (MIT), unmodified — this package only adapts it for DSH; the adapter code is MIT too. See [LICENSE](LICENSE).
