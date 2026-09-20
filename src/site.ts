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

/**
 * PALETTE DE PRODUCTION
 * Vide = marron, la palette par défaut du site.
 * Sinon : 'lagon-clair' | 'lagon' | 'marron-vert' | 'petrole'
 * Une fois que Stéphanie a choisi, poser sa valeur ici et passer
 * REVUE_PALETTE à false dans src/revue.ts. C'est tout.
 */
export const PALETTE: '' | 'lagon-clair' | 'lagon' | 'marron-vert' | 'petrole' = '';

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

/**
 * MODE APERÇU
 * true  : la maquette montre tout le parcours sans encaisser. Le bouton du Socle
 *         mène à la page d'accès, un bandeau le dit, et les fichiers manquants
 *         s'affichent comme des exemples.
 * false : comportement réel, à passer le jour de la mise en ligne.
 */
export const APERCU = true;

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

  /**
   * Lien de paiement pour le roman « La traversée d'Ysaline ».
   * ⚠️ Prix volontairement vide : sa page systeme.io était cassée, le corps
   * reprenait Le Socle, et le 111 € affiché était donc celui du Socle, pas
   * celui du roman. Rien n'est inventé ici, Stéphanie donne son prix et on
   * le pose. Vide = aucun prix affiché sur la page.
   */
  ysalineLienPaiement: '',
  ysalinePrix: '',

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
