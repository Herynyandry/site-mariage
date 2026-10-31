# Les bases Notion du relais — proposition (HQ #2011)

Les données du site vivent dans le Notion des mariés (socle décidé le 23/10/2026). Le relais
lit et écrit ; tout le reste, les mariés le font dans Notion : ajouter un invité, corriger
un nom, suivre les réponses, modérer les photos.

**Proposition à valider par les mariés.** Rien n'est encore créé.

## Deux bases reliées

### Foyers — une ligne par invitation imprimée

| Propriété | Type Notion | Écrite par | Rôle |
| --- | --- | --- | --- |
| Nom | Titre | les mariés | Tel qu'écrit sur l'enveloppe : « Famille Rakoto » |
| Code | Texte | l'outil QR | 8 caractères, unique ; le relais retrouve le foyer par lui |
| Invités | Relation → Invités (dans les deux sens) | les mariés | Les personnes nommées sur l'invitation |
| Réponse reçue le | Date | le relais | Vide tant que le foyer n'a pas répondu |
| E-mail | E-mail | le relais | |
| Chanson | Texte | le relais | |
| Surprise | Sélection : Oui, Non | le relais | Ceux qui veulent préparer une surprise |
| Message | Texte | le relais | 2000 caractères au plus (limite d'un bloc de texte Notion) |

### Invités — une ligne par personne nommée

| Propriété | Type Notion | Écrite par | Rôle |
| --- | --- | --- | --- |
| Prénom | Titre | les mariés | |
| Nom | Texte | les mariés | |
| Foyer | Relation → Foyers (l'autre sens de « Invités ») | les mariés | |
| Mariage | Sélection : Oui, Non | le relais | Vide = pas encore répondu |
| Brunch | Sélection : Oui, Non | le relais | |
| Régime | Texte | le relais | 300 caractères au plus |

L'identifiant d'un invité pour le relais est celui de sa page Notion : rien à saisir.
Une nouvelle réponse remplace la précédente, sur les mêmes lignes.

### Correspondance avec le contrat (`src/contrat.ts`)

- `Foyer.nom`, `Foyer.code` ← Foyers.Nom, Foyers.Code ; `Foyer.invites` ← Invités reliés.
- `Invite.id`, `prenom`, `nom` ← identifiant de page, Invités.Prénom, Invités.Nom.
- `ReponsePersonne` ↔ Invités.Mariage, Brunch, Régime.
- `ReponseFoyer` ↔ Foyers.E-mail, Chanson, Surprise, Message ; `recue_le` ↔ Foyers.Réponse reçue le.

### Vues pour les mariés (HQ #2026)

Foyers sans réponse (Réponse reçue le est vide), présents au mariage et au brunch (Invités,
filtre Oui, total en pied de colonne), régimes (Régime n'est pas vide), surprises (Foyers,
Surprise = Oui). L'export CSV est celui de Notion.

## Plus tard : photos et livre d'or

À préciser avec la chasse et le livre d'or (HQ #2005, #2031, #2035). Une base Photos (fichier
sur R2, foyer, défi, reçue le, case « Publiée » pour la modération) et une base Livre d'or
(message, dessin ou photo sur R2, foyer, « Publiée »).

## Mise en place

Recommandé : les mariés ne créent pas les bases à la main. Une faute de frappe dans un nom de
propriété, et le relais ne la retrouve plus. Ils font deux gestes :

1. Un propriétaire de leur espace crée une **connexion interne** sur
   https://app.notion.com/developers/connections ; son jeton se lit dans l'onglet
   **Configuration** et se transmet en privé (jamais dans ce dépôt).
2. Ils créent une page vide (« Site du mariage — données ») et la donnent à la connexion :
   menu **•••** en haut à droite, **Add connections**, puis la connexion.

Un script de ce dépôt (à écrire avec l'accès, HQ #2085) crée alors les deux bases sous cette
page, puis y verse la liste des invités avec leurs codes (`liste-avec-codes.csv` de l'outil QR).
Une connexion interne ne voit que les pages qu'on lui donne ; un jeton personnel, lui, agirait
avec tous les droits de son créateur : à éviter ici.

Les noms d'écrans sont ceux de la documentation Notion lue le 31/10/2026 : à revérifier au
moment de les envoyer.

## Les réponses déjà reçues (HQ #1997)

Le formulaire actuel des mariés écrit une ligne par personne : nom, e-mail, mariage, brunch,
régime, chanson, message. Il reste en place jusqu'à la bascule. À ce moment, deux voies, à
leur choix : reporter ces réponses sur les invités correspondants (rapprochement par le nom,
vérifié à la main), ou garder l'ancienne base en archive et demander à ces personnes de
répondre à nouveau sur le site.

## Limites de Notion qui comptent

Lues dans la documentation de Notion le 31/10/2026 :

- **3 requêtes par seconde en moyenne par connexion** (180 par minute), rafales permises dans
  la minute ; au-delà, une réponse 429 avec `Retry-After` à respecter. Lire un foyer coûte
  2 requêtes (le foyer par son code, puis ses invités) ; enregistrer une réponse, cette lecture
  plus 1 requête pour le foyer et 1 par personne (7 pour un foyer de 4). Le relais devra attendre
  et réessayer sur un 429.
- **2000 caractères par bloc de texte** : d'où la borne du message.
- **Version d'API 2025-09-03** : une base contient des « sources de données » ; les lignes se
  lisent par la source de données, et une relation se déclare par son `data_source_id`.
