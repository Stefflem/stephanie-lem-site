/**
 * Réglages du site qui ne sont pas du contenu.
 *
 * MESURE D'AUDIENCE
 * Par défaut : aucune. Le site ne dépose alors aucun cookie, donc aucune bannière
 * de consentement n'est nécessaire, ce qu'annonce sa politique de confidentialité.
 *
 * Deux outils sans cookie sont prêts, il suffit de remplir les valeurs :
 *   - umami    : gratuit si auto hébergé, par exemple sur le VPS WF4L
 *   - plausible: hébergé, payant, rien à administrer
 *
 * ⚠️ Google Analytics n'est volontairement pas branché ici. Il dépose des cookies,
 * ce qui impose en France une bannière de consentement conforme CNIL et une
 * réécriture de la politique de confidentialité. C'est un lot à part, à chiffrer.
 * Le brancher sans bannière mettrait Stéphanie en infraction.
 */

export type Audience =
  | { outil: 'aucune' }
  | { outil: 'umami'; src: string; siteId: string }
  | { outil: 'plausible'; domaine: string };

export const AUDIENCE: Audience = { outil: 'aucune' };

// Exemples, à recopier par dessus la ligne ci dessus le jour venu :
//   export const AUDIENCE: Audience = { outil: 'umami', src: 'https://stats.exemple.fr/script.js', siteId: '00000000-0000-0000-0000-000000000000' };
//   export const AUDIENCE: Audience = { outil: 'plausible', domaine: 'stephanielem.fr' };


/* ==========================================================================
   VENTE · réglages des pages rapatriées de systeme.io
   Tout ce qui doit changer se change ici, jamais dans les pages.
   ========================================================================== */

export const VENTE = {
  /** Lien de paiement Stripe pour Le Socle. Vide = le bouton renvoie vers le contact. */
  socleLienPaiement: '',

  /** Prix affichés. Le prix barré disparaît s'il est vide. */
  soclePrix: '111 €',
  soclePrixBarre: '144 €',

  /**
   * Fin réelle du prix de lancement, au format 2026-10-01T23:59:00+02:00.
   * Vide = aucun compte à rebours affiché.
   * ⚠️ Ne jamais remettre une date à chaque visite : un compte à rebours qui
   * repart sans cesse est trompeur et abîme la confiance.
   */
  socleFinPromo: '',

  /** Adresse où écrire, affichée en bas des pages de vente. */
  contact: 'contact@stephanielem.fr',

  /** Liens de téléchargement, remis après paiement ou après inscription. */
  fichiers: {
    guideOffert: '',      // Déclic immersif, PDF
    tenirLespace: '',     // guide Tenir l'espace, PDF
    quickStart: '',       // guide Quick Start 7 jours, PDF
    hypnosePeur: '',      // audio
    hypnoseAncrage: '',   // audio
    telegram: '',         // invitation au canal privé
  },
} as const;
