// Invitation au tableau de bord : Netlify envoie un lien vers la racine du site, on renvoie vers /admin/
if (window.netlifyIdentity) {
  window.netlifyIdentity.on('init', function (user) {
    if (!user) window.netlifyIdentity.on('login', function () { document.location.href = '/admin/'; });
  });
}
