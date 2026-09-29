/**
 * Envoie ses accès à l'acheteuse, dès que Stripe confirme le paiement.
 *
 * Pourquoi un webhook et pas la page de retour : si elle ferme l'onglet avant
 * d'arriver sur /acces/, elle a payé et elle n'a rien. Stripe, lui, rejoue
 * l'appel jusqu'à ce qu'il réussisse. C'est le seul montage qui garantit la
 * livraison de ce qu'elle vend.
 *
 * Adresse à déclarer chez Stripe : https://stephanielem.fr/api/stripe-webhook
 * Événement à cocher : checkout.session.completed
 *
 * Variables d'environnement, à poser chez Netlify, JAMAIS dans le dépôt :
 *   STRIPE_WEBHOOK_SECRET   le secret whsec_… que Stripe donne à la création
 *   STRIPE_SECRET_KEY       la clé restreinte déjà en place (lecture des sessions)
 *   BREVO_API_KEY           la clé API v3 déjà en place
 *   BREVO_MODELE_SOCLE      numéro du modèle « 06 · Le Socle · après achat »
 *   BREVO_MODELE_DEEPDRIVE  numéro du modèle « 08 · Deep Drive · après achat »
 *   BREVO_LISTE_CLIENTES    liste où atterrissent les acheteuses (facultatif)
 *   SITE_URL                son domaine, par défaut https://stephanielem.fr
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import { getStore } from '@netlify/blobs';
import { offrePayee } from './acces.mjs';
import { jourAParis } from '../lib/dates.mjs';

/** Un appel plus vieux que ça n'est plus accepté, même bien signé. */
const TOLERANCE_S = 300;
/** Le coffre qui retient les paiements déjà traités. */
const COFFRE = 'paiements-livres';

/** Le coffre, et de quoi le remplacer pendant les tests. */
let coffreDe = () => getStore(COFFRE);
export function definirCoffre(fn) { coffreDe = fn; }

/** Quel modèle d'e-mail pour quelle offre. La clé est le nom de la variable
 *  de tarif : c'est elle qui relie déjà un paiement réel à une offre dans
 *  acces.mjs, on ne redéclare pas les tarifs ici. */
export const MODELES = {
  STRIPE_PRICE_SOCLE: 'BREVO_MODELE_SOCLE',
  STRIPE_PRICE_DEEPDRIVE: 'BREVO_MODELE_DEEPDRIVE',
};

/**
 * Vérifie la signature de Stripe. Sans elle, n'importe qui pourrait appeler
 * cette adresse et se faire livrer sans payer.
 */
export function signatureStripeValide(corps, entete, secret, maintenantS = Math.floor(Date.now() / 1000)) {
  if (!corps || !entete || !secret) return false;
  const champs = new Map(
    String(entete)
      .split(',')
      .map((p) => p.split('=', 2))
      .filter((p) => p.length === 2)
      .map(([k, v]) => [k.trim(), v.trim()]),
  );
  const t = Number(champs.get('t'));
  const recue = champs.get('v1');
  if (!Number.isFinite(t) || !recue) return false;
  if (Math.abs(maintenantS - t) > TOLERANCE_S) return false;

  const attendue = createHmac('sha256', secret).update(`${t}.${corps}`).digest('hex');
  const a = Buffer.from(attendue, 'utf8');
  const b = Buffer.from(recue, 'utf8');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Le prénom, tel qu'on peut le deviner du nom donné à Stripe. */
export function prenomDe(nomComplet) {
  const v = String(nomComplet ?? '').trim();
  if (!v) return undefined;
  return v.split(/\s+/)[0];
}

/** L'adresse qui rouvre ses accès, autant de fois qu'elle veut : /acces/
 *  revérifie le paiement chez Stripe et refabrique des liens frais. */
export function lienAcces(sessionId, site = process.env.SITE_URL || 'https://stephanielem.fr') {
  return `${site.replace(/\/+$/, '')}/acces/?session_id=${encodeURIComponent(sessionId)}`;
}

/** Le contact d'abord : les modèles disent {{ contact.PRENOM }}, Brevo ne sait
 *  le remplir que si la fiche existe. */
async function poserContact(cle, email, prenom, liste, fetchImpl) {
  const corps = {
    email,
    attributes: { PRENOM: prenom, SOURCE: 'stripe:achat', OPTIN_EMAIL: 'oui', DATE_CONSENTEMENT: jourAParis() },
    updateEnabled: true,
  };
  if (liste) corps.listIds = [Number(liste)];
  const r = await fetchImpl('https://api.brevo.com/v3/contacts', {
    method: 'POST',
    headers: { 'api-key': cle, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(corps),
  });
  // 201 créée, 204 mise à jour, 400 « already exist » sans conséquence ici.
  if (!r.ok && r.status !== 204 && r.status !== 400) console.warn(`[stripe-webhook] contact Brevo ${r.status}`);
}

async function envoyerModele(cle, modele, email, prenom, lien, titre, fetchImpl) {
  const r = await fetchImpl('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': cle, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      to: [{ email, name: prenom }],
      templateId: Number(modele),
      params: { PRENOM: prenom || '', LIEN: lien, OFFRE: titre },
    }),
  });
  if (!r.ok) throw new Error(`Brevo a refusé l'envoi (${r.status})`);
}

export default async (req) => {
  if (req.method !== 'POST') return new Response('', { status: 405 });

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const cleStripe = process.env.STRIPE_SECRET_KEY;
  const cleBrevo = process.env.BREVO_API_KEY;
  if (!secret || !cleStripe || !cleBrevo) {
    console.warn('[stripe-webhook] configuration incomplète');
    return new Response('configuration incomplete', { status: 503 });
  }

  // Le corps BRUT, jamais le JSON reformaté : la signature porte sur les octets.
  const corps = await req.text();
  if (!signatureStripeValide(corps, req.headers.get('stripe-signature'), secret)) {
    return new Response('signature invalide', { status: 400 });
  }

  let evt;
  try { evt = JSON.parse(corps); } catch { return new Response('corps illisible', { status: 400 }); }

  // Tout le reste est acquitté sans rien faire : Stripe ne doit pas réessayer
  // un événement qui ne nous concerne pas.
  if (evt?.type !== 'checkout.session.completed') return new Response('', { status: 200 });
  const session = evt?.data?.object ?? {};
  if (session.payment_status !== 'paid') return new Response('', { status: 200 });

  const email = String(session.customer_details?.email ?? session.customer_email ?? '').trim().toLowerCase();
  if (!email) { console.warn('[stripe-webhook] paiement sans e-mail'); return new Response('', { status: 200 }); }

  // Déjà livré : on acquitte et on ne renvoie pas un second mail.
  const coffre = coffreDe();
  const marque = `evenement-${evt.id}`;
  try {
    if (await coffre.get(marque)) return new Response('', { status: 200 });
  } catch (e) {
    console.warn('[stripe-webhook] coffre illisible', e?.message);
  }

  // Le payload de Stripe ne contient pas les lignes achetées, il faut les demander.
  let lignes = [];
  try {
    const r = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(session.id)}?expand[]=line_items`,
      { headers: { Authorization: 'Basic ' + Buffer.from(cleStripe + ':').toString('base64') } },
    );
    if (!r.ok) throw new Error(`Stripe a refusé la lecture (${r.status})`);
    lignes = (await r.json())?.line_items?.data ?? [];
  } catch (e) {
    // 500 : Stripe rejouera. Mieux vaut un retard qu'une acheteuse sans rien.
    console.warn('[stripe-webhook] lecture de la session impossible', e?.message);
    return new Response('relecture impossible', { status: 500 });
  }

  const offre = offrePayee(lignes);
  const nomVar = offre ? MODELES[offre.env] : null;
  const modele = nomVar ? process.env[nomVar] : null;
  if (!offre || !modele) {
    console.warn(`[stripe-webhook] aucun modèle pour ce paiement (${offre?.titre ?? 'offre inconnue'})`);
    return new Response('', { status: 200 });
  }

  const prenom = prenomDe(session.customer_details?.name);
  try {
    await poserContact(cleBrevo, email, prenom, process.env.BREVO_LISTE_CLIENTES, fetch);
    await envoyerModele(cleBrevo, modele, email, prenom, lienAcces(session.id), offre.titre, fetch);
  } catch (e) {
    console.warn('[stripe-webhook] envoi impossible', e?.message);
    return new Response('envoi impossible', { status: 500 });
  }

  // La marque se pose APRÈS l'envoi réussi, sinon un échec se transformerait
  // en paiement définitivement non livré.
  try { await coffre.set(marque, new Date().toISOString()); } catch { /* le doublon est moins grave que l'absence */ }

  console.log(`[stripe-webhook] ${offre.titre} livré par e-mail`);
  return new Response('', { status: 200 });
};
