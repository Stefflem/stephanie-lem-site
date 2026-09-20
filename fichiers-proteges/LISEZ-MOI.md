# Fichiers payants

Déposer ici les fichiers livrés après paiement, avec **exactement** ces noms :

| Nom du fichier | Ce que c'est |
|---|---|
| `tenir-lespace.pdf` | le guide « Tenir l'espace » |
| `quick-start.pdf` | le Quick Start 7 jours |
| `hypnose-peur.mp3` | la speed hypnose « Peur » |
| `hypnose-ancrage.mp3` | la speed hypnose « Ancrage » |

**Ce dossier n'est jamais publié.** Il ne part pas dans `dist/`, aucune adresse
ne permet de l'atteindre. Seule la fonction `telecharger` peut le lire, et
seulement contre un lien signé non expiré.

Pour ajouter un fichier, il faut aussi l'ajouter au catalogue de
`netlify/functions/telecharger.mjs`. C'est volontaire : une liste blanche
explicite vaut mieux qu'un dossier ouvert.
