/**
 * Va chercher le mode d'emploi, et seulement si Stéphanie est connectée.
 *
 * La page ne contient pas le texte. Il est demandé à /api/aide avec la session
 * que son espace d'édition pose dans le navigateur, et la fonction vérifie
 * côté serveur qu'elle a le droit de modifier le site avant de répondre.
 * Sans session, ou avec une session refusée, on ne voit que la porte.
 */
(function () {
  var contenu = document.getElementById('aide-contenu');
  var porte = document.getElementById('aide-porte');
  if (!contenu || !porte) return;

  function jeton() {
    try {
      var brut = localStorage.getItem('decap-cms-user') || localStorage.getItem('netlify-cms-user');
      if (!brut) return null;
      return (JSON.parse(brut) || {}).token || null;
    } catch (e) { return null; }
  }

  function montrerPorte() { porte.hidden = false; contenu.hidden = true; }

  var t = jeton();
  if (!t) { montrerPorte(); return; }

  fetch('/api/aide', { headers: { Authorization: 'Bearer ' + t }, cache: 'no-store' })
    .then(function (r) { return r.ok ? r.text() : Promise.reject(r.status); })
    .then(function (html) {
      /* Ce HTML vient de notre propre fonction, écrit par nous, servi après
         vérification : ce n'est pas une saisie d'utilisateur. */
      contenu.innerHTML = html;
      contenu.hidden = false;
      porte.hidden = true;
    })
    .catch(montrerPorte);
})();
