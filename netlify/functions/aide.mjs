/**
 * Sert le mode d'emploi de Stéphanie, et seulement à elle.
 *
 * La page /aide/ est une coquille. Le texte vit dans netlify/lib/aide-contenu.mjs
 * et ne sort d'ici qu'après la même vérification que le tableau de bord : le
 * porteur du jeton peut modifier le dépôt du site. Un visiteur, un robot, un
 * curieux qui lit le code source de la page n'en voient pas une ligne.
 *
 * Appelée par public/js/aide.js avec `Authorization: Bearer <jeton>`, le
 * jeton étant celui que son espace d'édition pose dans le navigateur.
 */
import { droitVerifie } from './pilotage.mjs';
import { CONTENU } from '../lib/aide-contenu.mjs';
import { adresseDe, tropSollicite } from '../lib/debit.mjs';

/** Tentatives par adresse et par quart d'heure, même logique que le tableau de bord. */
const TENTATIVES = 20;
const TENTATIVES_MS = 15 * 60 * 1000;

const reponse = (corps, code, type = 'text/html; charset=utf-8') =>
  new Response(corps, {
    status: code,
    headers: {
      'content-type': type,
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex, nofollow',
      'referrer-policy': 'strict-origin-when-cross-origin',
      'strict-transport-security': 'max-age=63072000; includeSubDomains; preload',
    },
  });

export default async (req) => {
  if (req.method !== 'GET') return reponse('', 405, 'text/plain');

  if (await tropSollicite(`aide-${adresseDe(req)}`, TENTATIVES, TENTATIVES_MS)) {
    return reponse('Trop de tentatives. Réessaie dans quelques minutes.', 429, 'text/plain; charset=utf-8');
  }

  const entete = req.headers.get('authorization') || '';
  const jeton = entete.startsWith('Bearer ') ? entete.slice(7) : '';
  const droit = await droitVerifie(jeton);
  if (!droit.ok) return reponse(droit.motif, 401, 'text/plain; charset=utf-8');

  return reponse(CONTENU, 200);
};
