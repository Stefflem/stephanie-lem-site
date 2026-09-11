/* Comparaison des palettes pendant la relecture.
   Applique le choix mémorisé avant le rendu, puis branche les boutons.
   Ce fichier ne sert plus une fois REVUE_PALETTE passé à false. */
(function () {
  var CLE = 'stellae-variante';
  var VALIDES = ['marron', 'marron-vert', 'lagon', 'lagon-clair', 'petrole'];

  // ?palette=lagon permet d'envoyer un lien direct vers une variante precise
  var force = null;
  try {
    force = new URLSearchParams(location.search).get('palette');
    if (VALIDES.indexOf(force) === -1) force = null;
    if (force) localStorage.setItem(CLE, force);
  } catch (e) {}

  try {
    var v = force || localStorage.getItem(CLE);
    if (v && v !== 'marron' && VALIDES.indexOf(v) !== -1) {
      document.documentElement.setAttribute('data-variante', v);
    } else if (v === 'marron') {
      document.documentElement.removeAttribute('data-variante');
    }
  } catch (e) {}

  function marquer(actuelle) {
    var boutons = document.querySelectorAll('.revue button');
    for (var i = 0; i < boutons.length; i++) {
      boutons[i].setAttribute('aria-pressed', boutons[i].dataset.variante === actuelle ? 'true' : 'false');
    }
  }

  function brancher() {
    var barre = document.querySelector('.revue');
    if (!barre) return;
    var actuelle = document.documentElement.getAttribute('data-variante') || 'marron';
    marquer(actuelle);
    barre.addEventListener('click', function (ev) {
      var b = ev.target.closest('button');
      if (!b) return;
      var choix = b.dataset.variante;
      if (choix === 'marron') {
        document.documentElement.removeAttribute('data-variante');
      } else {
        document.documentElement.setAttribute('data-variante', choix);
      }
      try { localStorage.setItem(CLE, choix); } catch (e) {}
      marquer(choix);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', brancher);
  } else {
    brancher();
  }
})();
