/**
 * Quelles offres sont en ligne, et lesquelles sont en pause.
 *
 * Une seule case à cocher dans son espace, « Page en ligne », décide de tout :
 * la page affiche un message d'attente, sort du menu, du pied de page et de la
 * liste des offres, et n'est plus proposée à Google.
 *
 * L'adresse continue de répondre. Un lien déjà partagé, dans un mail ou sur
 * Instagram, ne tombe donc jamais dans le vide.
 */
import { getCollection } from 'astro:content';

/** Adresse publique de chaque page de vente, par identifiant de contenu. */
export const ADRESSES: Record<string, string> = {
  lesocle: '/lesocle/',
  guideoffert: '/guideoffert/',
  latraversee: '/latraversee/',
  deepdrive: '/deepdrive/',
  ysaline: '/ysaline/',
  etudenoelfinlande: '/etudenoelfinlande/',
};

/** Les adresses des pages mises en pause. */
export async function adressesEnPause(): Promise<Set<string>> {
  const pages = await getCollection('vente');
  const pause = pages.filter((p) => p.data.en_ligne === false).map((p) => ADRESSES[p.id]);
  return new Set(pause.filter(Boolean));
}

/** Retire d'une liste de liens ceux qui mènent à une page en pause. */
export async function sansLesPauses<T extends { href: string }>(liens: T[]): Promise<T[]> {
  const pause = await adressesEnPause();
  return liens.filter((l) => !pause.has(l.href));
}
