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

/** Les ventes Stripe des N derniers jours. */
export async function ventesStripe(cle, jours = 30, fetchImpl = fetch) {
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
  const total = payees.reduce((s, x) => s + (x.amount_total ?? 0), 0);
  return {
    configure: true,
    jours,
    nombre: payees.length,
    total: enEuros(total),
    /* Les remboursements ne se voient pas sur une session. On ne les invente
       pas : la page renvoie vers Stripe pour ça. */
    rembourses: null,
    dernieres: payees.slice(0, 8).map((x) => ({
      montant: enEuros(x.amount_total ?? 0),
      quoi: (x.line_items?.data ?? []).map((l) => l.description).filter(Boolean).join(' + ') || 'Paiement',
      qui: x.customer_details?.email || x.customer_email || '',
      quand: new Date(x.created * 1000).toISOString(),
    })),
  };
}

/** Les listes Brevo et leurs effectifs. */
export async function inscritsBrevo(cle, fetchImpl = fetch) {
  if (!cle) return { configure: false };
  const entetes = { 'api-key': cle, accept: 'application/json' };
  const r = await fetchImpl('https://api.brevo.com/v3/contacts/lists?limit=50', { headers: entetes });
  if (!r.ok) return { configure: true, erreur: 'Brevo a refusé la demande' };
  const d = await r.json();
  const listes = (d.lists ?? [])
    .map((l) => ({ nom: l.name, nombre: l.totalSubscribers ?? 0, id: l.id }))
    .sort((a, b) => b.nombre - a.nombre);
  return { configure: true, total: listes.reduce((s, l) => s + l.nombre, 0), listes };
}

export default async (req) => {
  const entete = req.headers.get('authorization') || '';
  const jeton = entete.startsWith('Bearer ') ? entete.slice(7) : '';

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
};import { getStore } from '@netlify/blobs';

