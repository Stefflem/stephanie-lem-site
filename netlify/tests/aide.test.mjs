/** Le mode d'emploi ne sort que pour qui peut modifier le site. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { definirCoffreDebit } from '../lib/debit.mjs';

definirCoffreDebit(() => { const m = new Map(); return { get: async (k) => m.get(k) ?? null, set: async (k, v) => { m.set(k, v); } }; });

const mod = await import('../functions/aide.mjs');
const servir = mod.default;
const { CONTENU } = await import('../lib/aide-contenu.mjs');

let github = { ok: true, push: true };
globalThis.fetch = async () => ({ ok: github.ok, json: async () => ({ permissions: { push: github.push } }) });

const appeler = (jeton, methode = 'GET') =>
  servir(new Request('https://x.fr/api/aide', { method: methode, headers: jeton ? { authorization: `Bearer ${jeton}` } : {} }));

const BON = 'ghp_' + 'a'.repeat(30);

test('sans jeton, rien ne sort', async () => {
  const r = await appeler(null);
  assert.equal(r.status, 401);
  assert.equal((await r.text()).includes('Mode d'), false);
});

test('un jeton refusé par GitHub ne voit rien', async () => {
  github = { ok: false, push: false };
  assert.equal((await appeler(BON)).status, 401);
  github = { ok: true, push: false };
  assert.equal((await appeler(BON)).status, 401, 'lire le dépôt ne suffit pas, il faut pouvoir écrire');
});

test('Stéphanie connectée reçoit le mode d’emploi entier', async () => {
  github = { ok: true, push: true };
  const r = await appeler(BON);
  assert.equal(r.status, 200);
  const html = await r.text();
  assert.equal(html, CONTENU);
  assert.match(html, /Mode d'emploi de ton site/);
  assert.match(r.headers.get('x-robots-tag'), /noindex/);
  assert.equal(r.headers.get('cache-control'), 'no-store', 'jamais mis en cache par un intermédiaire');
});

test('seul GET est accepté', async () => {
  assert.equal((await appeler(BON, 'POST')).status, 405);
});

test('le contenu contient bien les sections attendues', () => {
  for (const s of ['Se connecter', 'Réponse courte', 'Tes messages et tes inscrites', 'Mesure d’audience'.replace('’', "'")]) {
    assert.ok(CONTENU.includes(s) || CONTENU.includes(s.replace("'", '’')), `section « ${s} »`);
  }
});
