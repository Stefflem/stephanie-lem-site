/**
 * Sert un fichier protégé, et seulement si le lien est signé et non expiré.
 * Les fichiers vivent dans fichiers-proteges/, hors du site publié : aucune
 * adresse ne permet de les atteindre directement.
 */
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { signer, signatureValide } from './acces.mjs';

/** Liste blanche. La clé donne le nom du fichier, rien n'est construit
 *  à partir de ce que l'utilisateur envoie, donc aucune traversée possible. */
const CATALOGUE = {
  'tenir-lespace':   { fichier: 'tenir-lespace.pdf',   type: 'application/pdf',  nom: "Tenir l'espace.pdf" },
  'quick-start':     { fichier: 'quick-start.pdf',     type: 'application/pdf',  nom: 'Quick Start 7 jours.pdf' },
  'hypnose-peur':    { fichier: 'hypnose-peur.m4a',    type: 'audio/mp4',        nom: 'Speed hypnose Peur.m4a' },
  'hypnose-ancrage': { fichier: 'hypnose-ancrage.m4a', type: 'audio/mp4',        nom: 'Speed hypnose Ancrage.m4a' },
};

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'fichiers-proteges');

const refus = (m, c = 403) =>
  new Response(m, { status: c, headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' } });

export default async (req) => {
  const secret = process.env.SIGNATURE_SECRET;
  if (!secret) return refus('Livraison non configurée.', 503);

  const q = new URL(req.url).searchParams;
  const cle = q.get('f') || '';
  const expire = Number(q.get('e') || 0);
  const sig = q.get('s') || '';

  const item = Object.hasOwn(CATALOGUE, cle) ? CATALOGUE[cle] : null;
  if (!item) return refus('Fichier inconnu.', 404);
  if (!Number.isFinite(expire) || expire < Date.now()) {
    return refus("Ce lien a expiré. Écris à Stéphanie, elle t'en renvoie un.", 410);
  }
  if (!signatureValide(signer(cle, expire, secret), sig)) return refus('Lien invalide.');

  let contenu;
  try {
    contenu = await readFile(join(RACINE, item.fichier));
  } catch {
    return refus("Ce fichier n'est pas encore en place. Écris à Stéphanie.", 404);
  }

  return new Response(contenu, {
    headers: {
      'content-type': item.type,
      'content-disposition': `attachment; filename*=UTF-8''${encodeURIComponent(item.nom)}`,
      'cache-control': 'private, no-store',
      'x-robots-tag': 'noindex, nofollow',
    },
  });
};
