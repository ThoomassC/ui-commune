# ui-commune — `@thomascaron/ui`

Le socle d'interface partagé par [`portfolio`](https://github.com/ThoomassC/portfolio) et
[`travels_in_world`](https://github.com/ThoomassC/travels_in_world).

## Pourquoi ce dépôt existe

`travels_in_world/src/styles/tokens.css` affirmait en commentaire que sa palette était
« délibérément identique à celle du portfolio, pour que les deux sites se lisent comme des
frères », et demandait que tout changement de couleur y soit répercuté.

Six jetons sur six avaient divergé, plus les deux fonds sombres. Aucun outil n'a rien dit,
**parce qu'un commentaire n'est pas un garde**.

Ce dépôt est ce garde. Il publie, dans cet ordre de valeur :

1. **un contrat de couleur exécutable** — il lit la feuille de jetons comme du texte,
   reconstruit ses trois thèmes, recompose les couches alpha et recalcule chaque ratio que
   les commentaires annoncent. Un chiffre faux fait échouer la CI le jour où il est écrit ;
2. **la feuille de jetons canonique** — la palette du portfolio, devenue référence parce
   qu'elle est la seule des deux à être mesurée et testée ;
3. **des composants sans état**, qui ne coûtent rien au budget JavaScript de leurs hôtes.

## Installation

```bash
npm i "@thomascaron/ui@github:ThoomassC/ui-commune#v0.2.0"
```

Le paquet se compile à l'installation (`prepare`). Trois points d'entrée :

```ts
import '@thomascaron/ui/tokens.css'; // la palette, les échelles, le focus, le mouvement
import '@thomascaron/ui/ui.css'; // les styles de composants, une seule fois par app
import { Button, Field, Input } from '@thomascaron/ui';
import { contrastRatio, parseThemes } from '@thomascaron/ui/contract'; // dev only
```

> **Point de vigilance en déploiement.** Si l'hôte n'exécute pas le script `prepare`
> (cache npm, image de build minimale), `dist/` sera absent et le build cassera en
> production sans avoir cassé en local. À vérifier par un déploiement de préversion avant
> tout passage en production.

## La charte graphique

```bash
npm install
npm run dev        # http://127.0.0.1:5173
```

La page rendue est la charte : la palette avec ses ratios mesurés, les échelles, et un
spécimen de chaque composant dans chacun de ses états. Elle est rendue **dans la palette
qu'elle documente** — le document est une instance de lui-même.

## Les règles, en sept lignes

Une règle qu'on ne peut pas citer de mémoire n'est pas appliquée.

1. **Un jeton nomme un rôle, jamais un emplacement.** Cinq encres de texte, pas douze cases
   par écran. `--card-title-color` est une dette : il fige un composant dans la palette.
2. **Une valeur de couleur se mesure, elle ne se déclare pas.** Sur le support où elle vit
   réellement, et le chiffre est recalculé en CI.
3. **Le support de référence n'est pas le fond de page.** Une palette validée contre
   `--site-background` seul est validée contre le meilleur cas.
4. **La hiérarchie se construit.** Résoudre chaque encre isolément contre son seuil les
   fait converger et tue la hiérarchie : plancher de ΔE OKLab 5 entre rôles voisins.
5. **Un invariant qui casse en silence a un test, pas un commentaire.**
6. **Le sens ne passe jamais par la couleur seule.** Le garde-fou réel est le libellé
   textuel ; la couleur est un renfort.
7. **Une contrainte non satisfaisable s'écrit, elle ne se contourne pas.** Une charte qui
   ne contient que des succès est une charte qu'on n'a pas éprouvée.

## Le contrat teal & cuivre

> **v0.2.0 — les sols clairs sont du papier.** `--site-background`, `--surface` et
> les trois `--panel-surface*` viennent d'une famille `--tc-paper-*` chaude
> (teintes 82°–86°) au lieu des `mist` froids. Chaque valeur est posée à la
> **luminosité OKLab exacte** du `mist` qu'elle remplace, ce qui est la raison
> pour laquelle aucun seuil ne bouge : les ratios ont perdu deux à cinq centièmes,
> pas un rang. Les encres, elles, restent froides — c'est de l'encre sur du
> papier, pas du papier teinté.
>
> Le thème sombre n'en a pas : une feuille éclairée par l'arrière n'existe pas, et
> les `mist` sombres restent les sols de nuit.

| Rôle             | Jeton                | Ce qu'il a le droit de faire                                 |
| ---------------- | -------------------- | ------------------------------------------------------------ |
| L'encre          | `--accent`           | **Monopole** des actions et des états : boutons, liens, focus |
| Le décor         | `--accent-secondary` | L'éditorial et l'ornement, **jamais un contrôle**             |
| Le champ         | les neutres          | Le teal vidé de sa chroma : rien ne devient sale              |

Les deux sont tenus en opposition mesurée à 179,3° en clair et 179,5° en sombre, avec un
écart de luminosité OKLab d'au moins 0,08 — c'est lui qui empêche le décor d'usurper le
signal, puisque la teinte chaude est verrouillée par l'opposition.

Conséquence directe, et elle surprend : **l'action destructrice est un bouton à liseré,
jamais un aplat.** L'aplat plein est réservé au teal.

## Architecture des jetons

Trois couches, une seule direction de dépendance.

| Couche          | Fichier                | Qui peut la citer          |
| --------------- | ---------------------- | -------------------------- |
| **Primitives**  | `src/tokens/primitives.css` | La couche rôle, uniquement |
| **Rôles**       | `src/tokens/roles.css`      | Tout composant             |
| **Composant**   | alias locaux           | Le composant seul          |

Les primitives sont nommées `--tc-<famille>-<L>`, où `<L>` est la **luminosité OKLab
mesurée**, ×1000 et arrondie : `--tc-teal-515` vaut `#087487` parce que sa L vaut 0,515. Le
nom est une donnée, pas une convention — le contrat le vérifie.

Trois blocs de thème, dans cet ordre et pas deux :

```css
:root { /* déclare TOUT, en entier */ }
@media (prefers-color-scheme: dark) { :root:not([data-theme='light']) { /* redéfinit */ } }
:root[data-theme='dark'] { /* redéfinit */ }
```

Le thème sombre est donc servi **sans une ligne de JavaScript** — la seule architecture
compatible avec un site entièrement prérendu. Une couleur dont la seule déclaration vit
dans un `@media` ne s'applique jamais dans l'état non marqué : le contrat échoue si un
jeton sombre manque au bloc clair.

## Ce que ce dépôt ne fait pas

- Il **ne publie pas sur npm** et n'a pas vocation à le faire tant que deux projets
  suffisent.
- Il **n'a pas migré** `portfolio` ni `travels_in_world` : ils consomment encore leurs
  propres feuilles. La bascule de `travels_in_world` implique de reteindre son fond de
  `#c4d8de` vers `#deedf0`, donc de remesurer les remplissages de sa carte du monde — c'est
  un chantier réel, pas un chercher-remplacer.
- Il **n'emporte pas le verre liquide** du portfolio. Toute la campagne de mesure du
  portfolio est un corollaire de son verre : il connaissait ses six sols. Posé sur des
  photos de voyage, il y a autant de sols que de photos.
- Il **n'a pas de police propre.** Piles système dans les deux projets, et aucune requête
  hors origine n'est tolérée : une police sera auto-hébergée en `woff2`, sous un budget qui
  reste à ouvrir.

## Ce qui reste à décider

Par coût de retour en arrière décroissant.

1. La bascule du fond de `travels_in_world` vers `#deedf0`, et le remesurage de sa carte.
2. Les trois familles de caractères, et le budget de police qui va avec.
3. La simulation de deutéranopie sur `--danger` / `--success` / `--warning` : elle n'a pas
   été faite, et le résultat peut changer les trois valeurs. Le rouge n'est séparé du
   cuivre que de 11,3° de teinte.
4. Le squircle (`corner-shape: superellipse()`) du portfolio : abandonné ici, faute d'être
   visible ailleurs que sur Chromium.

Deux questions que la charte laissait ouvertes sont **tranchées et mesurées** ici, plutôt
que reportées :

- **L'état désactivé n'utilise pas `opacity`.** La recette `opacity: 0.45` héritée du
  portfolio donnait 2,20:1 en clair contre 3,00:1 en sombre — un écart d'un tiers entre
  deux thèmes pour la même règle est un accident, pas une intention. La librairie pose
  `--panel-surface-active` + `--text-muted` + une bordure tiretée : mesuré 5,55:1 en clair
  et 5,69:1 en sombre pour le libellé, 3,92:1 et 4,31:1 pour la bordure. Le tiret est là
  parce que le sens ne doit pas passer par la couleur seule, y compris pour dire « inerte ».
- **`--warning` clair vaut `#7b5620`, et non le `#845d22` que la charte proposait.** Le
  `#845d22` tenait 4,90:1 sur le fond de page, mais 4,20:1 sur son propre lavis posé sur
  `--panel-surface` — c'est-à-dire dans une pastille, son emploi principal. La règle n° 3
  s'appliquait à elle-même : le fond de page n'est jamais le pire cas. Le contrat mesure
  désormais chaque encre sémantique sur son propre lavis, sur trois substrats et dans les
  trois thèmes.

## Scripts

| Commande            | Ce qu'elle fait                                          |
| ------------------- | -------------------------------------------------------- |
| `npm run dev`       | Sert la charte graphique sur `127.0.0.1:5173`             |
| `npm test`          | Le contrat de couleur et les tests de composants          |
| `npm run build:lib` | Compile la librairie dans `dist/`                         |
| `npm run build`     | Construit la charte statique dans `dist-showcase/`        |
| `npm run typecheck` | `tsc` sans émission                                       |
| `npm run lint`      | ESLint, `jsx-a11y` compris                                |
