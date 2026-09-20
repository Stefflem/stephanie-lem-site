/** Vérifie que la livraison ne s'ouvre que dans le seul cas prévu. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { writeFile, mkdir, rm } from 'node:fs/promises';

process.env.SIGNATURE_SECRET = 'secret-de-test-tres-long-0123456789';
process.env.STRIPE_SECRET_KEY = 'sk_test_bidon';
process.env.STRIPE_PRICE_SOCLE = 'price_SOCLE';

const acces = (await import('../functions/acces.mjs')).default;
const { signer } = await import('../functions/acces.mjs');
const telecharger = (await import('../functions/telecharger.mjs')).default;

const appel = (fn, qs) => fn(new Request('https://x.fr/api?' + qs));
const vraiFetch = globalThis.fetch;
const simuleStripe = (corps, ok = true) => { globalThis.fetch = async () => ({ ok, json: async () => corps }); };
const SESSION = 'cs_test_' + 'a'.repeat(24);

test('session mal formée : refus', async () => {
  const r = await appel(acces, 'session_id=../../etc/passwd');
  assert.equal(r.status, 403);
});

test('paiement non confirmé : refus', async () => {
  simuleStripe({ payment_status: 'unpaid' });
  const r = await appel(acces, 'session_id=' + SESSION);
  assert.equal(r.status, 403);
});

test('payé mais pas ce produit : refus', async () => {
  simuleStripe({ payment_status: 'paid', line_items: { data: [{ price: { id: 'price_AUTRE' } }] } });
  const r = await appel(acces, 'session_id=' + SESSION);
  assert.equal(r.status, 403);
  assert.match((await r.json()).message, /ne correspond pas/);
});

test('payé pour Le Socle : liens signés délivrés', async () => {
  simuleStripe({ payment_status: 'paid', line_items: { data: [{ price: { id: 'price_SOCLE' } }] } });
  const r = await appel(acces, 'session_id=' + SESSION);
  assert.equal(r.status, 200);
  const d = await r.json();
  assert.equal(d.items.length, 4);
  assert.ok(d.items.every((i) => /^\/api\/telecharger\?f=[a-z-]+&e=\d+&s=[0-9a-f]{64}$/.test(i.lien)));
  assert.ok(d.expire > Date.now());
});

test('configuration incomplète : ne livre pas', async () => {
  const garde = process.env.STRIPE_PRICE_SOCLE;
  delete process.env.STRIPE_PRICE_SOCLE;
  const r = await appel(acces, 'session_id=' + SESSION);
  assert.equal(r.status, 503);
  process.env.STRIPE_PRICE_SOCLE = garde;
});

test('téléchargement : clé inconnue, traversée de chemin, refus', async () => {
  for (const f of ['inconnu', '../../etc/passwd', '../netlify.toml']) {
    const e = Date.now() + 1000;
    const r = await appel(telecharger, `f=${encodeURIComponent(f)}&e=${e}&s=${signer(f, e, process.env.SIGNATURE_SECRET)}`);
    assert.equal(r.status, 404, f);
  }
});

test('téléchargement : lien expiré, refus', async () => {
  const e = Date.now() - 1;
  const r = await appel(telecharger, `f=quick-start&e=${e}&s=${signer('quick-start', e, process.env.SIGNATURE_SECRET)}`);
  assert.equal(r.status, 410);
});

test('téléchargement : signature bricolée, refus', async () => {
  const e = Date.now() + 60000;
  for (const s of ['', 'x', '0'.repeat(64), signer('tenir-lespace', e, 'autre-secret')]) {
    const r = await appel(telecharger, `f=quick-start&e=${e}&s=${s}`);
    assert.equal(r.status, 403);
  }
});

test('téléchargement : signature d un autre fichier, refus', async () => {
  const e = Date.now() + 60000;
  const r = await appel(telecharger, `f=quick-start&e=${e}&s=${signer('tenir-lespace', e, process.env.SIGNATURE_SECRET)}`);
  assert.equal(r.status, 403);
});

test('téléchargement : échéance rallongée sans resigner, refus', async () => {
  const e = Date.now() + 60000;
  const sig = signer('quick-start', e, process.env.SIGNATURE_SECRET);
  const r = await appel(telecharger, `f=quick-start&e=${e + 999999}&s=${sig}`);
  assert.equal(r.status, 403);
});

test('téléchargement : lien valide, le fichier sort', async () => {
  await mkdir(new URL('../../fichiers-proteges/', import.meta.url), { recursive: true });
  await writeFile(new URL('../../fichiers-proteges/quick-start.pdf', import.meta.url), 'PDF-DE-TEST');
  const e = Date.now() + 60000;
  const r = await appel(telecharger, `f=quick-start&e=${e}&s=${signer('quick-start', e, process.env.SIGNATURE_SECRET)}`);
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('content-type'), 'application/pdf');
  assert.match(r.headers.get('content-disposition'), /attachment/);
  assert.equal(await r.text(), 'PDF-DE-TEST');
  await rm(new URL('../../fichiers-proteges/quick-start.pdf', import.meta.url));
  globalThis.fetch = vraiFetch;
});
