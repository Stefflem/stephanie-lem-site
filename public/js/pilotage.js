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

      /* Les trois chiffres qui comptent, essais de l'équipe déjà retirés */
      var v = d.ventes, i = d.inscrits, c = '';
      var carte = function (nombre, label) {
        return '<div class="pil-carte"><span class="pil-nombre">' + nombre + '</span><span class="pil-label">' + label + '</span></div>';
      };
      if (v.configure && !v.erreur) {
        c += carte(euros(v.total), 'encaissés sur 30 jours');
        c += carte(v.nombre, (v.nombre > 1 ? 'ventes' : 'vente') + ' sur 30 jours');
      } else {
        c += '<div class="pil-carte pil-carte-attente"><span class="pil-nombre">—</span><span class="pil-label">' +
             (v.erreur || 'Stripe pas encore branché') + '</span></div>';
      }
      if (i.configure && !i.erreur) {
        c += carte(i.total, (i.total > 1 ? 'personnes' : 'personne') + ' dans tes listes' +
             (i.nouveaux ? ', dont ' + i.nouveaux + ' ce mois ci' : ''));
      }
      document.getElementById('pil-chiffres').innerHTML = c;

      /* L'état du site : une ligne verte, le détail seulement s'il y a un souci */
      var soucis = d.branchement.filter(function (x) { return !x.pret; });
      var ze = document.getElementById('pil-etat');
      if (!soucis.length) {
        ze.innerHTML = '<p class="pil-etat">✅ Tout fonctionne : paiements, e-mails et livraison des fichiers.</p>';
      } else {
        ze.innerHTML = '<div class="pil-etat pil-etat-souci">⚠️ Quelque chose est à régler. Préviens Emmanuel :<ul>' +
          soucis.map(function (x) { return '<li>' + x.quoi + '</li>'; }).join('') + '</ul></div>';
      }

      /* Les dernières ventes */
      var zv = document.getElementById('pil-ventes');
      if (!v.configure) {
        zv.innerHTML = vide('Stripe n’est pas encore branché. Dès qu’il le sera, tes ventes apparaîtront ici.');
      } else if (v.erreur) {
        zv.innerHTML = vide(v.erreur);
      } else if (!v.dernieres.length) {
        zv.innerHTML = vide('Pas encore de vente sur les 30 derniers jours. La première apparaîtra ici dans la minute.');
      } else {
        var l = '<table class="pil-table"><thead><tr><th>Quand</th><th>Quoi</th><th>Qui</th><th>Montant</th></tr></thead><tbody>';
        v.dernieres.forEach(function (x) {
          l += '<tr><td>' + date(x.quand) + '</td><td>' + x.quoi + '</td><td class="pil-discret">' +
               (x.qui || '—') + '</td><td><strong>' + euros(x.montant) + '</strong></td></tr>';
        });
        l += '</tbody></table>';
        l += '<p class="pil-discret">Les remboursements, s’il y en a, se voient dans Stripe.</p>';
        zv.innerHTML = l;
      }

      /* Les listes, avec les noms qu'elle comprend */
      var zi = document.getElementById('pil-inscrits');
      if (!i.configure) {
        zi.innerHTML = vide('Brevo n’est pas encore branché.');
      } else if (i.erreur) {
        zi.innerHTML = vide(i.erreur);
      } else if (!i.total) {
        zi.innerHTML = vide('Personne pour le moment. Chaque demande de guide ou message reçu s’ajoutera ici.');
      } else {
        var li = '<table class="pil-table"><tbody>';
        i.listes.forEach(function (x) {
          if (x.nombre) li += '<tr><td>' + x.nom + '</td><td><strong>' + x.nombre + '</strong></td></tr>';
        });
        zi.innerHTML = li + '</tbody></table>';
      }

      contenu.hidden = false;
    })
    .catch(function () {
      erreur('Impossible de récupérer tes chiffres pour le moment. Réessaie dans un instant.');
    });
})();
