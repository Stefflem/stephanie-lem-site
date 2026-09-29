/**
 * Écrit `llms-full.txt` : le contenu du site en texte, pour les assistants
 * qui répondent à une question en lisant une source plutôt qu'en devinant.
 *
 * Il se fabrique à partir des pages réellement construites, et de la seule
 * liste des pages qu'on accepte de voir indexées, donc APRÈS le nettoyage du
 * plan du site. Rien n'est recopié à la main : un fichier écrit à la main se
 * périme le jour où Stéphanie change une offre, et personne ne s'en aperçoit.
 *
 * Lancé après `astro build`, voir le script "build" de package.json.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { jourAParis } from '../netlify/lib/dates.mjs';

const DIST = 'dist';

const fichierDe = (url) => {
  const chemin = new URL(url).pathname.replace(/^\/|\/$/g, '');
  return chemin ? join(DIST, chemin, 'index.html') : join(DIST, 'index.html');
};

/** Le HTML débarrassé de ce qui n'est pas du texte lisible. */
function enTexte(html) {
  const corps = html.match(/<main[\s\S]*?<\/main>/i)?.[0] ?? html;
  return corps
    .replace(/<(script|style|svg|noscript|template)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<\/(h[1-6]|p|li|section|div|tr|blockquote)>/gi, '\n')
    .replace(/<h([1-3])[^>]*>/gi, (_, n) => '\n' + '#'.repeat(Number(n) + 1) + ' ')
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&rsquo;/g, "'")
    .replace(/[ \t ]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const balise = (html, re) => html.match(re)?.[1]?.trim() ?? '';

const plan = await readFile(join(DIST, 'sitemap-0.xml'), 'utf8');
const urls = [...plan.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (urls.length === 0) { console.error('[llms-full] ERREUR : plan du site vide'); process.exit(1); }

const morceaux = [
  '# Stellaé Experiences, Stéphanie Lem',
  '',
  "> Contenu intégral du site, en texte, pour les assistants de recherche.",
  `> Site : https://stephanielem.fr`,
  `> Dernière mise à jour : ${jourAParis()}`,
  '',
];

let vides = 0;
for (const url of urls.sort()) {
  const f = fichierDe(url);
  if (!existsSync(f)) { vides++; continue; }
  const html = await readFile(f, 'utf8');
  const titre = balise(html, /<title>([^<]*)<\/title>/i);
  const desc = balise(html, /<meta\s+name="description"\s+content="([^"]*)"/i);
  const texte = enTexte(html);
  if (!texte) { vides++; continue; }
  morceaux.push('---', '', `# ${titre}`, '', `Adresse : ${url}`, desc ? `Résumé : ${desc}` : '', '', texte, '');
}

if (vides === urls.length) {
  console.error(`[llms-full] ERREUR : aucune des ${urls.length} pages n'a pu être lue.`);
  process.exit(1);
}

const sortie = morceaux.filter((l) => l !== undefined).join('\n');
await writeFile(join(DIST, 'llms-full.txt'), sortie);
const mots = sortie.split(/\s+/).length;
console.log(`[llms-full] ${urls.length - vides} pages, ${mots} mots, ${(sortie.length / 1024).toFixed(0)} Ko`);
