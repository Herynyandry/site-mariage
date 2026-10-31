// Contrat entre les pages du site et le relais : ce qui transite, dans les deux sens.
// Fichier sans dépendance au runtime Cloudflare : les pages Astro l'importent aussi.

export type OuiNon = 'oui' | 'non';

export interface Invite {
  id: string;
  prenom: string;
  nom: string;
}

/** Un foyer = une invitation imprimée, un QR, un code. */
export interface Foyer {
  code: string;
  /** Tel qu'écrit sur l'enveloppe : « Famille Rakoto », « Camille et Sacha ». */
  nom: string;
  invites: Invite[];
}

/** Ce que chaque personne nommée sur l'invitation répond pour elle-même. */
export interface ReponsePersonne {
  invite_id: string;
  mariage: OuiNon;
  brunch: OuiNon;
  regime: string;
}

/** Ce que le foyer dit une fois pour tous. */
export interface ReponseFoyer {
  email: string;
  chanson: string;
  surprise: OuiNon | '';
  message: string;
}

/** POST /rsvp */
export interface EnvoiRsvp {
  code: string;
  personnes: ReponsePersonne[];
  foyer: ReponseFoyer;
}

export interface ReponseEnregistree {
  personnes: ReponsePersonne[];
  foyer: ReponseFoyer;
  recue_le: string;
}

/** GET /foyer?code=… */
export interface LectureFoyer {
  foyer: { nom: string; invites: Invite[] };
  /** La dernière réponse du foyer, pour la modifier ; null tant qu'il n'a pas répondu. */
  reponse: ReponseEnregistree | null;
  /** Faux après la date limite : la réponse se lit, elle ne se modifie plus. */
  ouvert: boolean;
}

export interface Erreur {
  erreur: string;
}

/** Un code se tape comme il vient (minuscules, espaces, tirets) : on ne garde que lettres et chiffres. */
export function normaliserCode(saisie: string): string {
  return saisie.toUpperCase().replace(/[^A-Z0-9]/g, '');
}
