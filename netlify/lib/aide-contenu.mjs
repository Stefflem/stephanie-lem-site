/**
 * Le mode d'emploi de Stéphanie, en HTML.
 *
 * Il vit ici, et non dans une page du site, pour une raison simple : une page
 * statique est lisible par quiconque ouvre le code source, même masquée. Ce
 * texte n'est servi que par /api/aide, après vérification que la personne
 * connectée a le droit de modifier le site. Un visiteur n'en voit jamais une
 * ligne, ni à l'écran ni dans la source.
 *
 * Ce fichier n'est pas dans public/ : il n'existe pas comme adresse.
 * Écrit pour elle, au tutoiement, sans jargon. Les classes CSS (aide-table,
 * aide-note, reading, page-head) sont celles du site, chargées par la page
 * /aide/ qui accueille ce contenu.
 */
export const CONTENU = `
  <header class="page-head">
    <p class="eyebrow">Pour toi, Stéphanie</p>
    <h1>Mode d'emploi de ton site</h1>
    <p class="head-lead">
      Tout ce que tu peux changer seule, et comment. Garde cette page dans tes favoris.
    </p>
  </header>

  <div class="reading aide">

    <h2>Se connecter</h2>
    <ol>
      <li>Va sur <strong>ton espace</strong> : l'adresse de ton site suivie de <code>/admin</code></li>
      <li>Clique sur <strong>Se connecter avec GitHub</strong></li>
      <li>Une fenêtre s'ouvre, elle te demande d'autoriser. Accepte</li>
    </ol>
    <p class="aide-note">
      GitHub est l'endroit où vivent les textes de ton site. Tu n'as rien à y faire,
      il sert uniquement à vérifier que c'est bien toi.
    </p>

    <h2>Ton tableau de bord</h2>
    <p>
      Dans ton espace, en haut à gauche, il y a une entrée <strong>Tableau de bord</strong>.
      C'est l'endroit qui répond à « comment va mon activité ».
    </p>
    <ul>
      <li>ce que tu as encaissé sur les 30 derniers jours, et combien de ventes</li>
      <li>tes dernières ventes, avec qui, quoi et combien</li>
      <li>le nombre d'inscrits sur chacune de tes listes</li>
      <li>l'état de tes offres, en ligne ou en pause</li>
    </ul>
    <p class="aide-note">
      Tes chiffres n'y sont visibles que si tu es connectée à ton espace.
      Personne d'autre ne peut y accéder, même en connaissant l'adresse.
    </p>

    <h2>Les six rubriques de ton espace</h2>
    <table class="aide-table">
      <thead><tr><th>Rubrique</th><th>Ce qu'elle contient</th></tr></thead>
      <tbody>
        <tr><td>Articles du blog</td><td>Tes articles. Tu peux en ajouter autant que tu veux</td></tr>
        <tr><td>Projets en cours</td><td>Les retraites que tu accompagnes, avec leur photo</td></tr>
        <tr><td>Pages que je crée</td><td>Pour fabriquer une page entièrement nouvelle</td></tr>
        <tr><td>Boutique et livraison</td><td>Tes prix, tes liens de paiement Stripe, le lien de ta fiche Lulu, ton adresse de contact</td></tr>
        <tr><td>Pages de vente</td><td>Le Socle, La Traversée, Deep Drive, le roman, le guide offert</td></tr>
        <tr><td>Pages du site</td><td>Accueil, Y voir clair, À propos, Contact, mentions légales, et le bloc « Mes offres » où chaque offre a sa famille</td></tr>
      </tbody>
    </table>

    <h2>Changer un texte</h2>
    <ol>
      <li>Ouvre la rubrique, puis la page concernée</li>
      <li>Modifie le texte directement</li>
      <li>En haut, clique sur <strong>Publier</strong></li>
    </ol>
    <p><strong>Compte une à deux minutes</strong> avant de voir le changement en ligne. Rafraîchis la page de ton site.</p>

    <h2>Écrire un article</h2>
    <ol>
      <li>Rubrique <strong>Articles du blog</strong>, bouton <strong>+ Article</strong></li>
      <li>Remplis le titre, la date, et ton texte</li>
      <li><strong>Publier</strong></li>
    </ol>
    <p class="aide-note">
      Le champ <strong>Titre affiché dans Google</strong> est facultatif. Il sert quand ton titre
      est très long : tu en écris une version courte pour Google, sans toucher au tien.
      Vise entre 50 et 60 caractères.
    </p>

    <h3>Le champ qui compte le plus : « Réponse courte »</h3>
    <p>
      Deux ou trois phrases qui répondent tout de suite à la question de ton titre. Elles
      s'affichent en haut de l'article, dans un encadré, et elles se retrouvent aussi sur ta
      page <strong>Organiser une retraite</strong>, avec toutes les autres.
    </p>
    <p>
      <strong>C'est ce passage que ChatGPT reprend</strong> quand quelqu'un lui pose ta question.
      Un article sans ce champ existe, mais il ne se fait presque jamais citer.
    </p>
    <p class="aide-note">
      Écris-la comme si on te posait la question dans la rue et que tu n'avais que vingt
      secondes. Pas d'introduction, pas de « on va voir ensemble ». La réponse, tout de suite.
      Et surtout : reste exacte, c'est elle qui parlera pour toi quand tu ne seras pas là.
    </p>
    <p>
      Le champ <strong>Mis à jour le</strong> ne se remplit que si tu reprends un vieil article.
      Un article révisé récemment est mieux repris qu'un article figé, et la date s'affiche
      à côté de celle de publication.
    </p>

    <h2>Créer une page entièrement nouvelle</h2>
    <ol>
      <li>Rubrique <strong>Pages que je crée</strong>, bouton <strong>+ Page</strong></li>
      <li>Le <strong>titre donne l'adresse</strong>. « Mes témoignages » donne une page qui finit par <code>/mes-temoignages</code></li>
      <li>Coche <strong>Afficher dans le menu</strong> si tu veux la voir en haut du site</li>
      <li><strong>Position dans le menu</strong> : plus le nombre est petit, plus la page est à gauche. Contact reste toujours en dernier</li>
      <li>Tu peux y poser un bouton d'achat, avec son prix</li>
    </ol>
    <p class="aide-attention">
      N'utilise pas un titre qui donnerait la même adresse qu'une page existante, comme Contact,
      Projets, À propos, Blog ou Le Socle. Ta page serait ignorée.
    </p>

    <h2>Mettre une offre en pause</h2>
    <p>
      Quand une date change, ou qu'une offre ne se vend plus pour le moment,
      tu n'as <strong>pas besoin de supprimer quoi que ce soit</strong>.
    </p>
    <ol>
      <li>Rubrique <strong>Pages de vente</strong>, ouvre l'offre concernée</li>
      <li>Décoche <strong>Page en ligne</strong></li>
      <li>Écris un message d'attente si tu veux, sinon il y en a un par défaut</li>
      <li><strong>Publier</strong></li>
    </ol>
    <p class="aide-note">
      Ce qui se passe alors : l'offre <strong>disparaît du menu, du bas de page et
      de la liste des offres</strong>, elle sort de Google, et sa page affiche ton
      message d'attente avec un bouton pour te contacter.
      <br><br>
      <strong>L'adresse continue de répondre.</strong> Tous les liens que tu as déjà
      partagés, dans un mail ou sur Instagram, mènent au message d'attente
      plutôt qu'à une page d'erreur.
    </p>
    <p>Pour la remettre en ligne : tu recoches la case. Rien n'a été perdu.</p>

    <h2>Changer un prix</h2>
    <ol>
      <li>Rubrique <strong>Boutique et livraison</strong></li>
      <li>Modifie le prix, puis <strong>Publier</strong></li>
    </ol>
    <p>Le prix change partout d'un coup : sur le bouton, sur la page des offres, et dans ce que lit Google.</p>
    <p>⚠️ Le prix affiché sur le site et le prix encaissé par Stripe sont deux choses différentes. Si tu changes un prix ici, il faut aussi le changer dans Stripe, sinon le bouton annonce un montant et la page de paiement en demande un autre. Dans le doute, écris à Emmanuel avant de publier.</p>

    <h2>Ta vidéo, et le rendez-vous qu'elle propose</h2>
    <p>
      Ta vidéo vit à deux endroits, et c'est voulu. Juste après la demande du guide, sur la page
      de remerciement, avec le guide en dessous. Et sur une page à elle,
      <strong>stephanielem.fr/echange</strong>, celle vers laquelle mène le « Clique ici » en
      dernière page de ton guide. Dans les deux cas : la vidéo, un bouton
      <strong>Réserver mon temps d'échange</strong>, et ce que vous allez poser ensemble.
    </p>
    <p>
      Quand quelqu'un réserve, Cal.com l'envoie sur une page qui confirme et lui dit quoi
      préparer. Toi, tu reçois la réservation dans ton agenda Google, comme n'importe quel
      rendez-vous. La vidéo est sur ton site, pas sur YouTube : aucun logo, aucune vidéo
      suggérée, rien qui part chez un tiers.
    </p>
    <p>
      Le bouton mène au lien que tu mets dans <strong>Boutique et livraison</strong>, champ
      <strong>RENDEZ-VOUS · lien pour réserver l'échange gratuit</strong>. Tant qu'il est vide,
      il mène à ta page Contact, donc rien ne casse. Dès que tu as ton lien de prise de
      rendez-vous, colle-le là, et c'est tout.
    </p>

    <h2>Ce que reçoit une acheteuse, et d'où ça vient</h2>
    <table class="aide-table">
      <thead><tr><th>Offre</th><th>Ce qui se passe après le paiement</th></tr></thead>
      <tbody>
        <tr><td>Le Socle</td><td>Elle paie sur Stripe, <strong>reçoit un e-mail avec ses accès dans la minute</strong>, et arrive sur une page qui lui remet tes deux guides, tes deux speed hypnoses, et un lien WhatsApp prérempli pour t'écrire. Les liens de téléchargement sont personnels et valables 24 heures, mais le lien de son e-mail, lui, ne périme pas : elle peut y revenir dans six mois.</td></tr>
        <tr><td>Deep Drive 360°</td><td>Elle paie sur Stripe, <strong>reçoit un e-mail</strong>, et arrive sur ton agenda pour choisir son créneau. Ton agenda n'est jamais visible sans paiement.</td></tr>
        <tr><td>Le roman</td><td>Le bouton l'emmène sur ta fiche Lulu. Lulu encaisse, imprime et expédie. Rien ne passe par le site ni par ton Stripe.</td></tr>
        <tr><td>Le guide offert</td><td>Elle laisse son adresse, elle reçoit le guide par e-mail, et elle entre dans ta liste Brevo.</td></tr>
      </tbody>
    </table>
    <p>Tes fichiers payants ne sont pas sur le site : ils sont dans un coffre à part, que seule la livraison peut ouvrir, et seulement après un paiement vérifié auprès de Stripe. Personne ne peut les télécharger en devinant une adresse.</p>

    <h2>Les questions qui reviennent</h2>
    <p><strong>Où sont mes fichiers ?</strong> Dans le coffre Netlify du site, hors de tout ce qui est public. Emmanuel les y a déposés une fois. Pour en remplacer un, envoie lui la nouvelle version, c'est lui qui la met en place.</p>
    <p><strong>L'accès WhatsApp du Socle, ça marche comment ?</strong> Chaque acheteuse reçoit un lien qui ouvre WhatsApp avec un message prérempli, « Bonjour Stéphanie, je viens d'acheter Le Socle ». Tu reconnais donc tout de suite d'où elle vient. C'est ton numéro habituel, rien à créer.</p>
    <p><strong>Je veux remettre La Traversée en ligne.</strong> Tu recoches la case dans sa page de vente. Ses liens de paiement existent déjà dans ton Stripe, avec les paiements en plusieurs fois : dis le à Emmanuel, il les branche sur la page.</p>
    <p><strong>Une cliente n'a rien reçu après avoir payé.</strong> Depuis le 30 septembre 2026, elle reçoit un e-mail automatiquement, même si elle ferme la page tout de suite. Vérifie d'abord ses indésirables. Si vraiment rien n'est arrivé, la vente apparaît dans ton tableau de bord : écris à Emmanuel, l'envoi se rejoue.</p>

    <p><strong>Une cliente dit que son lien ne marche plus.</strong> Un même lien d'accès ne s'ouvre que six fois par jour. C'est fait exprès : sans cette limite, une personne qui a payé pourrait publier son lien et tout le monde téléchargerait tes contenus gratuitement. Pour une vraie cliente, ça se débloque tout seul le lendemain. Si elle est pressée, écris à Emmanuel.</p>

    <p><strong>Je rembourse une cliente, elle garde l'accès ?</strong> Non. Dès que tu rembourses depuis Stripe, ses accès se ferment. Tu n'as rien d'autre à faire.</p>
    <p><strong>Quelqu'un tombe sur une page qui n'existe pas.</strong> Il voit une page « Cette page n'existe pas » à tes couleurs, avec le chemin vers tes offres. Rien à faire de ton côté.</p>

    <h2>Changer une photo</h2>
    <ol>
      <li>Ouvre la page, clique sur l'image à remplacer</li>
      <li><strong>Téléverser</strong>, choisis ton fichier</li>
      <li><strong>Publier</strong></li>
    </ol>
    <p class="aide-note">
      Une photo de <strong>1600 pixels de large</strong> suffit largement. Plus grande, elle ralentit
      ton site sans rien apporter.
    </p>

    <h2>Tes messages et tes inscrites</h2>
    <p>
      À chaque fois que quelqu'un t'écrit, demande ton guide ou s'inscrit à une étude de cas,
      <strong>tu reçois un e-mail sur contact@stephanielem.fr</strong> avec tout le contenu.
      Tu n'as rien à ouvrir, rien à surveiller.
    </p>
    <p>
      En parallèle, la personne entre dans ton <strong>Brevo</strong>, dans la liste qui
      correspond : guide offert, demandes de contact, étude de cas, ou clientes si elle a acheté.
      C'est là que tu retrouves tout le monde, et c'est de là que partent tes séquences.
    </p>
    <table class="aide-table">
      <thead><tr><th>Quand</th><th>Ce qui part, avec tes textes</th></tr></thead>
      <tbody>
        <tr><td>Elle demande le guide</td><td>Le guide tout de suite, puis tes quatre mails, un par jour</td></tr>
        <tr><td>Elle t'écrit</td><td>Un accusé de réception, pour qu'elle sache que tu as bien reçu</td></tr>
        <tr><td>Elle achète Le Socle</td><td>Ses accès, dans la minute</td></tr>
        <tr><td>Elle achète un Deep Drive</td><td>Le lien pour choisir son créneau</td></tr>
      </tbody>
    </table>
    <p class="aide-note">
      Une personne qui ne coche pas la case « je veux recevoir la suite » reçoit son guide et
      rien d'autre. C'est la loi, et c'est aussi ce qui fait que tes mails arrivent en boîte de
      réception et non en indésirables. Tu ne peux pas la rajouter à la main dans une séquence.
    </p>

    <h2>Le bandeau « Mesure d'audience »</h2>
    <p>
      Depuis le 1er octobre 2026, un petit bandeau demande à chaque visiteuse si elle accepte
      qu'on compte sa visite. <strong>C'est obligatoire en France</strong>, et c'est ce qui te
      permet de savoir combien de personnes lisent tes articles et d'où elles viennent.
    </p>
    <p>
      Tu n'as rien à faire dessus. Refuser est aussi simple qu'accepter, et le choix se
      change en bas de chaque page, c'est la règle. Si une visiteuse te demande ce que c'est,
      ta politique de confidentialité l'explique cookie par cookie.
    </p>

    <h2>Si quelque chose ne marche pas</h2>
    <table class="aide-table">
      <thead><tr><th>Ce que tu vois</th><th>Ce qu'il faut faire</th></tr></thead>
      <tbody>
        <tr>
          <td>Le changement n'apparaît pas</td>
          <td>Attends deux minutes, puis rafraîchis. Si rien ne bouge, préviens Emmanuel</td>
        </tr>
        <tr>
          <td>Impossible de se connecter</td>
          <td>Vérifie que tu es connectée à GitHub. Sinon, préviens Emmanuel</td>
        </tr>
        <tr>
          <td>Une page a disparu du menu</td>
          <td>Rouvre la, la case « Afficher dans le menu » s'est peut être décochée</td>
        </tr>
        <tr>
          <td>Tu as supprimé quelque chose par erreur</td>
          <td>Rien n'est jamais perdu, tout est conservé. Préviens Emmanuel, il remet la version d'avant</td>
        </tr>
      </tbody>
    </table>

    <h2>Ce que tu ne peux pas casser</h2>
    <p>
      Chaque modification est enregistrée avec sa date. <strong>Tout est réversible.</strong>
      Tu peux donc essayer sans crainte : au pire, on revient en arrière.
    </p>
    <p>
      En revanche, deux choses ne se modifient pas depuis ton espace, et c'est volontaire :
      les <strong>couleurs et la structure</strong> des pages, et les <strong>fichiers que tu vends</strong>,
      qui vivent dans un coffre à part. Pour ceux là, passe par Emmanuel.
    </p>

    <h2>Le rendez vous du mois</h2>
    <p>Trente minutes, une fois par mois, pour regarder ensemble :</p>
    <ul>
      <li>ce que les gens ont cherché pour arriver sur ton site</li>
      <li>les formulaires reçus et les ventes</li>
      <li>l'article à écrire ce mois ci, choisi d'après ce que Google montre</li>
    </ul>
  </div>
`;
