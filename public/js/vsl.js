/** Compte ce qui compte sur la page de la vidéo : lecture, fin, clic vers le
 *  rendez-vous. Ne fait rien tant que la mesure n'est pas acceptée. */
(function () {
  var v = document.getElementById('vsl');
  var ev = function (nom, p) { if (typeof window.stellaeEvenement === 'function') window.stellaeEvenement(nom, p); };
  var lancer = document.getElementById('lancer');
  if (v && lancer) {
    /* Au clic : l'habillage s'efface, les commandes natives apparaissent, la
       vidéo démarre avec le son (c'est un geste de l'utilisatrice, autorisé). */
    lancer.addEventListener('click', function () {
      v.parentNode.classList.add('en-lecture');
      v.setAttribute('controls', '');
      v.play();
    });
  }
  if (v) {
    var lu = false;
    v.addEventListener('play', function () { if (!lu) { lu = true; ev('video_lecture'); } });
    v.addEventListener('ended', function () { ev('video_fin'); });
  }
  document.querySelectorAll('a.btn[href]').forEach(function (a) {
    if (/temps d'échange|Réserver/i.test(a.textContent)) a.addEventListener('click', function () { ev('rdv_clic', { depuis: 'merci-guide' }); });
  });
})();
