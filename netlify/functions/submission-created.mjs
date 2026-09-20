/**
 * Pousse dans Brevo chaque formulaire envoyé depuis le site.
 *
 * Nom de fichier imposé : Netlify appelle automatiquement une fonction nommée
 * `submission-created` à chaque soumission de formulaire Netlify. On garde donc
 * Netlify Forms (piège à robots, notification à Stéphanie) ET Brevo, sans que
 * la page ait à parler à Brevo : la clé reste côté serveur, et la politique de
 * sécurité du site reste en default-src 'self'.
 *
 * Variables d'environnement, à poser chez Netlify et jamais dans le dépôt :
 *   BREVO_API_KEY         la clé API v3 de son compte Brevo
 *   BREVO_LISTE_GUIDE     identifiant de la liste « guide offert »
 *   BREVO_LISTE_CONTACT   identifiant de la liste « demandes de contact »
 *   BREVO_LISTE_WEBINAIRE identifiant de la liste « étude de cas »
 */

/** Quel formulaire alimente quelle liste. Un formulaire inconnu n'écrit rien. */
export const LISTES = {
  guide: 'BREVO_LISTE_GUIDE',
  contact: 'BREVO_LISTE_CONTACT',
  webinaire: 'BREVO_LISTE_WEBINAIRE',
};

/**
 * Le consentement ne se présume pas.
 * Pour le guide, la case « recevoir ses conseils » décide de l'inscription à
 * la liste marketing. Sans elle, le guide part quand même, par Netlify, mais
 * personne n'entre dans la séquence.
 * Pour le contact et le webinaire, la demande elle même est l'objet du
 * traitement : on enregistre, sans opt in marketing.
 */
export function veutLaSuite(form, data) {
  if (form !== 'guide') return true;
  const v = String(data.suite ?? '').toLowerCase();
  return v === 'oui' || v === 'on' || v === 'true';
}

export function contactBrevo(data, form) {
  const email = String(data.email ?? '').trim().toLowerCase();
  return {
    email,
    attributes: {
      PRENOM: String(data.prenom ?? data.nom ?? '').trim() || undefined,
      SOURCE: `site:${form}`,
      MESSAGE: form === 'contact' ? String(data.message ?? '').slice(0, 2000) || undefined : undefined,
    },
    updateEnabled: true,
  };
}

const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default async (req) => {
  const cle = process.env.BREVO_API_KEY;
  if (!cle) { console.warn('[brevo] BREVO_API_KEY absente, rien envoyé'); return new Response('', { status: 200 }); }

  let charge;
  try { charge = await req.json(); } catch { return new Response('', { status: 200 }); }

  const form = charge?.payload?.form_name ?? charge?.form_name ?? '';
  const data = charge?.payload?.data ?? charge?.data ?? {};
  const nomVar = Object.hasOwn(LISTES, form) ? LISTES[form] : null;
  if (!nomVar) { console.warn(`[brevo] formulaire inconnu : ${form}`); return new Response('', { status: 200 }); }

  const contact = contactBrevo(data, form);
  if (!EMAIL_OK.test(contact.email)) { console.warn('[brevo] e-mail invalide, ignoré'); return new Response('', { status: 200 }); }

  const liste = process.env[nomVar];
  if (liste && veutLaSuite(form, data)) contact.listIds = [Number(liste)];

  try {
    const r = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: { 'api-key': cle, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(contact),
    });
    // 201 créé, 204 mis à jour, 400 « contact already exist » quand updateEnabled ne suffit pas
    if (!r.ok && r.status !== 204) console.warn(`[brevo] réponse ${r.status}`);
  } catch (e) {
    // Ne jamais faire échouer la soumission : Netlify a déjà le message,
    // Stéphanie a déjà sa notification. Brevo est un plus, pas un passage obligé.
    console.warn('[brevo] appel impossible', e?.message);
  }
  return new Response('', { status: 200 });
};
