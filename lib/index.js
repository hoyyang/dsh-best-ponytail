/**
 * dsh-best-ponytail — ponytail (github.com/DietrichGebert/ponytail, MIT) packaged as a
 * DeepSeek Harness bundle plugin.
 *
 * Upstream → DSH mapping (upstream files ship verbatim under ../upstream/, unmodified):
 *   skills/    (6 SKILL.md, also served from ../skills/) → ctx.skills provider:
 *              passive trigger via description matching + explicit "ponytail ..." invocation.
 *   commands/  (/ponytail toml) → /ponytail [lite|full|ultra|off|reset|status] host command,
 *              session-scoped level override, in-memory (resets on restart, zero residue).
 *   hooks/     (SessionStart hidden ruleset injection) → optional ctx.systemPrompt section,
 *              controlled by config `mode` (off|lite|full|ultra, default off: installing
 *              changes nothing until enabled).
 *   everything else (hooks/*.js, ponytail-mcp/, benchmarks/, docs/, examples/, assets/,
 *   tests/, AGENTS.md, README*, LICENSE, plugin manifests) → vendored under upstream/.
 *
 * This file is the only DSH-specific code. Uninstall is clean: nothing is written
 * outside the process.
 */
import { readFile, readdir } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import z from '@deepseek-ai/schemastery';

/** Cordis plugin name. */
export const name = 'dsh-best-ponytail';
/** skills is required (core function); systemPrompt/commands are defensively guarded in apply(). */
export const inject = ['skills', 'systemPrompt', 'commands'];
/** Runtime config: `mode` controls the ALWAYS-ON ruleset injection only (upstream hooks/
 *  SessionStart equivalent). Default off — skills and the /ponytail command work regardless. */
const MODE_CHOICES = ['off', 'lite', 'full', 'ultra'];
export const Config = z.object({
    // schemastery has no z.enum — union of consts is the equivalent shape.
    mode: z.union(MODE_CHOICES.map((m) => z.const(m))).default('off'),
});

const SKILLS_ROOT = fileURLToPath(new URL('../skills/', import.meta.url));
const UPSTREAM_RULESET = join(SKILLS_ROOT, 'ponytail', 'SKILL.md');
const PROVIDER_NAME = 'dsh-best-ponytail';
const SECTION_NAME = 'dsh-best-ponytail:ruleset';
/** persona(0) 之后、dsh-concise(40) 之右；早于尾部 reminder(900)。 */
const SECTION_ORDER = 41;
const LEVELS = ['lite', 'full', 'ultra', 'off'];
const LEVEL_LINE = {
    lite: 'Active level: lite — build what is asked, but name the lazier alternative in one line; the user picks.',
    full: 'Active level: full — the ladder is enforced: stdlib and native first, shortest working diff, shortest explanation.',
    ultra: 'Active level: ultra — YAGNI extremist: deletion before addition; ship the one-liner and challenge the rest of the requirement in the same breath.',
};

// ---------- minimal YAML frontmatter reader (enough for name/description/user-invocable) ----------
function parseFrontmatter(text) {
    const src = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
    if (!src.startsWith('---'))
        return { fm: {}, body: text };
    const end = src.indexOf('\n---', 3);
    if (end === -1)
        return { fm: {}, body: text };
    const fmText = src.slice(3, end);
    const body = src.slice(end + 4);
    const fm = {};
    const lines = fmText.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const m = lines[i].match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
        if (!m)
            continue;
        let value = m[2].trim();
        if (['>', '>-', '|', '|-'].includes(value)) {
            // YAML block scalar (description: > style) — fold the indented lines that follow.
            const parts = [];
            for (let j = i + 1; j < lines.length && /^\s+\S/.test(lines[j]); j++) {
                parts.push(lines[j].trim());
                i = j;
            }
            value = parts.join(' ');
        }
        else {
            value = value.replace(/^["']|["']$/g, '');
        }
        fm[m[1]] = value;
    }
    return { fm, body };
}

// ---------- data-driven skill discovery over the bundled skills/ tree ----------
async function collect(root) {
    const out = [];
    async function walk(dir) {
        let entries;
        try {
            entries = await readdir(dir, { withFileTypes: true });
        }
        catch {
            return;
        }
        for (const e of entries) {
            const p = join(dir, e.name);
            if (e.isDirectory())
                await walk(p);
            else if (e.name === 'SKILL.md') {
                const text = await readFile(p, 'utf8');
                const { fm, body } = parseFrontmatter(text);
                if (fm['name'])
                    out.push({ path: p, fm, body });
            }
        }
    }
    await walk(root);
    return out;
}

let candidatesCache = null;
async function buildCandidates() {
    if (!candidatesCache) {
        const found = await collect(SKILLS_ROOT);
        if (found.length === 0)
            throw new Error('[dsh-best-ponytail] no SKILL.md found under ' + SKILLS_ROOT + ' — bundled skills tree is broken');
        candidatesCache = found.map(({ path, fm }) => ({
            name: fm['name'],
            description: fm['description'] ?? '',
            invocation: {
                modelInvocable: true,
                userInvocable: true,
            },
            provider: PROVIDER_NAME,
            source: 'bundled',
            resourceBase: { kind: 'directory', path: dirname(path) },
            rank: 0,
            locator: pathToFileURL(path),
        }));
    }
    return candidatesCache;
}

const provider = {
    name: PROVIDER_NAME,
    list: () => buildCandidates(),
    async get(candidate) {
        const text = await readFile(candidate.locator, 'utf8');
        const { body } = parseFrontmatter(text);
        return {
            name: candidate.name,
            description: candidate.description,
            invocation: candidate.invocation,
            provider: candidate.provider,
            source: candidate.source,
            resourceBase: candidate.resourceBase,
            content: body,
        };
    },
};

/** Cordis apply. config.mode = always-on injection level (default off). */
export function apply(ctx, config = {}) {
    const log = ctx.logger ?? {};
    const configMode = config?.mode ?? 'off';
    if (!LEVELS.includes(configMode) && configMode !== 'off')
        throw new Error('[dsh-best-ponytail] invalid config mode: ' + JSON.stringify(configMode) + ' — expected off|lite|full|ultra');
    /** Session-level level overrides, in-memory only (zero residue by design). */
    const overrides = new Map();
    const sidOf = (source) => {
        const sid = source?.agent?.session?.id;
        return typeof sid === 'string' && sid.length > 0 && sid.length <= 512 ? sid : null;
    };
    const effectiveMode = (sid) => overrides.get(sid) ?? configMode;
    /** Upstream hooks/ponytail-instructions.js equivalent: the ponytail SKILL.md body
     *  (the ruleset itself) plus one active-level line. Read sync in apply — fail loud
     *  here, not silently inside prompt assembly. */
    let rulesetBody;
    try {
        rulesetBody = parseFrontmatter(readFileSync(UPSTREAM_RULESET, 'utf8')).body.trim();
    }
    catch (error) {
        throw new Error('[dsh-best-ponytail] ruleset unreadable at ' + UPSTREAM_RULESET + ': ' + String(error));
    }
    const rulesetFor = (level) => 'Ponytail ruleset (always-on injection; switch: /ponytail lite|full|ultra|off):\n\n'
        + LEVEL_LINE[level] + '\n\n' + rulesetBody;

    // 1) Skill provider — the six bundled ponytail skills.
    if (ctx.skills) {
        ctx.effect(() => ctx.skills.registerProvider(() => provider), 'dsh-best-ponytail: skill provider');
        buildCandidates()
            .then((list) => log.info?.('[dsh-best-ponytail] serving ' + list.length + ' skills: ' + list.map((c) => c.name).join(', ')))
            .catch((error) => log.warn?.('[dsh-best-ponytail] skill discovery failed: ' + String(error)));
    }
    else {
        log.warn?.('[dsh-best-ponytail] skills service missing — skill provider not registered');
    }

    // 2) Always-on ruleset section (upstream SessionStart hook equivalent). Registered
    //    unconditionally when the service exists; text returns '' when effectively off,
    //    which the renderer drops — so /ponytail <level> takes effect on the next turn
    //    without a reload.
    if (ctx.systemPrompt) {
        ctx.effect(() => ctx.systemPrompt.section({
            name: SECTION_NAME,
            order: SECTION_ORDER,
            text: (context) => {
                const level = effectiveMode(sidOf(context));
                return level === 'off' ? '' : rulesetFor(level);
            },
        }), 'dsh-best-ponytail: ruleset section');
    }
    else if (configMode !== 'off') {
        log.warn?.('[dsh-best-ponytail] systemPrompt service missing — always-on injection disabled (config mode=' + configMode + ')');
    }

    // 3) /ponytail command — upstream commands/ponytail.toml equivalent.
    if (ctx.commands) {
        ctx.effect(() => ctx.commands.register({
            name: 'ponytail',
            description: 'switch the ponytail always-on ruleset level for this session (lite|full|ultra|off)',
            input: { hint: '[lite|full|ultra|off|reset|status]', images: false },
            handler: (invocation) => {
                const sid = sidOf(invocation);
                const arg = String(invocation?.rawInput ?? '').trim().toLowerCase();
                const statusText = () => {
                    const eff = effectiveMode(sid);
                    const source = overrides.has(sid) ? 'session override' : 'config default';
                    return 'ponytail always-on injection: ' + eff.toUpperCase() + ' (' + source + ')'
                        + (eff === 'off' ? '' : ' — injected into the system prompt, effective next turn')
                        + '\nSkills (passive + explicit) are available regardless of this setting.'
                        + '\nSwitch: /ponytail lite|full|ultra|off · /ponytail reset (back to config default: ' + configMode + ')';
                };
                if (arg === '' || arg === 'status')
                    return { kind: 'success', text: statusText() };
                if (arg === 'reset') {
                    overrides.delete(sid);
                    return { kind: 'success', text: 'ponytail session override cleared — back to config default (' + configMode + ').\n' + statusText() };
                }
                if (!LEVELS.includes(arg))
                    return { kind: 'success', text: 'Unknown level "' + arg + '". Valid: lite | full | ultra | off | reset | status' };
                overrides.set(sid, arg);
                return {
                    kind: 'success',
                    text: arg === 'off'
                        ? 'ponytail always-on injection OFF for THIS session — skills stay available.\n' + statusText()
                        : 'ponytail always-on injection set to ' + arg.toUpperCase() + ' for THIS session — effective next turn.\n' + statusText(),
                };
            },
        }), 'dsh-best-ponytail: /ponytail command');
    }
    else {
        log.warn?.('[dsh-best-ponytail] commands service missing — /ponytail not registered');
    }

    log.info?.('[dsh-best-ponytail] ready (config mode=' + configMode + ')');
}
