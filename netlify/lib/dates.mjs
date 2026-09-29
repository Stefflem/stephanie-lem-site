/**
 * La date du jour à Paris, au format AAAA-MM-JJ.
 *
 * `new Date().toISOString()` donne l'heure de Greenwich : entre minuit et
 * 2 h du matin l'été, il renvoie la veille. Sur une date de consentement,
 * qui est une preuve, c'est la date que la personne a vécue qui compte, pas
 * celle d'un fuseau où elle n'habite pas.
 */
export function jourAParis(quand = new Date()) {
  const parts = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(quand);
  const v = (type) => parts.find((p) => p.type === type)?.value;
  return `${v('year')}-${v('month')}-${v('day')}`;
}
