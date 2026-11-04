/** Le tableau de bord ne doit rien laisser filtrer à qui n'a pas le droit
 *  d'écrire sur son dépôt. */
import assert from 'node:assert/strict';
import { test } from 'node:test';

const mod = await import('../functions/pilotage.mjs');
const { droitVerifie, enEuros, ventesStripe, inscritsBrevo, estUnEssai } = mod;
const pilotage = mod.default;

const appel = (jeton) =>
  pilotage(new Request('https://x.fr/api/pilotage', jeton ? { headers: { authorization: 'Bearer ' + jeton } } : {}));

const JETON = 'gho_' + 'a'.repeat(36);

test('sans jeton : refus', async () => {
  const r = await appel(null);
  assert.equal(r.status, 401);
});

test('jeton mal formé : refusé sans même appeler GitHub', async () => {
  for (const mauvais of ['', 'abc', 'Bearer', 'ghp_court', 'x'.repeat(60)]) {
    const d = await droitVerifie(mauvais, () => { throw new Error('GitHub ne doit pas être appelé'); });
    assert.equal(d.ok, false, mauvais);
  }
});

test('jeton refusé par GitHub : refus', async () => {
  const d = await droitVerifie(JETON, async () => ({ ok: false }));
  assert.equal(d.ok, false);
  assert.match(d.motif, /refusé/);
});

test('compte en lecture seule sur le dépôt : refus', async () => {
  const d = await droitVerifie(JETON, async () => ({ ok: true, json: async () => ({ permissions: { push: false, pull: true } }) }));
  assert.equal(d.ok, false);
  assert.match(d.motif, /ne peut pas modifier/);
});

test('compte qui peut écrire : accepté', async () => {
  const d = await droitVerifie(JETON, async () => ({ ok: true, json: async () => ({ permissions: { push: true } }) }));
  assert.equal(d.ok, true);
});

test('GitHub injoignable : refus, jamais d ouverture par défaut', async () => {
  const d = await droitVerifie(JETON, async () => { throw new Error('réseau coupé'); });
  assert.equal(d.ok, false);
});

test('les centimes deviennent des euros', () => {
  assert.equal(enEuros(11100), 111);
  assert.equal(enEuros(2490), 24.9);
  assert.equal(enEuros(0), 0);
});

test('Stripe non configuré : on le signale, on n invente rien', async () => {
  const v = await ventesStripe(undefined);
  assert.deepEqual(v, { configure: false });
});

test('Stripe : seules les sessions payées et complètes comptent', async () => {
  let url = '';
  const faux = async (u) => ({
    ok: true,
    json: async () => ((url = u), { data: [
      { payment_status: 'paid',   status: 'complete', amount_total: 11100, created: 1758000000, customer_details: { email: 'a@b.fr' }, line_items: { data: [{ description: 'Le Socle' }] } },
      { payment_status: 'unpaid', status: 'expired',  amount_total: 444400, created: 1758000000 },
      { payment_status: 'unpaid', status: 'open',     amount_total: 20000, created: 1758000000 },
    ] }),
  });
  const v = await ventesStripe('rk_test_x', 30, faux);
  assert.match(url, /\/v1\/checkout\/sessions\?/, 'on lit les sessions, la seule ressource ouverte à la clé restreinte');
  assert.equal(v.nombre, 1, 'une seule vente compte');
  assert.equal(v.total, 111);
  assert.equal(v.rembourses, null, 'les remboursements ne se devinent pas depuis une session');
  assert.equal(v.dernieres[0].quoi, 'Le Socle');
  assert.equal(v.dernieres[0].qui, 'a@b.fr');
});

test('Brevo non configuré : on le signale', async () => {
  const i = await inscritsBrevo(undefined);
  assert.deepEqual(i, { configure: false });
});

test('Brevo : listes triées de la plus grande à la plus petite', async () => {
  const faux = async () => ({ ok: true, json: async () => ({ lists: [
    { id: 4, name: 'Contact', totalSubscribers: 2 },
    { id: 3, name: 'Guide', totalSubscribers: 17 },
  ] }) });
  const i = await inscritsBrevo('cle', faux);
  assert.equal(i.total, 19);
  assert.equal(i.listes[0].nom, 'Guide');
});

test('Brevo : le compte vient de uniqueSubscribers, totalSubscribers reste à 0 chez eux', async () => {
  // Forme réelle relevée le 2026-10-22 sur son compte.
  const faux = async () => ({ ok: true, json: async () => ({ lists: [
    { id: 8, name: 'Clientes', uniqueSubscribers: 1, totalSubscribers: 0 },
    { id: 3, name: 'Guide', uniqueSubscribers: 4, totalSubscribers: 0 },
  ] }) });
  const i = await inscritsBrevo('cle', faux);
  assert.equal(i.total, 5);
  assert.equal(i.listes[0].nombre, 4);
});

test('adresses de l équipe : reconnues sous toutes leurs formes Gmail', () => {
  for (const a of ['stephanie.4c.advice@gmail.com', 'Stephanie4cAdvice@gmail.com', 'stephanie.4c.advice+guide@googlemail.com', 'worksfreedom4life+test2@gmail.com']) {
    assert.equal(estUnEssai(a, {}), true, a);
  }
  for (const a of ['emmanuelle@orange.fr', 'stephanie.lem@gmail.com', '', null]) {
    assert.equal(estUnEssai(a, {}), false, String(a));
  }
  assert.equal(estUnEssai('essai@exemple.fr', { ADRESSES_TEST: 'autre@x.fr, essai@exemple.fr' }), true);
});

test('Stripe : l achat test du 2026-10-12 ne compte pas comme une vente', async () => {
  const faux = async () => ({ ok: true, json: async () => ({ data: [
    // Forme réelle : son adresse, 200 € remisés à 5 € par le coupon TEST.
    { payment_status: 'paid', status: 'complete', amount_subtotal: 20000, amount_total: 500, total_details: { amount_discount: 19500 }, created: 1760000000, customer_details: { email: 'stephanie.4c.advice@gmail.com' } },
    // Remise de 97,5 % depuis une adresse inconnue : toujours un essai.
    { payment_status: 'paid', status: 'complete', amount_subtotal: 4700, amount_total: 100, total_details: { amount_discount: 4600 }, created: 1760000000, customer_details: { email: 'x@y.fr' } },
    // Une vraie cliente avec un code à 20 % : elle compte.
    { payment_status: 'paid', status: 'complete', amount_subtotal: 4700, amount_total: 3760, total_details: { amount_discount: 940 }, created: 1760000000, customer_details: { email: 'cliente@y.fr' } },
  ] }) });
  const v = await ventesStripe('rk_test_x', 30, faux, {});
  assert.equal(v.nombre, 1);
  assert.equal(v.total, 37.6);
  assert.equal(v.essais, 2);
  assert.equal(v.dernieres[0].qui, 'cliente@y.fr');
});

test('Brevo : noms lisibles, listes techniques tues, essais retirés, une personne comptée une fois', async () => {
  const recent = new Date().toISOString();
  const ancien = '2026-01-01T10:00:00Z';
  const contacts = {
    3: [{ email: 'ana@x.fr', createdAt: recent }, { email: 'stephanie.4c.advice@gmail.com', createdAt: recent }, { email: 'lea@x.fr', createdAt: ancien }],
    8: [{ email: 'ana@x.fr', createdAt: recent }],
  };
  const faux = async (u) => {
    const m = u.match(/lists\/(\d+)\/contacts/);
    if (m) return { ok: true, json: async () => ({ contacts: contacts[m[1]] ?? [] }) };
    return { ok: true, json: async () => ({ lists: [
      { id: 2, name: 'Votre première liste', uniqueSubscribers: 1 },
      { id: 3, name: 'Site - Guide offert', uniqueSubscribers: 3 },
      { id: 8, name: 'Clientes - achat sur le site', uniqueSubscribers: 1 },
    ] }) };
  };
  const i = await inscritsBrevo('cle', faux, {});
  assert.deepEqual(i.listes.map((l) => [l.nom, l.nombre]), [['Ont demandé ton guide', 2], ['Clientes', 1]]);
  assert.equal(i.total, 2, 'ana est dans deux listes, elle compte une fois');
  assert.equal(i.nouveaux, 1);
  assert.equal(i.essais, 1);
});
