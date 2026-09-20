/* Demande à la fonction ce qui a été acheté. Elle ne répond qu'après avoir
   vérifié le paiement auprès de Stripe. */
(function () {
  var liste = document.getElementById('liste');
  var attente = document.getElementById('attente');
  var souci = document.getElementById('souci');
  var intro = document.getElementById('intro');
  var titre = document.getElementById('titre');
  var apercu = document.querySelector('.apercu-liste');
  if (!liste) return;

  var session = new URLSearchParams(location.search).get('session_id');
  if (!session) { attente.hidden = true; return; } // ouverte sans venir de Stripe
  if (apercu) apercu.hidden = true;

  fetch('/api/acces?session_id=' + encodeURIComponent(session), { cache: 'no-store' })
    .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
    .then(function (res) {
      attente.hidden = true;
      if (!res.ok || !res.d.ok) {
        souci.textContent = (res.d && res.d.message) || "Votre paiement n'a pas pu être vérifié.";
        souci.hidden = false;
        return;
      }
      if (res.d.titre) titre.textContent = res.d.titre;
      if (res.d.intro) { intro.textContent = res.d.intro; intro.hidden = false; }
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
      souci.textContent = 'Vérification impossible pour le moment. Réessayez dans un instant.';
      souci.hidden = false;
    });
})();
