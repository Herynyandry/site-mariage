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
- **Polices hébergées dans le site** : Montserrat pour le texte (`@fontsource-variable`), aucun appel à Google Fonts, et elles fonctionneront hors ligne.
- **Safira March pour les titres, sous licence** (Din Studio) : la version gratuite est réservée au bureau et ne peut pas être mise en ligne. Le fichier n'entre jamais dans ce dépôt public (`src/fonts/` est ignoré) ; posé en `src/fonts/safira-march.{woff2,woff,ttf,otf}`, `Base.astro` le sert, sinon les titres retombent sur Bodoni Moda.
- **Photos** : copies web réduites, **métadonnées EXIF retirées** (position GPS comprise).
- **Pas de serveur à nous** (décidé le 23/10/2026) : les pages restent statiques sur GitHub Pages ; un relais Cloudflare Worker, à venir dans ce dépôt, gardera la clé Notion et écrira dans les bases des mariés (réponses, foyers et leurs codes, registre des photos). Les photos envoyées iront sur Cloudflare R2.
- **Non indexé** : `robots.txt` et `<meta name="robots" content="noindex">`. L'aperçu est public sur GitHub Pages, comme la page Notion d'origine. Sans serveur, les pages restent lisibles par qui connaît l'adresse : le code de foyer porté par le QR protégera ce qui passe par le relais (invités, réponses, photos).
- **RSVP** : la page Notion du formulaire refuse l'affichage dans un autre site (`X-Frame-Options: SAMEORIGIN`). Le formulaire est donc refait ici ; le relais écrira chaque réponse dans la même base Notion via l'API officielle.
- **Faire-part** : la carte est dessinée à sa taille réelle (559 × 794 px) puis réduite par `transform`, jamais par `zoom` : sous WebKit (le moteur de Safari), `zoom` rendait une carte plus large que son cadre, de taille variable d'un chargement à l'autre, et le défilement en portrait a été signalé bloqué sur téléphone (31/10/2026).

## Reste à fournir par les mariés

Photos en pleine résolution, lieu de la cérémonie, horaires du cocktail, de la soirée et du brunch,
liste des défis de la chasse aux photos, options exactes des questions de présence du RSVP.
