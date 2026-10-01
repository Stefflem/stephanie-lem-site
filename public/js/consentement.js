/**
 * Consentement à la mesure d'audience.
 *
 * Ce code vit dans un fichier servi, et non en ligne dans la page, pour une
 * raison de sécurité : la politique du site interdit les scripts en ligne
 * (`script-src 'self'`). Un bandeau écrit en ligne serait bloqué par le
 * navigateur, et ses boutons ne répondraient pas. Un bandeau de consentement
 * muet est un problème réglementaire, pas un détail d'affichage.
 *
 * Les règles, ce sont celles que la CNIL contrôle :
 *   1. rien ne part avant le choix ;
 *   2. refuser est aussi simple qu'accepter ;
 *   3. le choix se change à tout moment, depuis le pied de page ;
 *   4. un refus efface aussi ce qui aurait été déposé avant.
 */
(function () {
  var CLE = 'stellae_mesure';
  var boite = document.getElementById('consentement');
  if (!boite) return;
  var ga = boite.dataset.ga;
  var jours = Number(boite.dataset.jours || 182);
  if (!ga) return;

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  /* Avant tout chargement : tout est refusé. Si une balise arrivait par un
     autre chemin, elle mesurerait sans cookie plutôt que d'en poser un. */
  gtag('consent', 'default', {
    ad_storage: 'denied', ad_user_data: 'denied',
    ad_personalization: 'denied', analytics_storage: 'denied',
    wait_for_update: 500,
  });

  function lire() {
    try {
      var brut = localStorage.getItem(CLE);
      if (!brut) return null;
      var s = JSON.parse(brut);
      if ((Date.now() - s.at) / 86400000 > jours) return null;
      return s.choix;
    } catch (e) { return null; }
  }

  /* Un refus doit aussi effacer ce qui traîne, sinon la visiteuse reste
     identifiée alors qu'elle a dit non. */
  function effacer() {
    var hote = location.hostname;
    var domaines = [hote, '.' + hote, '.' + hote.split('.').slice(-2).join('.')];
    document.cookie.split(';').forEach(function (part) {
      var nom = part.split('=')[0].trim();
      if (!/^(_ga|_gid|_gat)/.test(nom)) return;
      domaines.forEach(function (d) {
        document.cookie = nom + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=' + d;
      });
      document.cookie = nom + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    });
  }

  var charge = false;
  function charger() {
    if (charge) return;
    charge = true;
    gtag('consent', 'update', { analytics_storage: 'granted' });
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ga;
    document.head.appendChild(s);
    gtag('js', new Date());
    gtag('config', ga, { anonymize_ip: true });
  }

  function afficher(oui) { boite.hidden = !oui; }

  function choisir(choix) {
    try { localStorage.setItem(CLE, JSON.stringify({ choix: choix, at: Date.now() })); } catch (e) {}
    if (choix === 'oui') charger(); else effacer();
    afficher(false);
  }

  /** Un événement, ignoré tant que rien n'est accepté. */
  window.stellaeEvenement = function (nom, param) {
    if (charge && typeof window.gtag === 'function') window.gtag('event', nom, param || {});
  };

  boite.querySelectorAll('[data-choix]').forEach(function (b) {
    b.addEventListener('click', function () { choisir(b.dataset.choix); });
  });
  var rouvrir = document.getElementById('rouvrir-choix');
  if (rouvrir) rouvrir.addEventListener('click', function () { afficher(true); });

  /* Trois moments valent la peine d'être comptés, et seulement trois. */
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href*="buy.stripe.com"]') : null;
    if (a) window.stellaeEvenement('paiement_ouvert', { lien: a.getAttribute('href') });
  });
  if (/^\/merci-guide\/?$/.test(location.pathname)) window.stellaeEvenement('guide_demande');
  if (/^\/merci\/?$/.test(location.pathname)) window.stellaeEvenement('message_envoye');
  if (/^\/merci-rdv\/?$/.test(location.pathname)) window.stellaeEvenement('rdv_confirme');

  var deja = lire();
  if (deja === 'oui') charger();
  else if (deja === null) afficher(true);
})();
