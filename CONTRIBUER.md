# Dépôt public, et pourquoi

## La décision, prise le 2026-09-20

**Le dépôt est public.** Ce n'est pas un oubli, c'est un choix, et il a une contrepartie à tenir.

## Le problème

Netlify, dans son offre gratuite, **n'accepte qu'un seul contributeur Git sur un dépôt privé**. Le compte vérifié est celui de Stéphanie, propriétaire du site. Tout ce qui est poussé depuis un autre compte échoue avec :

```
Build blocked: Unrecognized Git contributor.
This plan allows only verified account members to push to private repos
```

⚠️ **Ce que Netlify regarde, c'est le compte qui POUSSE, pas l'auteur du commit.** Signer un commit de l'identité de Stéphanie ne change rien : vérifié le 2026-09-20, le commit `90d0bea`, pourtant signé à son nom, a été refusé exactement comme le précédent. C'est une erreur de diagnostic à ne pas refaire.

## Les trois issues, et celle qu'on a prise

| Option | Verdict |
|---|---|
| Signer les commits à son nom | **Ne marche pas.** Netlify regarde qui pousse |
| Pousser avec ses identifiants à elle | Marche, mais met un identifiant de la cliente sur la machine d'Emmanuel, et tout futur intervenant se heurte au même mur |
| Netlify Pro | Environ 19 $ par mois, soit 680 € sur trois ans, alors que Netlify a justement été choisi parce que gratuit et commercial |
| **Dépôt public** | ✅ **Retenu.** La limite ne s'applique qu'aux dépôts privés |

## Pourquoi c'était sans risque ce jour là

**Le dépôt ne contenait aucun fichier payant.** `fichiers-proteges/` ne portait qu'un mode d'emploi. Avant de basculer, tout l'historique a été fouillé : aucune clé, aucun jeton, aucun `.env`, aucun PDF, aucun audio, aucune donnée personnelle. Les seules occurrences de `sk_live_` étaient des exemples dans la documentation, et un `sk_test_bidon` dans un test.

Le reste du code n'a rien de secret : le HTML du site est public dès qu'il est en ligne.

## ✅ La contrepartie, tenue le 2026-09-23

**Les fichiers payants ne doivent JAMAIS entrer dans ce dépôt.** Deux guides PDF et deux audios vendus 111 € dans un dépôt public, ce serait les offrir.

**Fait le 2026-09-23.** Les quatre fichiers du Socle vivent dans un coffre **Netlify Blobs** nommé `fichiers-proteges`, déposés une fois par Emmanuel et relus depuis Netlify (4 sur 4). La fonction `telecharger` lit dans ce coffre, plus aucun fichier n'est embarqué dans les fonctions (`included_files` retiré), et `fichiers-proteges/` est dans `.gitignore` pour qu'aucun fichier n'entre dans le dépôt par réflexe. La logique n'a pas bougé : paiement vérifié chez Stripe, puis lien signé valable 24 heures. Procédure de remplacement d'un fichier dans `PAIEMENT-ET-MAILS.md`, section Blobs.

C'est de toute façon la bonne pratique. Un fichier vendu n'a rien à faire dans un dépôt Git, public ou privé.

## Ce qui n'a pas changé

- **Elle reste propriétaire** du dépôt et du site
- **Ses modifications depuis `/admin`** passent par son compte, et se déploient normalement
- **Les secrets restent des variables d'environnement chez Netlify**, jamais dans le dépôt
