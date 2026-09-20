# Fichiers payants

## ⚠️ NE RIEN DÉPOSER ICI POUR L'INSTANT

**Le dépôt est public depuis le 2026-09-20.** Un fichier posé ici serait téléchargeable par n'importe qui, donc offert.

Avant d'y déposer quoi que ce soit, le stockage doit passer à **Netlify Blobs**. La fonction `telecharger` garde exactement sa logique : paiement vérifié chez Stripe, puis lien signé valable 24 heures. Compter environ une heure. Voir `CONTRIBUER.md`.

## Les fichiers attendus, une fois le stockage migré

| Nom du fichier | Ce que c'est | Remis avec |
|---|---|---|
| `tenir-lespace.pdf` | guide « Tenir l'espace » | Le Socle |
| `quick-start.pdf` | Quick Start 7 jours | Le Socle |
| `hypnose-peur.mp3` | speed hypnose « Peur » | Le Socle |
| `hypnose-ancrage.mp3` | speed hypnose « Ancrage » | Le Socle |
| `roman-ysaline.pdf` | le roman « La traversée d'Ysaline » | Le roman |

Pour ajouter un fichier, il faut aussi l'ajouter au catalogue de `netlify/functions/telecharger.mjs`. C'est volontaire : une liste blanche explicite vaut mieux qu'un dossier ouvert.
