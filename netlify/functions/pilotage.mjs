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
  const depuis = Math.floor(Date.now() / 1000) - jours * 86400;
  const r = await fetchImpl(`https://api.stripe.com/v1/charges?limit=100&created[gte]=${depuis}`, {
    headers: { Authorization: 'Basic ' + Buffer.from(cle + ':').toString('base64') },
  });
  if (!r.ok) return { configure: true, erreur: 'Stripe a refusé la demande' };
  const d = await r.json();
  const reussies = (d.data ?? []).filter((c) => c.paid && c.status === 'succeeded' && !c.refunded);
  const total = reussies.reduce((s, c) => s + c.amount, 0);
  const rembourses = (d.data ?? []).filter((c) => c.refunded).length;
  return {
    configure: true,
    jours,
    nombre: reussies.length,
    total: enEuros(total),
    rembourses,
    dernieres: reussies.slice(0, 8).map((c) => ({
      montant: enEuros(c.amount),
      quoi: c.description || c.calculated_statement_descriptor || 'Paiement',
      qui: c.billing_details?.email || c.receipt_email || '',
      quand: new Date(c.created * 1000).toISOString(),
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

  /* L'état du branchement, calculé et non supposé. C'est ce qui dit à
     Stéphanie et à Emmanuel ce qui reste à faire, sans avoir à chercher. */
  const branchement = [
    { quoi: 'Encaissement Stripe', pret: !!process.env.STRIPE_SECRET_KEY },
    { quoi: 'Envoi des e-mails Brevo', pret: !!process.env.BREVO_API_KEY },
    { quoi: 'Livraison des fichiers payants', pret: !!process.env.SIGNATURE_SECRET && !!process.env.STRIPE_PRICE_SOCLE },
    { quoi: 'Canal Telegram du Socle', pret: !!process.env.TELEGRAM_INVITE },
    { quoi: 'Réservation Deep Drive', pret: !!process.env.CALENDLY_DEEPDRIVE },
  ];

  return json({ ok: true, ventes, inscrits, branchement, genere: new Date().toISOString() });
};
