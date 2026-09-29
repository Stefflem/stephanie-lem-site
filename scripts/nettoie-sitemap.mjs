/**
 * Retire du plan du site les pages marquées noindex.
 *
 * @astrojs/sitemap liste tout ce qu'il construit, sans regarder les balises
 * robots. On se retrouvait donc à déclarer à Google neuf pages qu'on lui
 * demande par ailleurs d'ignorer, dont /acces-le-socle/, l'adresse de
 * livraison après paiement. Contradictoire, et ça publie une adresse qui n'a
 * rien à faire dans un fichier public.
 *
 * Lancé après `astro build`, voir le script "build" de package.json.
 *
 * Il a tourné à vide du 2026-09-28 au 2026-09-30 : le domaine était écrit en
 * dur avec `www`, et la bascule vers le domaine nu a fait échouer chaque
 * calcul de chemin sans un mot. D'où deux règles ici : l'adresse du site ne
 * s'écrit nulle part, et un plan du site dont aucune page n'est retrouvée sur
 * le disque fait échouer la construction au lieu de se taire.
 */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';

/** Chemin du fichier HTML correspondant à une adresse du plan du site.
 *  Seul le chemin compte : le domaine peut changer, et il a changé. */
const fichierDe = (url) => {
  const chemin = new URL(url).pathname.replace(/^\/|\/$/g, '');
  return chemin ? join(DIST, chemin, 'index.html') : join(DIST, 'index.html');
};

const estNoindex = async (url) => {
  const f = fichierDe(url);
  if (!existsSync(f)) return false;
  const h = await readFile(f, 'utf8');
  return /<meta[^>]+name=["']robots["'][^>]+noindex/i.test(h);
};

const plans = (await readdir(DIST)).filter((f) => /^sitemap-\d+\.xml$/.test(f));
let retirees = 0;
let lues = 0;
let introuvables = 0;

for (const p of plans) {
  const chemin = join(DIST, p);
  const xml = await readFile(chemin, 'utf8');
  const blocs = xml.match(/<url>[\s\S]*?<\/url>/g) ?? [];
  const gardes = [];
  for (const b of blocs) {
    const url = b.match(/<loc>([^<]+)<\/loc>/)?.[1];
    if (url) { lues++; if (!existsSync(fichierDe(url))) introuvables++; }
    if (url && (await estNoindex(url))) { retirees++; continue; }
    gardes.push(b);
  }
  await writeFile(chemin, xml.replace(/<url>[\s\S]*?<\/url>/g, '').replace('</urlset>', gardes.join('') + '</urlset>'));
  console.log(`[plan du site] ${p} : ${gardes.length} adresses gardées, ${blocs.length - gardes.length} retirées`);
}

/* Si aucune adresse du plan ne retombe sur un fichier construit, le script ne
   lit plus rien et laisserait passer n'importe quoi. Mieux vaut casser la
   construction que publier un plan du site non vérifié. */
if (lues > 0 && introuvables === lues) {
  console.error(`[plan du site] ERREUR : aucune des ${lues} adresses ne correspond à une page construite.`);
  console.error('[plan du site] Le plan du site n\'a donc pas été vérifié. Construction interrompue.');
  process.exit(1);
}
if (introuvables > 0) console.warn(`[plan du site] ${introuvables} adresse(s) sans page sur le disque`);
if (retirees === 0) console.log('[plan du site] aucune page noindex à retirer');
