/**
 * Les chiffres de Stéphanie, rassemblés en un seul endroit.
 *
 * Appelée par /pilotage/, qui n'est accessible qu'à quelqu'un déjà connecté à
 * son espace d'édition. La page transmet le jeton GitHub que Decap a mis en
 * mémoire, et cette fonction vérifie auprès de GitHub que ce jeton donne bien
 * le droit d'écrire sur SON dépôt. Sans ça, rien ne sort d'ici.
 *
 * Aucun compte de plus à créer, aucun mot de passe de plus à retenir.
 *
 * Variables lues, toutes facultatives : ce qui n'est pas configuré est
 * simplement signalé comme tel, jamais inventé.
 *   STRIPE_SECRET_KEY   pour les ventes
 *   BREVO_API_KEY       pour les inscrits
 *   GITHUB_REPO         dépôt de référence, défaut Stefflem/stephanie-lem-site
 */

import { getStore } from '@netlify/blobs';
import { adresseDe, tropSollicite } from '../lib/debit.mjs';

/** Tentatives d'ouverture du tableau de bord, par adresse et par quart d'heure.
 *  Stéphanie s'y connecte quelques fois par jour, jamais vingt par minute. */
const TENTATIVES = 20;
const TENTATIVES_MS = 15 * 60 * 1000;

const DEPOT = process.env.GITHUB_REPO || 'Stefflem/stephanie-lem-site';

const json = (corps, code = 200) =>
  new Response(JSON.stringify(corps), {
    status: code,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

/**
 * Vérifie que le porteur du jeton peut écrire sur le dépôt.
 * C'est notre seule barrière, et elle suffit : qui peut modifier le site
 * peut voir ses chiffres.
 */
export async function droitVerifie(jeton, fetchImpl = fetch) {
  if (!/^gh[opsu]_[A-Za-z0-9]{20,}$/.test(String(jeton || ''))) return { ok: false, motif: 'jeton mal formé' };
  try {
    const r = await fetchImpl(`https://api.github.com/repos/${DEPOT}`, {
      headers: { Authorization: `Bearer ${jeton}`, accept: 'application/vnd.github+json', 'user-agent': 'stellae-pilotage' },
    });
    if (!r.ok) return { ok: false, motif: 'jeton refusé par GitHub' };
    const d = await r.json();
    if (!d?.permissions?.push) return { ok: false, motif: 'ce compte ne peut pas modifier le site' };
    return { ok: true };
  } catch {
    return { ok: false, motif: 'vérification impossible' };
  }
}

/** Convertit des centimes en euros lisibles. */
export const enEuros = (centimes) => Math.round((centimes / 100) * 100) / 100;

/** Les adresses de l'équipe. Un achat ou une inscription faits avec l'une
 *  d'elles est un essai, jamais une cliente. Gmail ignore les points et tout
 *  ce qui suit un « + », on compare donc la forme réduite. La variable
 *  ADRESSES_TEST, séparée par des virgules, en ajoute sans toucher au code. */
const EQUIPE = ['stephanie.4c.advice@gmail.com', 'worksfreedom4life@gmail.com'];

const reduite = (adresse) => {
  const [local = '', domaine = ''] = String(adresse || '').trim().toLowerCase().split('@');
  const gmail = domaine === 'gmail.com' || domaine === 'googlemail.com';
  const l = local.split('+')[0];
  return (gmail ? l.replace(/\./g, '') : l) + '@' + (gmail ? 'gmail.com' : domaine);
};

export function estUnEssai(adresse, env = process.env) {
  if (!adresse) return false;
  const liste = EQUIPE.concat(String(env.ADRESSES_TEST || '').split(',')).map((a) => a.trim()).filter(Boolean);
  const r = reduite(adresse);
  return liste.some((a) => reduite(a) === r);
}

/** Les ventes Stripe des N derniers jours. */
export async function ventesStripe(cle, jours = 30, fetchImpl = fetch, env = process.env) {
  if (!cle) return { configure: false };
  /* On lit les sessions de paiement, pas les charges : c'est la seule ressource
     que la clé restreinte sait lire, et c'est volontaire. Une clé qui ne peut
     lire que ça ne permet ni remboursement ni virement si elle fuite. Tout ce
     que le site vend passe par un lien de paiement, donc par une session. */
  const depuis = Math.floor(Date.now() / 1000) - jours * 86400;
  const r = await fetchImpl(
    `https://api.stripe.com/v1/checkout/sessions?limit=100&created[gte]=${depuis}&expand[]=data.line_items`,
    { headers: { Authorization: 'Basic ' + Buffer.from(cle + ':').toString('base64') } },
  );
  if (!r.ok) return { configure: true, erreur: 'Stripe a refusé la demande' };
  const d = await r.json();
  const payees = (d.data ?? []).filter((x) => x.payment_status === 'paid' && x.status === 'complete');
  /* Un essai n'est pas une vente : payé depuis une adresse de l'équipe, ou
     avec une remise de 90 % et plus (le coupon TEST du 2026-10-12 en faisait
     97,5 %). Le compter ferait croire à Stéphanie qu'elle a vendu. */
  const essai = (x) => {
    const avant = x.amount_subtotal ?? 0;
    const remise = x.total_details?.amount_discount ?? 0;
    return estUnEssai(x.customer_details?.email || x.customer_email, env) || (avant > 0 && remise / avant >= 0.9);
  };
  const vraies = payees.filter((x) => !essai(x));
  const total = vraies.reduce((s, x) => s + (x.amount_total ?? 0), 0);
  return {
    configure: true,
    jours,
    nombre: vraies.length,
    total: enEuros(total),
    essais: payees.length - vraies.length,
    /* Les remboursements ne se voient pas sur une session. On ne les invente
       pas : la page renvoie vers Stripe pour ça. */
    rembourses: null,
    dernieres: vraies.slice(0, 8).map((x) => ({
      montant: enEuros(x.amount_total ?? 0),
      quoi: (x.line_items?.data ?? []).map((l) => l.description).filter(Boolean).join(' + ') || 'Paiement',
      qui: x.customer_details?.email || x.customer_email || '',
      quand: new Date(x.created * 1000).toISOString(),
    })),
  };
}

/** Le nom qu'elle comprend, pour chaque liste que le site remplit.
 *  Les listes créées d'office par Brevo ne la concernent pas, on les tait. */
const NOMS_LISTES = {
  'Site - Guide offert': 'Ont demandé ton guide',
  'Site - Demandes de contact': 'T’ont écrit',
  'Site - Etude de cas': 'Inscrites à l’étude de cas',
  'Clientes - achat sur le site': 'Clientes',
};
const LISTES_TUES = new Set(['Votre première liste', 'identified_contacts']);

/** Les listes Brevo et leurs effectifs, essais retirés. */
export async function inscritsBrevo(cle, fetchImpl = fetch, env = process.env, jours = 30) {
  if (!cle) return { configure: false };
  const entetes = { 'api-key': cle, accept: 'application/json' };
  const r = await fetchImpl('https://api.brevo.com/v3/contacts/lists?limit=50', { headers: entetes });
  if (!r.ok) return { configure: true, erreur: 'Brevo a refusé la demande' };
  const d = await r.json();
  const depuis = Date.now() - jours * 86400000;
  const vues = new Map();
  let essais = 0;
  let detail = true;

  const listes = [];
  for (const l of d.lists ?? []) {
    if (LISTES_TUES.has(l.name)) continue;
    /* ⚠️ `totalSubscribers` reste à 0 chez Brevo sur ses listes alors qu'elles
       ont des contacts (relevé le 2026-10-22 : 4, 4 et 1 contacts, 0 partout).
       Le vrai effectif est `uniqueSubscribers`, gardé si le détail manque. */
    let nombre = l.uniqueSubscribers ?? l.totalSubscribers ?? 0;
    const c = await fetchImpl(`https://api.brevo.com/v3/contacts/lists/${l.id}/contacts?limit=500`, { headers: entetes })
      .then((x) => (x.ok ? x.json() : null)).catch(() => null);
    if (Array.isArray(c?.contacts)) {
      const vrais = c.contacts.filter((x) => !estUnEssai(x.email, env));
      essais += c.contacts.length - vrais.length;
      nombre = vrais.length;
      for (const x of vrais) if (!vues.has(x.email)) vues.set(x.email, Date.parse(x.createdAt) || 0);
    } else {
      detail = false;
    }
    listes.push({ nom: NOMS_LISTES[l.name] ?? l.name, nombre, id: l.id });
  }
  listes.sort((a, b) => b.nombre - a.nombre);

  /* Une personne inscrite au guide puis cliente compte une fois. Sans le
     détail des contacts, on retombe sur la somme des listes. */
  const total = detail ? vues.size : listes.reduce((s, l) => s + l.nombre, 0);
  const nouveaux = detail ? [...vues.values()].filter((t) => t >= depuis).length : null;
  return { configure: true, total, nouveaux, essais, listes };
}

export default async (req) => {
  const entete = req.headers.get('authorization') || '';
  const jeton = entete.startsWith('Bearer ') ? entete.slice(7) : '';

  /* Un jeton au bon format mais inconnu déclenche un appel à GitHub. Répété,
     il fait blacklister l'adresse de sortie de Netlify, et c'est le tableau de
     bord de Stéphanie qui tombe, pas celui de l'attaquant. */
  if (await tropSollicite(`pilotage-${adresseDe(req)}`, TENTATIVES, TENTATIVES_MS)) {
    return json({ ok: false, message: 'Trop de tentatives. Réessayez dans quelques minutes.' }, 429);
  }

  const droit = await droitVerifie(jeton);
  if (!droit.ok) return json({ ok: false, message: droit.motif }, 401);

  const [ventes, inscrits] = await Promise.all([
    ventesStripe(process.env.STRIPE_SECRET_KEY).catch(() => ({ configure: true, erreur: 'Stripe injoignable' })),
    inscritsBrevo(process.env.BREVO_API_KEY).catch(() => ({ configure: true, erreur: 'Brevo injoignable' })),
  ]);

  /* Les fichiers du Socle, comptés dans le coffre et non supposés. */
  const ATTENDUS = ['tenir-lespace.pdf', 'quick-start.pdf', 'hypnose-peur.m4a', 'hypnose-ancrage.m4a'];
  const coffre = await getStore('fichiers-proteges').list()
    .then((r) => { const noms = new Set((r?.blobs || []).map((b) => b.key)); return ATTENDUS.filter((n) => noms.has(n)).length; })
    .catch(() => 0);

  /* L'état du branchement, calculé et non supposé. C'est ce qui dit à
     Stéphanie et à Emmanuel ce qui reste à faire, sans avoir à chercher. */
  const branchement = [
    { quoi: 'Encaissement Stripe', pret: !!process.env.STRIPE_SECRET_KEY },
    { quoi: 'Envoi des e-mails Brevo', pret: !!process.env.BREVO_API_KEY },
    { quoi: 'Livraison des fichiers payants', pret: !!process.env.SIGNATURE_SECRET && !!process.env.STRIPE_PRICE_SOCLE },
    { quoi: `Fichiers du Socle dans le coffre (${coffre} sur ${ATTENDUS.length})`, pret: coffre === ATTENDUS.length },
    { quoi: 'Accès WhatsApp remis avec Le Socle', pret: !!process.env.WHATSAPP_SOCLE },
    { quoi: 'Réservation Deep Drive', pret: !!process.env.CALENDLY_DEEPDRIVE },
  ];

  return json({ ok: true, ventes, inscrits, branchement, genere: new Date().toISOString() });
};

