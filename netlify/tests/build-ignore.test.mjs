/** Le garde-fou de build ne doit jamais ignorer le contenu du site.
 *  Un ':(exclude)*.md' a ignoré pendant deux jours ce que Stéphanie
 *  publiait depuis son espace : son contenu est en .md. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const toml = readFileSync('netlify.toml', 'utf8');
const regle = toml.split('\n').find((l) => l.trim().startsWith('ignore ='));

test('la règle existe et ne contient aucun motif générique sur .md', () => {
  assert.ok(regle, 'règle ignore présente');
  assert.doesNotMatch(regle, /\*\.md/, 'jamais *.md : le contenu du site est en .md');
  assert.doesNotMatch(regle, /\*\*/, 'jamais de motif récursif');
});

test('un changement dans src/content déclenche bien une construction', () => {
  // On rejoue la commande de la règle sur un diff fictif : un fichier de
  // contenu modifié ne doit PAS être exclu, donc git diff doit "voir" un changement.
  const spec = regle.match(/-- \. (.*)"$/)[1];
  const fichiers = execSync(`git ls-files src/content/reglages/vente.md`, { encoding: 'utf8' }).trim();
  assert.equal(fichiers, 'src/content/reglages/vente.md', 'le fichier de réglages existe et est suivi');
  // Les exclusions ne doivent viser que des chemins nommés, hors src/content.
  const exclusions = [...spec.matchAll(/':\(exclude(?:,top)?\)([^']+)'/g)].map((m) => m[1]);
  assert.ok(exclusions.length >= 1);
  for (const e of exclusions) {
    assert.doesNotMatch(e, /^src\/content/, `${e} ne doit pas toucher au contenu`);
    assert.doesNotMatch(e, /[*?]/, `${e} doit être un chemin nommé, pas un motif`);
  }
});
