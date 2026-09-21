/**
 * dsh-best-ponytail smoke test — runs the real lib/index.js apply() against a mock ctx.
 * Asserts: provider lists 6 skills, skill body serves the ladder, section injection
 * honors config mode + session overrides, /ponytail command state machine works.
 * Zero cost, no host, no network.
 */
import assert from 'node:assert/strict';
import { apply, name, Config } from '../lib/index.js';

const reg = { providers: [], sections: [], commands: [] };
const ctx = {
    logger: { info: () => {}, warn: (m) => { throw new Error('unexpected warn: ' + m); } },
    effect: (fn, label) => fn(),
    skills: { registerProvider: (factory) => reg.providers.push({ factory, label: undefined, p: factory() }) },
    systemPrompt: { section: (s) => reg.sections.push(s) },
    commands: { register: (c) => reg.commands.push(c) },
};

assert.equal(name, 'dsh-best-ponytail');
const resolved = Config({ mode: 'off' });
apply(ctx, resolved);

// 1) provider: 6 skills, expected names
assert.equal(reg.providers.length, 1, 'one skill provider');
const provider = reg.providers[0].p;
const list = await provider.list();
assert.equal(list.length, 6, 'six bundled skills, got: ' + list.map((c) => c.name).join(','));
for (const expect of ['ponytail', 'ponytail-review', 'ponytail-audit', 'ponytail-debt', 'ponytail-gain', 'ponytail-help'])
    assert.ok(list.some((c) => c.name === expect), 'missing skill ' + expect);
const main = await provider.get(list.find((c) => c.name === 'ponytail'));
assert.ok(main.content.includes('The ladder'), 'ponytail body serves the ladder');
assert.ok(list.every((c) => c.provider === 'dsh-best-ponytail' && c.description.length > 10), 'candidates well-formed');

// 2) section registered even in off mode; empty text when off
assert.equal(reg.sections.length, 1);
const section = reg.sections[0];
assert.equal(section.name, 'dsh-best-ponytail:ruleset');
const sid = (id) => ({ agent: { session: { id } } });
assert.equal(section.text(sid('s1')), '', 'off mode injects nothing');

// 3) /ponytail command: full → section injects ladder + level line; off → empty; reset → config default
const cmd = reg.commands.find((c) => c.name === 'ponytail');
assert.ok(cmd, '/ponytail registered');
cmd.handler({ rawInput: 'full', agent: { session: { id: 's1' } } });
const fullText = section.text(sid('s1'));
assert.ok(fullText.includes('Active level: full'), 'full level line injected');
assert.ok(fullText.includes('The ladder'), 'ruleset body injected');
cmd.handler({ rawInput: 'ultra', agent: { session: { id: 's2' } } });
assert.ok(section.text(sid('s2')).includes('Active level: ultra'), 's2 override independent');
assert.equal(section.text(sid('s3')), '', 'other sessions unaffected by s1 override');
cmd.handler({ rawInput: 'off', agent: { session: { id: 's1' } } });
assert.equal(section.text(sid('s1')), '', 'off override empties injection');
const status = cmd.handler({ rawInput: 'status', agent: { session: { id: 's1' } } });
assert.ok(status.text.includes('OFF') && status.text.includes('session override'), 'status reflects override');
cmd.handler({ rawInput: 'reset', agent: { session: { id: 's1' } } });
assert.equal(section.text(sid('s1')), '', 'reset returns to config default (off)');
const bad = cmd.handler({ rawInput: 'nonsense', agent: { session: { id: 's1' } } });
assert.ok(bad.text.includes('Valid:'), 'unknown level fails loud with usage');

console.log('dsh-best-ponytail smoke test PASS (6 skills, section + command state machine verified)');
