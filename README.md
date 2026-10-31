# Site de mariage — Tsiry & Fy Tia

Site éditorial « magazine chic » du mariage du **samedi 22 mai 2027** au Domaine Verdé (Vacquiers) :
consultable avant, pendant et après le grand jour, ouvert par le QR code du faire-part.

**État : aperçu de présentation.** Le site est statique ; rien n'est encore enregistré
(RSVP, chasse aux photos, livre d'or). Le RSVP par foyer fonctionne contre le relais en local,
et en ligne sur les foyers de démonstration (codes `DEMO` et `SOLO`). La maquette de référence
est le canvas Claude Design du projet. Le suivi vit dans HQ, projet #54.

## Pages

| Chemin | Rôle |
| --- | --- |
| `/` | Porte d'entrée (mot de passe ; le QR code, `?f=CODE`, garde le code du foyer et entre directement) |
| `/couverture/` | Couverture façon magazine et sommaire |
| `/programme/` | Programme du jour et « Notre histoire » |
| `/dress-code/` | Dress code : tout sauf le blanc |
| `/infos/` | Accès, parking, RSVP, FAQ, surprises, liste de mariage |
| `/rsvp/` | Réponse du foyer : une par personne nommée sur l'invitation, modifiable jusqu'au 22 février |
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

### Le relais (`relais/`)

Un Cloudflare Worker, seul composant serveur : `GET /foyer?code=` rend les invités nommés du foyer
et sa dernière réponse, `POST /rsvp` l'enregistre (champs bornés, rattachés aux invités de
l'invitation, refusés après `DATE_LIMITE_RSVP`). Le contrat partagé avec les pages est
`relais/src/contrat.ts`.

```sh
npm ci --prefix relais
npm run dev --prefix relais                      # http://localhost:8787, foyers de démonstration en mémoire
node relais/essai.mjs ouvert                     # essai du contrat contre le relais lancé
PUBLIC_RELAIS_URL=http://127.0.0.1:8787 npm run build && npx astro preview   # le site branché dessus
```

Sans `PUBLIC_RELAIS_URL`, le RSVP tourne en aperçu : les foyers `DEMO` et `SOLO` répondent et rien
n'est envoyé. wrangler est figé en 4.86, la dernière version qui accepte Node 20. La base Notion
n'est pas encore branchée : sans `BASE=factice`, le relais répond 503.

### Les QR par foyer (`outils/qr.mjs`)

Un QR par faire-part, qui ouvre le site sur le foyer (`?f=CODE`). L'entrée est un CSV, une ligne par
personne invitée : colonnes `foyer`, `prenom`, `nom` et `code` (facultatif ; séparateur `;` ou `,`).
Un foyer sans code en reçoit un de 8 caractères, tiré au hasard (alphabet de Crockford : ni I, L, O
ni U). La liste complétée devient alors la source, car un code imprimé ne change plus.

```sh
npm ci --prefix outils
node outils/qr.mjs listes/invites.csv            # → qr-sortie/
node outils/qr.mjs outils/exemple-invites.csv    # foyers de démonstration
```

Sortie : un SVG par foyer (marine `#004672`, fond transparent, marge de 4 modules à laisser vide,
correction d'erreur Q), `foyers.csv` (l'index pour l'imprimeur), `liste-avec-codes.csv` et
`planche.html` (contrôle visuel). **La liste des invités est une donnée personnelle** : `listes/` et
`qr-sortie/` sont ignorés par git, et rien de réel n'entre dans ce dépôt public.

## Décisions

- **Astro 5.18** (statique, TypeScript strict). Astro 6 et 7 demandent Node 22 ; le poste de dev est en Node 20.
- **Polices hébergées dans le site** : Montserrat pour le texte (`@fontsource-variable`), aucun appel à Google Fonts, et elles fonctionneront hors ligne.
- **Safira March pour les titres, sous licence** (Din Studio) : la version gratuite est réservée au bureau et ne peut pas être mise en ligne. Le fichier n'entre jamais dans ce dépôt public (`src/fonts/` est ignoré) ; posé en `src/fonts/safira-march.{woff2,woff,ttf,otf}`, `Base.astro` le sert, sinon les titres retombent sur Bodoni Moda.
- **Photos** : copies web réduites, **métadonnées EXIF retirées** (position GPS comprise).
- **Pas de serveur à nous** (décidé le 23/10/2026) : les pages restent statiques sur GitHub Pages ; un relais Cloudflare Worker (`relais/`) gardera la clé Notion et écrira dans les bases des mariés (réponses, foyers et leurs codes, registre des photos). Les photos envoyées iront sur Cloudflare R2.
- **Non indexé** : `robots.txt` et `<meta name="robots" content="noindex">`. L'aperçu est public sur GitHub Pages, comme la page Notion d'origine. Sans serveur, les pages restent lisibles par qui connaît l'adresse : le code de foyer porté par le QR protégera ce qui passe par le relais (invités, réponses, photos).
- **RSVP** : la page Notion du formulaire refuse l'affichage dans un autre site (`X-Frame-Options: SAMEORIGIN`). Le formulaire est donc refait ici ; le relais écrira chaque réponse dans la même base Notion via l'API officielle.
- **Faire-part** : la carte est dessinée à sa taille réelle (559 × 794 px) puis réduite par `transform`, jamais par `zoom` : sous WebKit (le moteur de Safari), `zoom` rendait une carte plus large que son cadre, de taille variable d'un chargement à l'autre, et le défilement en portrait a été signalé bloqué sur téléphone (31/10/2026).

## Reste à fournir par les mariés

Photos en pleine résolution, lieu de la cérémonie, horaires du cocktail, de la soirée et du brunch,
liste des défis de la chasse aux photos, options exactes des questions de présence du RSVP.
