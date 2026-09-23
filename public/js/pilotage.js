/* Le tableau de bord demande ses chiffres à la fonction, en présentant le
   jeton que Decap a mis en mémoire lors de la connexion à l'espace.
   Si Stéphanie n'est pas connectée, on le lui dit simplement. */
(function () {
  var maj = document.getElementById('pil-maj');
  var souci = document.getElementById('pil-souci');
  var contenu = document.getElementById('pil-contenu');
  if (!maj) return;

  var euros = function (n) {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
  };
  var date = function (iso) {
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  };
  var vide = function (texte) {
    return '<p class="pil-vide">' + texte + '</p>';
  };

  function jeton() {
    try {
      var brut = localStorage.getItem('decap-cms-user') || localStorage.getItem('netlify-cms-user');
      if (!brut) return null;
      return (JSON.parse(brut) || {}).token || null;
    } catch (e) { return null; }
  }

  function erreur(texte, lien) {
    maj.hidden = true;
    souci.innerHTML = texte + (lien ? ' <a href="/admin/">Ouvrir mon espace</a>' : '');
    souci.hidden = false;
  }

  var t = jeton();
  if (!t) {
    erreur('Connecte toi d’abord à ton espace, puis reviens ici.', true);
    return;
  }

  fetch('/api/pilotage', { headers: { Authorization: 'Bearer ' + t }, cache: 'no-store' })
    .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
    .then(function (res) {
      if (!res.ok || !res.d.ok) {
        erreur('Ta session a expiré. Reconnecte toi à ton espace, puis reviens.', true);
        return;
      }
      var d = res.d;
      maj.textContent = 'À jour au ' + new Date(d.genere).toLocaleString('fr-FR', {
        day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
      });

      /* Les chiffres du mois */
      var v = d.ventes, i = d.inscrits, c = '';
      if (v.configure && !v.erreur) {
        c += '<div class="pil-carte"><span class="pil-nombre">' + euros(v.total) + '</span><span class="pil-label">encaissé</span></div>';
        c += '<div class="pil-carte"><span class="pil-nombre">' + v.nombre + '</span><span class="pil-label">' + (v.nombre > 1 ? 'ventes' : 'vente') + '</span></div>';
      } else {
        c += '<div class="pil-carte pil-carte-attente"><span class="pil-nombre">—</span><span class="pil-label">' +
             (v.erreur || 'Stripe pas encore branché') + '</span></div>';
      }
      if (i.configure && !i.erreur) {
        c += '<div class="pil-carte"><span class="pil-nombre">' + i.total + '</span><span class="pil-label">inscrits</span></div>';
      }
      document.getElementById('pil-chiffres').innerHTML = c;

      /* Les dernières ventes */
      var zv = document.getElementById('pil-ventes');
      if (!v.configure) {
        zv.innerHTML = vide('Stripe n’est pas encore branché. Dès qu’il le sera, tes ventes apparaîtront ici.');
      } else if (v.erreur) {
        zv.innerHTML = vide(v.erreur);
      } else if (!v.dernieres.length) {
        zv.innerHTML = vide('Aucune vente sur les 30 derniers jours.');
      } else {
        var l = '<table class="pil-table"><thead><tr><th>Quand</th><th>Quoi</th><th>Qui</th><th>Montant</th></tr></thead><tbody>';
        v.dernieres.forEach(function (x) {
          l += '<tr><td>' + date(x.quand) + '</td><td>' + x.quoi + '</td><td class="pil-discret">' +
               (x.qui || '—') + '</td><td><strong>' + euros(x.montant) + '</strong></td></tr>';
        });
        l += '</tbody></table>';
        if (v.rembourses) l += '<p class="pil-discret">' + v.rembourses + ' remboursement(s) sur la période.</p>';
        else if (v.rembourses === null) l += '<p class="pil-discret">Les remboursements, s’il y en a, se voient dans Stripe.</p>';
        zv.innerHTML = l;
      }

      /* Les listes */
      var zi = document.getElementById('pil-inscrits');
      if (!i.configure) {
        zi.innerHTML = vide('Brevo n’est pas encore branché.');
      } else if (i.erreur) {
        zi.innerHTML = vide(i.erreur);
      } else if (!i.listes.length) {
        zi.innerHTML = vide('Aucune liste pour le moment.');
      } else {
        var li = '<table class="pil-table"><thead><tr><th>Liste</th><th>Inscrits</th></tr></thead><tbody>';
        i.listes.forEach(function (x) {
          li += '<tr><td>' + x.nom + '</td><td><strong>' + x.nombre + '</strong></td></tr>';
        });
        zi.innerHTML = li + '</tbody></table>';
      }

      /* L'état du branchement */
      var zb = document.getElementById('pil-branchement');
      var b = '<ul class="pil-liste">';
      d.branchement.forEach(function (x) {
        b += '<li>' + (x.pret ? '<span class="pil-pastille pil-ok">prêt</span>' : '<span class="pil-pastille pil-attente">à faire</span>') +
             ' ' + x.quoi + '</li>';
      });
      zb.innerHTML = b + '</ul>';

      contenu.hidden = false;
    })
    .catch(function () {
      erreur('Impossible de récupérer tes chiffres pour le moment. Réessaie dans un instant.');
    });
})();
