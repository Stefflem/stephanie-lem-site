/** La date de consentement est une preuve : elle doit porter le jour que la
 *  personne a vécu à Paris, pas celui de Greenwich. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { jourAParis } from '../lib/dates.mjs';

test('juste après minuit à Paris, l’heure UTC donnerait la veille', () => {
  // 29 sept 22:02 UTC = 30 sept 00:02 à Paris (heure d'été, UTC+2)
  const t = new Date('2026-09-29T22:02:19.855Z');
  assert.equal(t.toISOString().slice(0, 10), '2026-09-29', 'le défaut se trompe bien');
  assert.equal(jourAParis(t), '2026-09-30');
});

test('en hiver aussi, le décalage vaut une heure', () => {
  // 15 janv 23:30 UTC = 16 janv 00:30 à Paris (UTC+1)
  assert.equal(jourAParis(new Date('2026-01-15T23:30:00Z')), '2026-01-16');
  // 22:30 UTC = 23:30 à Paris, toujours le même jour
  assert.equal(jourAParis(new Date('2026-01-15T22:30:00Z')), '2026-01-15');
});

test('en pleine journée, les deux coïncident', () => {
  const t = new Date('2026-06-15T10:00:00Z');
  assert.equal(jourAParis(t), '2026-06-15');
  assert.equal(jourAParis(t), t.toISOString().slice(0, 10));
});

test('le format reste AAAA-MM-JJ, sur deux chiffres', () => {
  assert.match(jourAParis(new Date('2026-03-05T12:00:00Z')), /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(jourAParis(new Date('2026-03-05T12:00:00Z')), '2026-03-05');
});
