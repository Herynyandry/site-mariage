// Empreinte du mot de passe commun, à poser dans src/ouverture.json (« empreinteMotDePasse »).
//
//   node outils/empreinte.mjs 'le mot de passe'
//
// La porte compare l'empreinte du mot tapé après la même normalisation (src/lib/mot-de-passe.js) :
// majuscules, accents et espaces ne comptent pas.

import { empreinteMotDePasse, normaliserMotDePasse } from '../src/lib/mot-de-passe.js';

const saisie = process.argv.slice(2).join(' ');
if (!normaliserMotDePasse(saisie)) {
  console.error("Usage : node outils/empreinte.mjs 'le mot de passe'");
  process.exit(1);
}
console.log(await empreinteMotDePasse(saisie));
console.error(`(la porte accepte toute saisie qui se ramène à « ${normaliserMotDePasse(saisie)} »)`);
