/** Vérifie que la livraison ne s'ouvre que dans le seul cas prévu. */
import assert from 'node:assert/strict';
import { test } from 'node:test';

process.env.SIGNATURE_SECRET = 'secret-de-test-tres-long-0123456789';
process.env.STRIPE_SECRET_KEY = 'sk_test_bidon';
process.env.STRIPE_PRICE_SOCLE = 'price_SOCLE';
process.env.STRIPE_PRICE_DEEPDRIVE = 'price_DD';
process.env.CALENDLY_DEEPDRIVE = 'https://calendly.com/exemple';

const acces = (await import('../functions/acces.mjs')).default;
const { signer } = await import('../functions/acces.mjs');
const telecharger = (await import('../functions/telecharger.mjs')).default;
const { definirLecteur } = await import('../functions/telecharger.mjs');

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
  assert.match((await r.json()).message, /ne correspond à aucune offre/);
});

test('payé pour Le Socle : liens signés délivrés', async () => {
  simuleStripe({ payment_status: 'paid', line_items: { data: [{ price: { id: 'price_SOCLE' } }] } });
  const r = await appel(acces, 'session_id=' + SESSION);
  assert.equal(r.status, 200);
  const d = await r.json();
  assert.equal(d.titre, 'Le Socle');
  assert.equal(d.items.length, 4);
  assert.ok(d.items.every((i) => /^\/api\/telecharger\?f=[a-z-]+&e=\d+&s=[0-9a-f]{64}$/.test(i.lien)));
  assert.ok(d.expire > Date.now());
});

// Le roman est un livre papier imprime et expedie par Lulu. Il ne se paie
// pas ici et rien ne se telecharge. Ce test garde la porte fermee.
test('le roman ne se livre plus depuis le site', async () => {
  process.env.STRIPE_PRICE_ROMAN = 'price_ROMAN';
  simuleStripe({ payment_status: 'paid', line_items: { data: [{ price: { id: 'price_ROMAN' } }] } });
  const r = await appel(acces, 'session_id=' + SESSION);
  assert.equal(r.status, 403);
  assert.match((await r.json()).message, /ne correspond à aucune offre/);
  delete process.env.STRIPE_PRICE_ROMAN;
});

test('Deep Drive : aucun fichier, mais le lien de réservation', async () => {
  simuleStripe({ payment_status: 'paid', line_items: { data: [{ price: { id: 'price_DD' } }] } });
  const r = await appel(acces, 'session_id=' + SESSION);
  const d = await r.json();
  assert.equal(r.status, 200);
  assert.equal(d.titre, 'Deep Drive 360');
  assert.equal(d.items.length, 1);
  assert.equal(d.items[0].lien, 'https://calendly.com/exemple');
  assert.equal(d.items[0].externe, true);
  assert.ok(!d.items.some((i) => /telecharger/.test(i.lien)), 'aucun fichier ne doit sortir');
});

test('Deep Drive ne donne jamais les fichiers du Socle', async () => {
  simuleStripe({ payment_status: 'paid', line_items: { data: [{ price: { id: 'price_DD' } }] } });
  const d = await (await appel(acces, 'session_id=' + SESSION)).json();
  for (const interdit of ['tenir-lespace', 'quick-start', 'hypnose-peur', 'hypnose-ancrage']) {
    assert.ok(!d.items.some((i) => i.lien.includes(interdit)), interdit + ' ne doit pas sortir');
  }
});

test('configuration incomplète : ne livre pas', async () => {
  const garde = { s: process.env.STRIPE_PRICE_SOCLE, d: process.env.STRIPE_PRICE_DEEPDRIVE };
  delete process.env.STRIPE_PRICE_SOCLE;
  delete process.env.STRIPE_PRICE_DEEPDRIVE;
  const r = await appel(acces, 'session_id=' + SESSION);
  assert.equal(r.status, 503);
  process.env.STRIPE_PRICE_SOCLE = garde.s;
  process.env.STRIPE_PRICE_DEEPDRIVE = garde.d;
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

// Les fichiers vivent dans Netlify Blobs. Les tests n'ont pas de coffre : ils
// remplacent la lecture, et verifient que la fonction ne livre que ce que le
// coffre rend, et rien quand il ne rend rien.
test('téléchargement : lien valide, le fichier sort du coffre', async () => {
  definirLecteur(async (nom) => (nom === 'quick-start.pdf' ? 'PDF-DE-TEST' : null));
  const e = Date.now() + 60000;
  const r = await appel(telecharger, `f=quick-start&e=${e}&s=${signer('quick-start', e, process.env.SIGNATURE_SECRET)}`);
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('content-type'), 'application/pdf');
  assert.match(r.headers.get('content-disposition'), /attachment/);
  assert.equal(await r.text(), 'PDF-DE-TEST');
  globalThis.fetch = vraiFetch;
});

test('téléchargement : fichier absent du coffre, refus sans rien livrer', async () => {
  definirLecteur(async () => null);
  const e = Date.now() + 60000;
  const r = await appel(telecharger, `f=quick-start&e=${e}&s=${signer('quick-start', e, process.env.SIGNATURE_SECRET)}`);
  assert.equal(r.status, 404);
  assert.match(await r.text(), /pas encore en place/);
});

test('téléchargement : coffre en panne, refus propre, jamais une erreur brute', async () => {
  definirLecteur(async () => { throw new Error('coffre injoignable'); });
  const e = Date.now() + 60000;
  const r = await appel(telecharger, `f=quick-start&e=${e}&s=${signer('quick-start', e, process.env.SIGNATURE_SECRET)}`);
  assert.equal(r.status, 404);
});
