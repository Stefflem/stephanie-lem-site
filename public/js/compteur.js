/* Compte à rebours du prix de lancement.
   Il lit une date de fin réelle, posée dans src/site.ts. Quand elle est passée,
   le bloc disparaît de lui même : jamais de compte à rebours qui repart tout seul. */
(function () {
  var bloc = document.querySelector('.v-compteur[data-fin]');
  if (!bloc) return;
  var fin = new Date(bloc.getAttribute('data-fin')).getTime();
  if (isNaN(fin)) { bloc.hidden = true; return; }
  var cible = bloc.querySelector('[data-compteur]');
  function deux(n) { return n < 10 ? '0' + n : '' + n; }
  function tic() {
    var reste = fin - Date.now();
    if (reste <= 0) { bloc.hidden = true; return; }
    var j = Math.floor(reste / 86400000);
    var h = Math.floor(reste / 3600000) % 24;
    var m = Math.floor(reste / 60000) % 60;
    var s = Math.floor(reste / 1000) % 60;
    cible.textContent = (j > 0 ? j + 'j ' : '') + deux(h) + ':' + deux(m) + ':' + deux(s);
  }
  tic();
  setInterval(tic, 1000);
})();
