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

import { jourAParis } from '../lib/dates.mjs';
import { tropSollicite } from '../lib/debit.mjs';

/** Inscriptions acceptées depuis une même adresse, par heure.
 *
 *  Le formulaire est public : n'importe qui peut l'envoyer avec l'adresse
 *  d'une autre personne, ce qui fabrique une preuve de consentement au nom de
 *  Stéphanie. On ne peut pas l'empêcher entièrement sans captcha, mais on peut
 *  empêcher que ce soit fait en série. Une visiteuse remplit un formulaire,
 *  parfois deux, jamais quinze. */
const PAR_ADRESSE = 5;
const PAR_ADRESSE_MS = 60 * 60 * 1000;

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
const coche = (v) => ['oui', 'on', 'true'].includes(String(v ?? '').toLowerCase());

export function veutLaSuite(form, data) {
  if (form !== 'guide') return true;
  return coche(data.suite);
}

/** Accord pour être appelée ou contactée sur WhatsApp. Jamais présumé, jamais
 *  déduit de l'accord e-mail : depuis le 11 août 2026, démarcher par téléphone
 *  un particulier sans accord préalable et prouvable est interdit. */
export function veutEtreAppelee(data) {
  return coche(data.appel);
}

/** Numéro au format international attendu par Brevo. Un numéro français saisi
 *  en 06… devient +336…. Tout ce qui n'est pas exploitable est écarté plutôt
 *  que transmis de travers. */
export function telephoneInternational(brut) {
  const v = String(brut ?? '').replace(/[\s.\-()]/g, '');
  if (!v) return undefined;
  if (/^\+[1-9]\d{7,14}$/.test(v)) return v;
  if (/^0[1-9]\d{8}$/.test(v)) return '+33' + v.slice(1);
  if (/^33[1-9]\d{8}$/.test(v)) return '+' + v;
  return undefined;
}

export function contactBrevo(data, form) {
  const email = String(data.email ?? '').trim().toLowerCase();
  const tel = telephoneInternational(data.telephone);
  const okMail = veutLaSuite(form, data);
  const okTel = veutEtreAppelee(data);
  /* La date d'accord est la preuve. Sans elle, un consentement ne vaut rien
     le jour où quelqu'un demande sur quoi on se fonde pour l'avoir appelée. */
  const leJour = jourAParis();
  return {
    email,
    attributes: {
      PRENOM: String(data.prenom ?? data.nom ?? '').trim() || undefined,
      SOURCE: `site:${form}`,
      MESSAGE: form === 'contact' ? String(data.message ?? '').slice(0, 2000) || undefined : undefined,
      SMS: tel,
      /* Le numéro est conservé même sans accord d'appel : il sert à la
         reconnaître si elle écrit. Ce sont les deux drapeaux ci dessous qui
         disent ce qu'on a le droit d'en faire. */
      /* Un accord s'ajoute, il ne se retire JAMAIS depuis un formulaire public.
         N'importe qui peut envoyer ce formulaire avec l'adresse d'une vraie
         inscrite : écrire 'non' ici la sortirait des envois de Stéphanie, et
         écraserait son prénom et son numéro au passage. Un champ laissé vide
         n'écrase rien chez Brevo, c'est ce qu'on veut. Le retrait du
         consentement se fait par le lien de désinscription, qui est tracé. */
      OPTIN_EMAIL: okMail ? 'oui' : undefined,
      OPTIN_TEL: tel && okTel ? 'oui' : undefined,
      DATE_CONSENTEMENT: okMail || okTel ? leJour : undefined,
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

  /* Netlify a déjà enregistré la soumission quand cette fonction est appelée :
     ce compteur ne protège pas le quota du formulaire, il protège le fichier
     de contacts de Stéphanie et la valeur de ses preuves de consentement. */
  const ip =
    charge?.payload?.ip ||
    req.headers.get('x-nf-client-connection-ip') ||
    (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() ||
    'inconnue';
  if (await tropSollicite(`form-${ip}`, PAR_ADRESSE, PAR_ADRESSE_MS)) {
    console.warn(`[brevo] trop d'envois depuis ${ip}, contact non écrit`);
    return new Response('', { status: 200 });
  }

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
