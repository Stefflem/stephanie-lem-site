/**
 * Vérifie un paiement chez Stripe, puis délivre ce qui a été acheté.
 * Sans paiement vérifié pour CE produit, rien ne sort d'ici.
 *
 * Appelée par /acces/ avec le session_id que Stripe ajoute à l'adresse de
 * retour : https://…/acces/?session_id={CHECKOUT_SESSION_ID}
 *
 * Variables d'environnement, à poser chez Netlify, JAMAIS dans le dépôt :
 *   STRIPE_SECRET_KEY        la clé secrète Stripe (sk_live_…)
 *   SIGNATURE_SECRET         une longue chaîne aléatoire (openssl rand -hex 32)
 *   STRIPE_PRICE_SOCLE       identifiant du tarif du Socle (price_…)
 *   STRIPE_PRICE_DEEPDRIVE   identifiant du tarif de Deep Drive
 *   TELEGRAM_INVITE          lien d'invitation au canal privé (Socle)
 *   CALENDLY_DEEPDRIVE       lien de réservation (Deep Drive)
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

/** Durée de validité d'un lien de téléchargement. */
const VALIDITE_MS = 24 * 60 * 60 * 1000;

/**
 * Ce que donne chaque offre. Une offre inconnue ne délivre rien.
 * `env` porte le nom de la variable qui contient l'identifiant de tarif
 * Stripe : c'est lui qui relie un paiement réel à ce qu'on remet.
 */
export const OFFRES = [
  {
    env: 'STRIPE_PRICE_SOCLE',
    titre: 'Le Socle',
    intro: 'Tout est ici. Ces liens vous sont personnels et restent valables 24 heures.',
    fichiers: [
      { cle: 'tenir-lespace', nom: "Guide « Tenir l'espace »", act: 'Télécharger le PDF' },
      { cle: 'quick-start', nom: 'Quick Start 7 jours', act: 'Télécharger le PDF' },
      { cle: 'hypnose-peur', nom: 'Speed hypnose « Peur »', act: "Télécharger l'audio" },
      { cle: 'hypnose-ancrage', nom: 'Speed hypnose « Ancrage »', act: "Télécharger l'audio" },
    ],
    lienEnPlus: { env: 'TELEGRAM_INVITE', nom: 'Canal Telegram privé', act: 'Rejoindre le canal' },
  },
  {
    env: 'STRIPE_PRICE_DEEPDRIVE',
    titre: 'Deep Drive 360',
    intro: 'Il reste une étape : choisir votre créneau. Prenez le rendez vous maintenant, les places sont limitées.',
    fichiers: [],
    lienEnPlus: { env: 'CALENDLY_DEEPDRIVE', nom: 'Choisir mon créneau', act: 'Réserver' },
  },
];

export function signer(cle, expire, secret) {
  return createHmac('sha256', secret).update(`${cle}|${expire}`).digest('hex');
}

/** Comparaison à temps constant, pour ne rien apprendre à qui tâtonne. */
export function signatureValide(attendue, recue) {
  const a = Buffer.from(attendue, 'utf8');
  const b = Buffer.from(String(recue || ''), 'utf8');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Retrouve l'offre correspondant aux tarifs réellement payés. */
export function offrePayee(lignes, env = process.env) {
  const prix = new Set(lignes.map((l) => l?.price?.id).filter(Boolean));
  return OFFRES.find((o) => env[o.env] && prix.has(env[o.env])) || null;
}

const refus = (message, code = 403) =>
  new Response(JSON.stringify({ ok: false, message }), {
    status: code,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

export default async (req) => {
  const cleStripe = process.env.STRIPE_SECRET_KEY;
  const secret = process.env.SIGNATURE_SECRET;
  const auMoinsUnTarif = OFFRES.some((o) => process.env[o.env]);

  // Une configuration incomplète ne doit jamais livrer par défaut.
  if (!cleStripe || !secret || !auMoinsUnTarif) {
    return refus("La livraison n'est pas encore configurée. Écrivez à Stéphanie, elle vous transmet vos accès à la main.", 503);
  }

  const session = new URL(req.url).searchParams.get('session_id') || '';
  if (!/^cs_[A-Za-z0-9_]{10,200}$/.test(session)) return refus('Lien de retour invalide.');

  let data;
  try {
    const r = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(session)}?expand[]=line_items`,
      { headers: { Authorization: 'Basic ' + Buffer.from(cleStripe + ':').toString('base64') } },
    );
    if (!r.ok) return refus("Ce paiement n'a pas pu être vérifié.");
    data = await r.json();
  } catch {
    return refus('Vérification impossible pour le moment, réessayez dans un instant.', 502);
  }

  if (data.payment_status !== 'paid') return refus("Ce paiement n'est pas confirmé.");

  // Payé ne suffit pas : il faut savoir CE QUI a été payé.
  const offre = offrePayee(data.line_items?.data ?? []);
  if (!offre) return refus("Ce paiement ne correspond à aucune offre connue.");

  const expire = Date.now() + VALIDITE_MS;
  const items = offre.fichiers.map((f) => ({
    nom: f.nom,
    act: f.act,
    lien: `/api/telecharger?f=${f.cle}&e=${expire}&s=${signer(f.cle, expire, secret)}`,
  }));

  const sup = offre.lienEnPlus;
  if (sup && process.env[sup.env]) {
    items.push({ nom: sup.nom, act: sup.act, lien: process.env[sup.env], externe: true });
  }

  return new Response(JSON.stringify({ ok: true, titre: offre.titre, intro: offre.intro, items, expire }), {
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
};
