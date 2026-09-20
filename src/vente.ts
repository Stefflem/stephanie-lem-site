/**
 * Réglages commerciaux, modifiables par Stéphanie depuis son espace.
 *
 * Ils vivaient dans src/site.ts, donc dans le code, donc seul Emmanuel pouvait
 * les changer. Ils sont maintenant dans src/content/reglages/vente.md, édité
 * depuis /admin/, rubrique « Boutique et livraison ».
 *
 * Usage dans une page : const VENTE = await reglagesVente();
 * La forme de l'objet n'a pas changé, VENTE.soclePrix marche comme avant.
 */
import { getEntry } from 'astro:content';

export async function reglagesVente() {
  const e = await getEntry('reglages', 'vente');
  const d = e?.data;
  if (!d) throw new Error('src/content/reglages/vente.md manquant');
  return {
    socleLienPaiement: d.socle_lien_paiement,
    soclePrix: d.socle_prix,
    soclePrixBarre: d.socle_prix_barre,
    socleFinPromo: d.socle_fin_promo,
    ysalineLienPaiement: d.ysaline_lien_paiement,
    ysalinePrix: d.ysaline_prix,
    contact: d.contact,
    fichiers: {
      /** Le guide offert n'est pas payant, un lien public ne coûte rien.
       *  Les fichiers du Socle ne sont pas ici : un lien posé dans une page
       *  publique est un lien public, donc un produit payant qui ne l'est
       *  plus. Ils passent par netlify/functions/, contre paiement vérifié. */
      guideOffert: d.fichier_guide_offert,
    },
  };
}
