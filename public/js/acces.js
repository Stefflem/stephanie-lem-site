/* Demande les liens de téléchargement à la fonction, qui ne les délivre
   qu'après avoir vérifié le paiement auprès de Stripe. */
(function () {
  var liste = document.getElementById('liste');
  var attente = document.getElementById('attente');
  var souci = document.getElementById('souci');
  var apercu = document.querySelector('.apercu-liste');
  if (!liste) return;

  var session = new URLSearchParams(location.search).get('session_id');
  if (!session) {
    attente.hidden = true;
    return; // page ouverte sans venir de Stripe : on ne montre rien
  }
  if (apercu) apercu.hidden = true;

  fetch('/api/acces?session_id=' + encodeURIComponent(session), { cache: 'no-store' })
    .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
    .then(function (res) {
      attente.hidden = true;
      if (!res.ok || !res.d.ok) {
        souci.textContent = res.d && res.d.message ? res.d.message : 'Ton paiement n’a pas pu être vérifié.';
        souci.hidden = false;
        return;
      }
      res.d.items.forEach(function (i) {
        var a = document.createElement('a');
        a.href = i.lien;
        if (i.externe) { a.target = '_blank'; a.rel = 'noopener'; }
        a.innerHTML = '<span class="v-acces-nom"></span><span class="v-acces-act"></span>';
        a.querySelector('.v-acces-nom').textContent = i.nom;
        a.querySelector('.v-acces-act').textContent = i.act;
        liste.appendChild(a);
      });
      liste.hidden = false;
    })
    .catch(function () {
      attente.hidden = true;
      souci.textContent = 'Vérification impossible pour le moment. Réessaie dans un instant.';
      souci.hidden = false;
    });
})();
