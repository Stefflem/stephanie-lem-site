/** Vérifie que le consentement décide vraiment, et qu'une panne de Brevo
 *  ne fait jamais perdre un message. */
import assert from 'node:assert/strict';
import { test } from 'node:test';

process.env.BREVO_API_KEY = 'cle-de-test';
process.env.BREVO_LISTE_GUIDE = '7';
process.env.BREVO_LISTE_CONTACT = '9';

const mod = await import('../functions/submission-created.mjs');
const envoyer = mod.default;
const { veutLaSuite, contactBrevo } = mod;

let appels = [];
const vraiFetch = globalThis.fetch;
const simule = (ok = true, status = 201) => {
  appels = [];
  globalThis.fetch = async (url, opts) => { appels.push({ url, body: JSON.parse(opts.body) }); return { ok, status }; };
};
const soumettre = (form, data) =>
  envoyer(new Request('https://x.fr/', { method: 'POST', body: JSON.stringify({ payload: { form_name: form, data } }) }));

test('guide sans la case cochée : enregistré, mais pas dans la liste', async () => {
  simule();
  await soumettre('guide', { prenom: 'Ana', email: 'ana@exemple.fr' });
  assert.equal(appels.length, 1);
  assert.equal(appels[0].body.email, 'ana@exemple.fr');
  assert.equal(appels[0].body.listIds, undefined);
});

test('guide avec la case cochée : inscrit à la liste', async () => {
  simule();
  await soumettre('guide', { prenom: 'Ana', email: 'ana@exemple.fr', suite: 'oui' });
  assert.deepEqual(appels[0].body.listIds, [7]);
});

test('la case cochée par le navigateur vaut « on »', () => {
  assert.equal(veutLaSuite('guide', { suite: 'on' }), true);
  assert.equal(veutLaSuite('guide', {}), false);
  assert.equal(veutLaSuite('guide', { suite: '' }), false);
});

test('contact : la demande elle même est l objet, pas d opt in à cocher', async () => {
  simule();
  await soumettre('contact', { prenom: 'Bea', email: 'BEA@Exemple.FR', message: 'bonjour' });
  assert.deepEqual(appels[0].body.listIds, [9]);
  assert.equal(appels[0].body.email, 'bea@exemple.fr', 'e-mail normalisé en minuscules');
  assert.equal(appels[0].body.attributes.MESSAGE, 'bonjour');
});

test('formulaire inconnu : rien envoyé', async () => {
  simule();
  const r = await soumettre('autre-chose', { email: 'x@exemple.fr' });
  assert.equal(appels.length, 0);
  assert.equal(r.status, 200);
});

test('e-mail invalide : rien envoyé', async () => {
  simule();
  for (const e of ['', 'pasunmail', 'a@b', 'a b@c.fr']) {
    await soumettre('guide', { email: e });
  }
  assert.equal(appels.length, 0);
});

test('Brevo en panne : la soumission ne casse pas', async () => {
  globalThis.fetch = async () => { throw new Error('réseau coupé'); };
  const r = await soumettre('guide', { email: 'ana@exemple.fr' });
  assert.equal(r.status, 200);
});

test('sans clé API : rien envoyé, et pas d erreur', async () => {
  const garde = process.env.BREVO_API_KEY;
  delete process.env.BREVO_API_KEY;
  simule();
  const r = await soumettre('guide', { email: 'ana@exemple.fr' });
  assert.equal(appels.length, 0);
  assert.equal(r.status, 200);
  process.env.BREVO_API_KEY = garde;
  globalThis.fetch = vraiFetch;
});

test('le message du contact est borné', () => {
  const c = contactBrevo({ email: 'a@b.fr', message: 'x'.repeat(5000) }, 'contact');
  assert.equal(c.attributes.MESSAGE.length, 2000);
});
