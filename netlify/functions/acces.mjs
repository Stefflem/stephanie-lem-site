/**
 * Vérifie un paiement chez Stripe, puis délivre des liens de téléchargement
 * signés qui expirent. Sans paiement vérifié, rien ne sort d'ici.
 *
 * Appelée par /acces-le-socle/ avec le session_id que Stripe ajoute à
 * l'adresse de retour : .../acces-le-socle/?session_id={CHECKOUT_SESSION_ID}
 *
 * Variables d'environnement à poser chez Netlify, JAMAIS dans le dépôt :
 *   STRIPE_SECRET_KEY   la clé secrète Stripe (sk_live_…)
 *   SIGNATURE_SECRET    une longue chaîne aléatoire, sert à signer les liens
 *   STRIPE_PRICE_SOCLE  l'identifiant du tarif Stripe du Socle (price_…)
 *   TELEGRAM_INVITE     le lien d'invitation au canal privé (optionnel)
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

/** Durée de validité d'un lien de téléchargement. */
const VALIDITE_MS = 24 * 60 * 60 * 1000;

/** Les seuls fichiers délivrables. Une clé qui n'est pas ici n'existe pas. */
const FICHIERS_SOCLE = [
  { cle: 'tenir-lespace', nom: "Guide « Tenir l'espace »", act: 'Télécharger le PDF' },
  { cle: 'quick-start', nom: 'Quick Start 7 jours', act: 'Télécharger le PDF' },
  { cle: 'hypnose-peur', nom: 'Speed hypnose « Peur »', act: "Télécharger l'audio" },
  { cle: 'hypnose-ancrage', nom: 'Speed hypnose « Ancrage »', act: "Télécharger l'audio" },
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

const refus = (message, code = 403) =>
  new Response(JSON.stringify({ ok: false, message }), {
    status: code,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

export default async (req) => {
  const cleStripe = process.env.STRIPE_SECRET_KEY;
  const secret = process.env.SIGNATURE_SECRET;
  const prixSocle = process.env.STRIPE_PRICE_SOCLE;

  // Une configuration incomplète ne doit jamais livrer par défaut.
  if (!cleStripe || !secret || !prixSocle) {
    return refus("La livraison n'est pas encore configurée. Écris à Stéphanie, elle te transmet tes accès à la main.", 503);
  }

  const session = new URL(req.url).searchParams.get('session_id') || '';
  if (!/^cs_[A-Za-z0-9_]{10,200}$/.test(session)) return refus('Lien de retour invalide.');

  // On demande à Stripe si cette session est réellement payée, et pour quoi.
  let data;
  try {
    const r = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(session)}?expand[]=line_items`,
      { headers: { Authorization: 'Basic ' + Buffer.from(cleStripe + ':').toString('base64') } },
    );
    if (!r.ok) return refus("Ce paiement n'a pas pu être vérifié.");
    data = await r.json();
  } catch {
    return refus('Vérification impossible pour le moment, réessaie dans un instant.', 502);
  }

  if (data.payment_status !== 'paid') return refus("Ce paiement n'est pas confirmé.");

  // Payé ne suffit pas : il faut avoir payé CE produit.
  const lignes = data.line_items?.data ?? [];
  const aLeSocle = lignes.some((l) => l.price?.id === prixSocle);
  if (!aLeSocle) return refus("Ce paiement ne correspond pas au Socle.");

  const expire = Date.now() + VALIDITE_MS;
  const items = FICHIERS_SOCLE.map((f) => ({
    nom: f.nom,
    act: f.act,
    lien: `/api/telecharger?f=${f.cle}&e=${expire}&s=${signer(f.cle, expire, secret)}`,
  }));

  if (process.env.TELEGRAM_INVITE) {
    items.push({ nom: 'Canal Telegram privé', act: 'Rejoindre le canal', lien: process.env.TELEGRAM_INVITE, externe: true });
  }

  return new Response(JSON.stringify({ ok: true, items, expire }), {
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
};
