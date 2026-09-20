# Qui commite sur ce dépôt, et pourquoi

## La règle

**Sur ce dépôt, l'auteur des commits est Stéphanie Lem.** Les vrais auteurs sont nommés en `Co-authored-by` dans le corps du message.

```
git config user.name  "Stephanie Lem"
git config user.email "327399968+Stefflem@users.noreply.github.com"
```

C'est déjà configuré en local. **Ne pas la changer sans lire ce qui suit.**

## Pourquoi

Netlify, dans son offre gratuite, **n'accepte qu'un seul contributeur Git sur un dépôt privé**. Le compte vérifié est celui de Stéphanie, propriétaire du site et du dépôt. Tout commit signé d'une autre identité fait échouer la construction avec :

```
Build blocked: Unrecognized Git contributor.
This plan allows only verified account members to push to private repos
```

Constaté le 2026-09-20 : le commit `00513ec` a été refusé pour cette raison, alors que le déploiement initial était passé.

## Ce que ça change, et ce que ça ne change pas

**Ça ne change pas la vérité.** Chaque commit porte les lignes `Co-authored-by` qui nomment qui a réellement travaillé. L'historique reste lisible et honnête, c'est le champ « auteur » qui porte l'identité du dépôt.

**Ça ne gêne pas Stéphanie.** Ses modifications depuis `/admin` passent par son propre compte GitHub : elles sont déjà au bon nom et se déploient normalement.

## Les deux autres options, écartées

| Option | Pourquoi écartée |
|---|---|
| Passer le dépôt en public | Il contient `fichiers-proteges/`, les PDF et audios vendus 111 €. Il faudrait d'abord les déplacer vers un stockage Netlify et réécrire la fonction de téléchargement, environ une heure |
| Netlify Pro | Environ 19 $ par mois, soit 680 € sur trois ans, alors que le choix de Netlify reposait justement sur : gratuit, usage commercial autorisé, zéro récurrent |

**Si un jour il faut vraiment plusieurs contributeurs**, la bonne solution est la première : sortir les fichiers payants du dépôt, puis le passer en public. C'est de toute façon une meilleure hygiène, un fichier vendu n'a rien à faire dans un dépôt Git.
