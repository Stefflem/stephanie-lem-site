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
 */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const SITE = 'https://www.stephanielem.fr';

/** Chemin du fichier HTML correspondant à une adresse du plan du site. */
const fichierDe = (url) => {
  const chemin = url.replace(SITE, '').replace(/^\/|\/$/g, '');
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

for (const p of plans) {
  const chemin = join(DIST, p);
  const xml = await readFile(chemin, 'utf8');
  const blocs = xml.match(/<url>[\s\S]*?<\/url>/g) ?? [];
  const gardes = [];
  for (const b of blocs) {
    const url = b.match(/<loc>([^<]+)<\/loc>/)?.[1];
    if (url && (await estNoindex(url))) { retirees++; continue; }
    gardes.push(b);
  }
  await writeFile(chemin, xml.replace(/<url>[\s\S]*?<\/url>/g, '').replace('</urlset>', gardes.join('') + '</urlset>'));
  console.log(`[plan du site] ${p} : ${gardes.length} adresses gardées, ${blocs.length - gardes.length} retirées`);
}

if (retirees === 0) console.log('[plan du site] aucune page noindex à retirer');
