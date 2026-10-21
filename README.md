# Site de mariage — Tsiry & Fy Tia

Site éditorial « magazine chic » du mariage du **samedi 22 mai 2027** au Domaine Verdé (Vacquiers) :
consultable avant, pendant et après le grand jour, ouvert par le QR code du faire-part.

**État : aperçu de présentation.** Le site est statique ; rien n'est encore enregistré
(RSVP, chasse aux photos, livre d'or). La maquette de référence est le canvas Claude Design
du projet. Le suivi vit dans HQ, projet #54.

## Pages

| Chemin | Rôle |
| --- | --- |
| `/` | Porte d'entrée (mot de passe ; le QR code entrera directement) |
| `/couverture/` | Couverture façon magazine et sommaire |
| `/programme/` | Programme du jour et « Notre histoire » |
| `/dress-code/` | Dress code : tout sauf le blanc |
| `/infos/` | Accès, parking, RSVP, FAQ, surprises, liste de mariage |
| `/rsvp/` | Formulaire de réponse (reprend celui de Notion) |
| `/chasse/` | Jour J : chasse aux photos |
| `/livre-d-or/` | Livre d'or : écrire, dessiner ou envoyer une photo, au format d'un carré du plaid |
| `/faire-part/` | Aperçu du faire-part A5, recto et verso |

## Développer

```sh
npm ci
npm run dev      # http://localhost:4321
npm run build    # astro check + build dans dist/
```

Node 20 ou plus récent. Le déploiement sur GitHub Pages est fait par
`.github/workflows/deploy.yml` à chaque push sur `main`.

## Décisions

- **Astro 5.18** (statique, TypeScript strict). Astro 6 et 7 demandent Node 22 ; le poste de dev est en Node 20.
- **Polices hébergées dans le site** (`@fontsource-variable`, Bodoni Moda et Jost) : aucun appel à Google Fonts, et elles fonctionneront hors ligne.
- **Photos** : copies web réduites, **métadonnées EXIF retirées** (position GPS comprise).
- **Non indexé** : `robots.txt` et `<meta name="robots" content="noindex">`. L'aperçu est public sur GitHub Pages, comme la page Notion d'origine ; le vrai mot de passe arrivera avec le serveur.
- **RSVP** : la page Notion du formulaire refuse l'affichage dans un autre site (`X-Frame-Options: SAMEORIGIN`). Le formulaire est donc refait ici ; piste retenue pour la version finale : le serveur écrit chaque réponse dans la même base Notion via l'API officielle.

## Reste à fournir par les mariés

Photos en pleine résolution, lieu de la cérémonie, horaires du cocktail, de la soirée et du brunch,
liste des défis de la chasse aux photos, format d'un carré du plaid, options exactes des questions de présence du RSVP.
