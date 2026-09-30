/**
 * Compteurs à fenêtre glissante, pour qu'un curieux ne coûte rien.
 *
 * Trois usages, et ce ne sont pas les mêmes dégâts :
 *   - `/api/acces` appelle Stripe à chaque requête. Sans limite, une boucle
 *     brûle les invocations du site et le quota de l'API de Stéphanie.
 *   - `/api/pilotage` appelle GitHub à chaque jeton mal formé mais plausible.
 *     Un volume soutenu fait blacklister l'adresse de sortie de Netlify, et
 *     c'est tout le site qui trinque.
 *   - un lien d'accès partagé publiquement livrerait indéfiniment : le
 *     paiement a eu lieu une fois, la livraison doit rester proportionnée.
 *
 * Le compteur vit dans un coffre Netlify Blobs. Il est volontairement simple :
 * une fenêtre, un nombre. Il ne protège pas d'une attaque distribuée, il
 * protège d'une boucle et d'un partage, ce qui est le risque réel ici.
 */
import { getStore } from '@netlify/blobs';

const COFFRE = 'debit';

/** Le coffre, remplaçable pendant les tests. */
let coffreDe = () => getStore(COFFRE);
export function definirCoffreDebit(fn) { coffreDe = fn; }

/** L'adresse de la visiteuse, telle que Netlify la transmet. */
export function adresseDe(req) {
  const h = req.headers;
  return (
    h.get('x-nf-client-connection-ip') ||
    (h.get('x-forwarded-for') || '').split(',')[0].trim() ||
    'inconnue'
  );
}

/**
 * Incrémente le compteur `cle` et dit si la limite est dépassée.
 * `fenetreMs` remet le compteur à zéro passé ce délai.
 *
 * En cas de coffre indisponible, on laisse passer : mieux vaut servir une
 * cliente que refuser tout le monde parce qu'un service annexe est tombé.
 */
export async function tropSollicite(cle, limite, fenetreMs, maintenant = Date.now()) {
  let coffre;
  try { coffre = coffreDe(); } catch { return false; }
  try {
    const brut = await coffre.get(cle);
    const etat = brut ? JSON.parse(brut) : null;
    const frais = !etat || maintenant - etat.debut > fenetreMs;
    const suivant = frais ? { debut: maintenant, n: 1 } : { debut: etat.debut, n: etat.n + 1 };
    await coffre.set(cle, JSON.stringify(suivant));
    return suivant.n > limite;
  } catch (e) {
    console.warn('[debit] compteur indisponible', e?.message);
    return false;
  }
}
