/**
 * Refuse de livrer un site qui mesurerait sans demander.
 *
 * La règle est simple : aucune balise Google ne doit se trouver dans le HTML
 * construit. Elle n'y arrive que par du JavaScript, après un oui explicite.
 * Si quelqu'un colle un jour une balise dans un gabarit, ou si un composant
 * la rend par erreur, la construction s'arrête ici plutôt qu'en contrôle CNIL.
 *
 * Lancé après `astro build`, voir le script "build" de package.json.
 */
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const DIST = 'dist';
/** Ce qui ne doit JAMAIS apparaître dans une page livrée. */
const INTERDIT = [
  { motif: /<script[^>]+googletagmanager\.com/i, quoi: 'balise Google Tag Manager en dur' },
  { motif: /<script[^>]+google-analytics\.com/i, quoi: 'balise Google Analytics en dur' },
  { motif: /<script[^>]+connect\.facebook\.net/i, quoi: 'pixel Facebook' },
  { motif: /<script[^>]+clarity\.ms/i, quoi: 'balise Microsoft Clarity en dur' },
];

async function pages(dossier) {
  const out = [];
  for (const e of await readdir(dossier, { withFileTypes: true })) {
    const chemin = join(dossier, e.name);
    if (e.isDirectory()) out.push(...(await pages(chemin)));
    else if (e.name.endsWith('.html')) out.push(chemin);
  }
  return out;
}

const fichiers = await pages(DIST);
if (fichiers.length === 0) {
  console.error('[consentement] ERREUR : aucune page construite à vérifier.');
  process.exit(1);
}

const fautes = [];
for (const f of fichiers) {
  const html = await readFile(f, 'utf8');
  for (const { motif, quoi } of INTERDIT) if (motif.test(html)) fautes.push(`${f} : ${quoi}`);
}

if (fautes.length) {
  console.error('[consentement] ERREUR : traceur chargé sans consentement.');
  for (const l of fautes) console.error('  ' + l);
  console.error("[consentement] Un traceur ne s'insère qu'après un oui, jamais dans le HTML livré.");
  process.exit(1);
}
console.log(`[consentement] ${fichiers.length} pages vérifiées, aucun traceur chargé d'office`);
