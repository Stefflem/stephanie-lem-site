/**
 * Réglages du site qui ne sont pas du contenu.
 *
 * MESURE D'AUDIENCE
 * Trois outils possibles, et ils ne se valent pas au regard de la loi :
 *   - umami, plausible : aucun cookie, aucun identifiant personnel. Rien à
 *     demander au visiteur, la mesure démarre toute seule.
 *   - ga4 : dépose des cookies. En France, cela impose un consentement
 *     préalable, explicite, et aussi facile à refuser qu'à accepter.
 *
 * ⚠️ Si `ga4` est choisi ici, le bandeau de consentement s'affiche et RIEN
 * n'est chargé tant que la visiteuse n'a pas répondu. C'est `Consentement.astro`
 * qui le garantit. Ne jamais insérer de balise Google ailleurs dans le site :
 * elle contournerait le bandeau et mettrait Stéphanie en infraction.
 *
 * La politique de confidentialité décrit ce réglage. Les deux doivent rester
 * d'accord : changer l'un sans l'autre est une fausse déclaration.
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
  | { outil: 'plausible'; domaine: string }
  /** Google Analytics 4. `id` vaut G-XXXXXXXXXX. Impose le bandeau. */
  | { outil: 'ga4'; id: string };

/** L'identifiant vient de la variable d'environnement PUBLIC_GA_ID : il change
 *  sans toucher au code, et une variable absente éteint proprement la mesure. */
const GA_ID = import.meta.env.PUBLIC_GA_ID as string | undefined;

export const AUDIENCE: Audience = GA_ID ? { outil: 'ga4', id: GA_ID } : { outil: 'aucune' };

/** Durée de validité d'un choix, en jours. La CNIL recommande de redemander
 *  au bout de six mois environ, et interdit de conserver au delà de treize. */
export const CONSENTEMENT_JOURS = 182;

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
export const APERCU = false;
