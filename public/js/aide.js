/**
 * Le mode d'emploi n'est visible qu'une fois connectée à son espace.
 *
 * Même clé que le tableau de bord : la session Decap, posée dans le navigateur
 * quand Stéphanie se connecte sur /admin/. Sans elle, la page n'affiche que
 * la porte. Il n'y a aucun secret dans ce mode d'emploi, l'objectif est
 * qu'un visiteur ne tombe pas sur une page qui ne lui est pas adressée.
 */
(function () {
  var contenu = document.getElementById('aide-contenu');
  var porte = document.getElementById('aide-porte');
  if (!contenu || !porte) return;

  function connectee() {
    try {
      var brut = localStorage.getItem('decap-cms-user') || localStorage.getItem('netlify-cms-user');
      return !!(brut && (JSON.parse(brut) || {}).token);
    } catch (e) { return false; }
  }

  if (connectee()) { contenu.hidden = false; porte.hidden = true; }
  else { porte.hidden = false; contenu.hidden = true; }
})();
