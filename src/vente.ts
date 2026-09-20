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
      guideOffert: d.fichier_guide_offert,
      tenirLespace: d.fichier_tenir_lespace,
      quickStart: d.fichier_quick_start,
      hypnosePeur: d.fichier_hypnose_peur,
      hypnoseAncrage: d.fichier_hypnose_ancrage,
      telegram: d.lien_telegram,
    },
  };
}
