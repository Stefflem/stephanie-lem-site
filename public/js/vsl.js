/**
 * La page de la vidéo : ce qu'on compte, et le calendrier dans la page.
 *
 * Le bouton de réservation garde son lien vers Cal.com, pour qui n'a pas de
 * JavaScript. Avec, il ouvre le calendrier DANS la page, sous le bouton :
 * rien ne quitte le site, et rien n'est chargé chez Cal.com avant que la
 * visiteuse ait cliqué, c'est son geste qui déclenche le service.
 *
 * Cal.com en version gratuite ne sait pas renvoyer vers une page après la
 * réservation. Mais son calendrier annonce à la page qui l'héberge quand une
 * réservation est confirmée. On écoute ce message, et c'est le site qui
 * envoie vers /merci-rdv/. Seuls les messages venant de cal.com sont acceptés.
 */
(function () {
  var ev = function (nom, p) { if (typeof window.stellaeEvenement === 'function') window.stellaeEvenement(nom, p); };
  var ici = location.pathname.replace(/\/$/, '').split('/').pop() || 'accueil';

  /* La vidéo : lancement, et ce qu'on compte. */
  var v = document.getElementById('vsl');
  var lancer = document.getElementById('lancer');
  if (v && lancer) {
    lancer.addEventListener('click', function () {
      v.parentNode.classList.add('en-lecture');
      v.setAttribute('controls', '');
      v.play();
    });
  }
  if (v) {
    var lu = false;
    v.addEventListener('play', function () { if (!lu) { lu = true; ev('video_lecture', { depuis: ici }); } });
    v.addEventListener('ended', function () { ev('video_fin', { depuis: ici }); });
  }

  /* Le calendrier dans la page. */
  var ORIGINES = ['https://cal.com', 'https://app.cal.com'];
  var boutons = Array.prototype.slice.call(document.querySelectorAll('a.btn[href*="cal.com/"]'));
  if (!boutons.length) return;
  var cadre = null;

  function ouvrir(href) {
    ev('rdv_clic', { depuis: ici });
    if (cadre) { cadre.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    var url = new URL(href);
    url.searchParams.set('embed', 'true'); url.searchParams.set('embedType', 'inline'); url.searchParams.set('layout', 'month_view');
    cadre = document.createElement('div');
    cadre.className = 'v-cal';
    cadre.innerHTML = '<p class="v-cal-titre">Choisis ton créneau</p>';
    var f = document.createElement('iframe');
    f.src = url.toString(); f.title = 'Réserver un temps d\'échange'; f.setAttribute('loading', 'eager');
    cadre.appendChild(f);
    boutons[0].closest('.actions').insertAdjacentElement('afterend', cadre);
    setTimeout(function () { cadre.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 150);
  }

  boutons.forEach(function (b) {
    b.addEventListener('click', function (e) { e.preventDefault(); ouvrir(b.getAttribute('href')); });
  });

  window.addEventListener('message', function (e) {
    if (ORIGINES.indexOf(e.origin) === -1) return;
    var d = e.data; if (!d || d.originator !== 'CAL') return;
    if (d.type === '__dimensionChanged' && d.data && d.data.iframeHeight && cadre) {
      cadre.querySelector('iframe').style.height = Math.max(520, Math.ceil(d.data.iframeHeight) + 8) + 'px';
    }
    if (d.type === 'bookingSuccessful' || d.type === 'bookingSuccessfulV2') {
      ev('rdv_confirme', { depuis: ici });
      location.assign('/merci-rdv/');
    }
  });
})();
