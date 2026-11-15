// Le mot de passe commun des invités. La porte compare son empreinte, le mot lui-même n'est
// écrit nulle part dans le dépôt. Partagé par la porte (navigateur) et outils/empreinte.mjs (Node) :
// une seule normalisation, sinon un mot juste serait refusé.

/**
 * Tapé sur un téléphone : la majuscule automatique, les accents et les espaces ne comptent pas.
 * @param {string} saisie
 * @returns {string}
 */
export function normaliserMotDePasse(saisie) {
  return saisie.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/\s+/g, '');
}

/**
 * SHA-256 en hexadécimal du mot normalisé.
 * @param {string} saisie
 * @returns {Promise<string>}
 */
export async function empreinteMotDePasse(saisie) {
  const octets = new TextEncoder().encode(normaliserMotDePasse(saisie));
  const hache = await crypto.subtle.digest('SHA-256', octets);
  return Array.from(new Uint8Array(hache), (o) => o.toString(16).padStart(2, '0')).join('');
}
