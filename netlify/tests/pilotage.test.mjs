/** Le tableau de bord ne doit rien laisser filtrer à qui n'a pas le droit
 *  d'écrire sur son dépôt. */
import assert from 'node:assert/strict';
import { test } from 'node:test';

const mod = await import('../functions/pilotage.mjs');
const { droitVerifie, enEuros, ventesStripe, inscritsBrevo } = mod;
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

test('Stripe : remboursements et échecs exclus du total', async () => {
  const faux = async () => ({
    ok: true,
    json: async () => ({ data: [
      { paid: true, status: 'succeeded', refunded: false, amount: 11100, created: 1758000000, description: 'Le Socle' },
      { paid: true, status: 'succeeded', refunded: true,  amount: 11100, created: 1758000000 },
      { paid: false, status: 'failed',   refunded: false, amount: 2490,  created: 1758000000 },
    ] }),
  });
  const v = await ventesStripe('sk_test_x', 30, faux);
  assert.equal(v.nombre, 1, 'une seule vente compte');
  assert.equal(v.total, 111);
  assert.equal(v.rembourses, 1);
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
