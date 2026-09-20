/**
 * Audit de référencement sur le site construit, d'après le SOP-012.
 * Ne bloque jamais la construction : il rapporte, Emmanuel décide.
 *   npm run audit
 */
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const DIST = 'dist';
const pages = [];

async function parcours(d) {
  for (const e of await readdir(d, { withFileTypes: true })) {
    const p = join(d, e.name);
    if (e.isDirectory()) { if (e.name !== 'admin') await parcours(p); }
    else if (e.name === 'index.html') pages.push(p);
  }
}
await parcours(DIST);

/** Les entités HTML comptent pour un caractère, pas pour cinq : sans ce
 *  décodage, chaque apostrophe gonflait le titre de quatre caractères et
 *  l'audit signalait des écarts qui n'existaient pas. */
const decode = (t) => t
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
  .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&nbsp;/g, ' ')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const lis = (h, rx) => decode(h.match(rx)?.[1]?.replace(/<[^>]+>/g, '') ?? '').trim();
const lignes = [];
let alertes = 0;

for (const p of pages.sort()) {
  const h = await readFile(p, 'utf8');
  if (/name="robots"[^>]*noindex/.test(h)) continue;
  const url = '/' + p.replace(DIST + '/', '').replace(/index\.html$/, '');
  const titre = lis(h, /<title>([\s\S]*?)<\/title>/);
  const desc = lis(h, /<meta name="description" content="([^"]*)"/);
  const h1 = (h.match(/<h1[^>]*>/g) ?? []).length;
  const schemas = [...h.matchAll(/"@type"\s*:\s*"([^"]+)"/g)].map((m) => m[1]);
  const sansAlt = (h.match(/<img(?![^>]*\balt=)/g) ?? []).length;
  /* Un lien vers la racine d'Instagram ou de WhatsApp est un lien qui ne mène
     nulle part : il passe le test « le champ est rempli » sans rien valoir. */
  const liensVides = [...h.matchAll(/href="(https?:\/\/(?:www\.)?(?:instagram\.com|wa\.me)\/?)"/g)].length
    + [...h.matchAll(/href="mailto:"/g)].length;

  const soucis = [];
  if (titre.length < 50 || titre.length > 60) soucis.push(`titre ${titre.length}`);
  if (desc.length < 140 || desc.length > 155) soucis.push(`desc ${desc.length}`);
  if (h1 !== 1) soucis.push(`h1 ${h1}`);
  if (schemas.length <= 1) soucis.push('schéma pauvre');
  if (sansAlt) soucis.push(`${sansAlt} img sans alt`);
  if (liensVides) soucis.push(`${liensVides} lien(s) vers nulle part`);
  alertes += soucis.length;
  lignes.push(`${soucis.length ? '⚠' : ' '} ${url.padEnd(48)} ${String(titre.length).padStart(3)} ${String(desc.length).padStart(3)}  ${[...new Set(schemas)].join(',') || '-'}${soucis.length ? '   → ' + soucis.join(', ') : ''}`);
}

console.log(`\n=== Audit référencement, ${lignes.length} pages indexables`);
console.log(`    cibles : titre 50 à 60, description 140 à 155, un seul H1, au moins 2 schémas\n`);
console.log(lignes.join('\n'));
console.log(`\n${alertes === 0 ? '✅ aucun écart' : `⚠ ${alertes} écart(s) à regarder`}\n`);
