import type { Foyer } from './contrat';

// Foyers de démonstration, publics par construction (le dépôt l'est) : jamais de vrai invité ici.
// Ils servent la base factice du relais en dev, et le RSVP de l'aperçu en ligne.
export const FOYERS_DEMO: Foyer[] = [
  {
    code: 'DEMO',
    nom: 'Famille Démo',
    invites: [
      { id: 'demo-1', prenom: 'Camille', nom: 'Démo' },
      { id: 'demo-2', prenom: 'Sacha', nom: 'Démo' },
      { id: 'demo-3', prenom: 'Lou', nom: 'Démo' },
    ],
  },
  {
    code: 'SOLO',
    nom: 'Alex Exemple',
    invites: [{ id: 'solo-1', prenom: 'Alex', nom: 'Exemple' }],
  },
];
