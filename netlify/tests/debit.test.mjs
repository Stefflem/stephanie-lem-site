/** Un curieux ne doit rien coûter, et une vraie cliente ne doit pas être
 *  enfermée dehors par le compteur censé la protéger. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { definirCoffreDebit, tropSollicite, adresseDe } from '../lib/debit.mjs';

const faux = () => {
  const m = new Map();
  definirCoffreDebit(() => ({
    get: async (k) => m.get(k) ?? null,
    set: async (k, v) => { m.set(k, v); },
  }));
  return m;
};

test('la limite se déclenche au dépassement, pas avant', async () => {
  faux();
  for (let i = 0; i < 3; i++) assert.equal(await tropSollicite('a', 3, 1000), false, `appel ${i + 1}`);
  assert.equal(await tropSollicite('a', 3, 1000), true, 'le quatrième dépasse');
});

test('la fenêtre se rouvre : une cliente revient le lendemain', async () => {
  faux();
  const t0 = 1_000_000;
  for (let i = 0; i < 4; i++) await tropSollicite('b', 3, 1000, t0);
  assert.equal(await tropSollicite('b', 3, 1000, t0 + 50), true, 'toujours bloquée dans la fenêtre');
  assert.equal(await tropSollicite('b', 3, 1000, t0 + 1001), false, 'la fenêtre passée, tout repart');
});

test('deux clés ne se gênent pas', async () => {
  faux();
  for (let i = 0; i < 4; i++) await tropSollicite('x', 3, 1000);
  assert.equal(await tropSollicite('y', 3, 1000), false);
});

test('un coffre en panne laisse passer, il ne ferme pas la boutique', async () => {
  definirCoffreDebit(() => { throw new Error('coffre injoignable'); });
  assert.equal(await tropSollicite('z', 1, 1000), false);
  definirCoffreDebit(() => ({
    get: async () => { throw new Error('lecture impossible'); },
    set: async () => {},
  }));
  assert.equal(await tropSollicite('z', 1, 1000), false);
});

test("l'adresse est lue là où Netlify la met", () => {
  const req = (h) => new Request('https://x.fr/', { headers: h });
  assert.equal(adresseDe(req({ 'x-nf-client-connection-ip': '1.2.3.4' })), '1.2.3.4');
  assert.equal(adresseDe(req({ 'x-forwarded-for': '5.6.7.8, 9.9.9.9' })), '5.6.7.8');
  assert.equal(adresseDe(req({})), 'inconnue', 'sans adresse, tout le monde partage le même compteur');
});
