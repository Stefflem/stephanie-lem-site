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
 * ✅ CHOISIE LE 2026-09-20 : « Lagon sable », soit 'lagon'.
 * Accent #0F4C5C sur fond sable #F7F3ED. C'est exactement le bleu de ses
 * pages systeme.io, reposé sur un fond chaud. REVUE_PALETTE est passé à
 * false dans src/revue.ts, la barre de comparaison a disparu.
 */
export const PALETTE: '' | 'lagon-clair' | 'lagon' | 'marron-vert' | 'petrole' = 'lagon';

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
   ⚠️ Ils ne sont plus ici. Ils vivent dans src/content/reglages/vente.md et
   Stéphanie les modifie depuis /admin/, rubrique « Boutique et livraison » :
   prix, liens de paiement, liens de téléchargement, fin de promotion, adresse
   de contact. Une page les lit par `await reglagesVente()` (src/vente.ts).
   Ne rien remettre ici, sinon il y a deux sources de vérité.
   ========================================================================== */


/**
 * MODE APERÇU
 * true  : la maquette montre tout le parcours sans encaisser. Le bouton du Socle
 *         mène à la page d'accès, un bandeau le dit, et les fichiers manquants
 *         s'affichent comme des exemples.
 * false : comportement réel, à passer le jour de la mise en ligne.
 */
export const APERCU = true;
