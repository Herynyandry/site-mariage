import reglage from '../ouverture.json';

// Le site a deux visages, réglés dans src/ouverture.json.
// Fermé (« ouvert » à false) : l'aperçu de présentation des mariés. N'importe quel mot de passe ouvre
// la porte, le RSVP répond sur les foyers de démonstration, la chasse et le livre d'or se jouent sans rien envoyer.
// Ouvert : le site des invités. La porte ne s'ouvre qu'avec le mot de passe commun, et ce qui n'est pas
// encore branché est annoncé au lieu d'être simulé. Un trou « [à remplir] » fait échouer la publication
// (astro.config.mjs).
//
// La porte est vérifiée dans la page : elle se contourne en lisant le code (#2007, limite acceptée).
// Rien de sensible ne doit donc vivre dans ces pages ; les données des invités ne passent que par le relais.

if (reglage.ouvert && !/^[0-9a-f]{64}$/.test(reglage.empreinteMotDePasse)) {
  throw new Error("src/ouverture.json : un site ouvert exige « empreinteMotDePasse » (node outils/empreinte.mjs 'le mot').");
}

export const ouvert: boolean = reglage.ouvert;
export const empreinte: string = reglage.empreinteMotDePasse;

/** Le RSVP s'ouvre avec le relais. Sans lui, le site ouvert l'annonce pour le faire-part. */
export const rsvpFerme = ouvert && !import.meta.env.PUBLIC_RELAIS_URL;

/** La chasse et le livre d'or n'envoient encore rien : le site ouvert les annonce pour le jour J. */
export const jourJFerme = ouvert;
