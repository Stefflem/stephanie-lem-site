/** Vérifie qu'un paiement confirmé livre toujours, qu'il ne livre jamais deux
 *  fois, et qu'une signature qui ne vient pas de Stripe n'obtient rien. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHmac } from 'node:crypto';

process.env.STRIPE_WEBHOOK_SECRET = 'whsec_de_test';
process.env.STRIPE_SECRET_KEY = 'rk_de_test';
process.env.BREVO_API_KEY = 'cle-de-test';
process.env.STRIPE_PRICE_SOCLE = 'price_socle';
process.env.STRIPE_PRICE_DEEPDRIVE = 'price_deepdrive';
process.env.BREVO_MODELE_SOCLE = '6';
process.env.BREVO_MODELE_DEEPDRIVE = '8';
process.env.BREVO_LISTE_CLIENTES = '11';
process.env.SITE_URL = 'https://stephanielem.fr';

const mod = await import('../functions/stripe-webhook.mjs');
const appeler = mod.default;
const { signatureStripeValide, prenomDe, lienAcces, definirCoffre } = mod;

const SECRET = 'whsec_de_test';
const signe = (corps, t = Math.floor(Date.now() / 1000)) =>
  `t=${t},v1=${createHmac('sha256', SECRET).update(`${t}.${corps}`).digest('hex')}`;

const evenement = (over = {}) => JSON.stringify({
  id: 'evt_1',
  type: 'checkout.session.completed',
  data: { object: { id: 'cs_test_123', payment_status: 'paid', customer_details: { email: 'Cliente@Exemple.FR', name: 'Marie Dupont' }, ...over } },
});

let brevo = [];
let coffre = new Map();
let stripeRepond = { ok: true, prix: 'price_socle' };
let brevoRepond = { ok: true, status: 201 };

const monter = () => {
  brevo = [];
  coffre = new Map();
  definirCoffre(() => ({
    get: async (k) => coffre.get(k) ?? null,
    set: async (k, v) => { coffre.set(k, v); },
  }));
  globalThis.fetch = async (url, opts) => {
    if (String(url).includes('api.stripe.com')) {
      if (!stripeRepond.ok) return { ok: false, status: 500 };
      return { ok: true, json: async () => ({ line_items: { data: [{ price: { id: stripeRepond.prix } }] } }) };
    }
    brevo.push({ url: String(url), body: JSON.parse(opts.body) });
    return { ok: brevoRepond.ok, status: brevoRepond.status };
  };
};

const poster = (corps, entete) =>
  appeler(new Request('https://stephanielem.fr/api/stripe-webhook', {
    method: 'POST',
    headers: entete === null ? {} : { 'stripe-signature': entete ?? signe(corps) },
    body: corps,
  }));

test('une signature absente ou fausse ne livre rien', async () => {
  monter();
  const c = evenement();
  assert.equal((await poster(c, null)).status, 400);
  assert.equal((await poster(c, 't=1,v1=deadbeef')).status, 400);
  assert.equal(brevo.length, 0);
});

test('une signature bien formée mais trop vieille est refusée', async () => {
  monter();
  const c = evenement();
  const vieux = Math.floor(Date.now() / 1000) - 3600;
  assert.equal((await poster(c, signe(c, vieux))).status, 400);
  assert.equal(brevo.length, 0);
});

test('un paiement du Socle pose le contact puis envoie le bon modèle', async () => {
  monter();
  stripeRepond = { ok: true, prix: 'price_socle' };
  const r = await poster(evenement());
  assert.equal(r.status, 200);
  assert.equal(brevo.length, 2);

  const [contact, envoi] = brevo;
  assert.match(contact.url, /\/v3\/contacts$/);
  assert.equal(contact.body.email, 'cliente@exemple.fr');
  assert.equal(contact.body.attributes.PRENOM, 'Marie');
  assert.deepEqual(contact.body.listIds, [11]);

  assert.match(envoi.url, /\/v3\/smtp\/email$/);
  assert.equal(envoi.body.templateId, 6);
  assert.equal(envoi.body.to[0].email, 'cliente@exemple.fr');
  assert.equal(envoi.body.params.LIEN, 'https://stephanielem.fr/acces/?session_id=cs_test_123');
});

test('un paiement Deep Drive envoie son propre modèle', async () => {
  monter();
  stripeRepond = { ok: true, prix: 'price_deepdrive' };
  await poster(evenement());
  assert.equal(brevo.at(-1).body.templateId, 8);
});

test('le même événement rejoué ne renvoie pas un second mail', async () => {
  monter();
  stripeRepond = { ok: true, prix: 'price_socle' };
  await poster(evenement());
  const apres = brevo.length;
  const r = await poster(evenement());
  assert.equal(r.status, 200);
  assert.equal(brevo.length, apres, 'aucun appel supplémentaire');
});

test('un autre type d’événement est acquitté sans rien envoyer', async () => {
  monter();
  const c = JSON.stringify({ id: 'evt_2', type: 'invoice.paid', data: { object: {} } });
  assert.equal((await poster(c)).status, 200);
  assert.equal(brevo.length, 0);
});

test('une session non payée ne livre rien', async () => {
  monter();
  assert.equal((await poster(evenement({ payment_status: 'unpaid' }))).status, 200);
  assert.equal(brevo.length, 0);
});

test('un tarif inconnu est acquitté sans mail, jamais livré par défaut', async () => {
  monter();
  stripeRepond = { ok: true, prix: 'price_inconnu' };
  assert.equal((await poster(evenement())).status, 200);
  assert.equal(brevo.length, 0);
});

test('Brevo en panne répond 500 et ne marque pas le paiement comme livré', async () => {
  monter();
  stripeRepond = { ok: true, prix: 'price_socle' };
  brevoRepond = { ok: false, status: 500 };
  const r = await poster(evenement());
  assert.equal(r.status, 500, 'Stripe doit rejouer');
  assert.equal(coffre.size, 0, 'rien ne doit être marqué comme livré');
  brevoRepond = { ok: true, status: 201 };

  // Et au rejeu, la livraison passe.
  const r2 = await poster(evenement());
  assert.equal(r2.status, 200);
  assert.equal(brevo.at(-1).body.templateId, 6);
});

test('Stripe illisible répond 500 pour être rejoué', async () => {
  monter();
  stripeRepond = { ok: false };
  assert.equal((await poster(evenement())).status, 500);
  stripeRepond = { ok: true, prix: 'price_socle' };
});

test('un paiement sans e-mail ne fait pas tomber la fonction', async () => {
  monter();
  const c = JSON.stringify({ id: 'evt_3', type: 'checkout.session.completed', data: { object: { id: 'cs_x', payment_status: 'paid' } } });
  assert.equal((await poster(c)).status, 200);
  assert.equal(brevo.length, 0);
});

test('signature, prénom et lien d’accès', () => {
  assert.equal(signatureStripeValide('', '', SECRET), false);
  assert.equal(prenomDe('  Marie  Dupont '), 'Marie');
  assert.equal(prenomDe(''), undefined);
  assert.equal(prenomDe(undefined), undefined);
  assert.equal(lienAcces('cs_1', 'https://x.fr/'), 'https://x.fr/acces/?session_id=cs_1');
});

test('GET est refusé', async () => {
  monter();
  const r = await appeler(new Request('https://stephanielem.fr/api/stripe-webhook'));
  assert.equal(r.status, 405);
});
