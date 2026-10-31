import { normaliserCode, type EnvoiRsvp, type LectureFoyer } from '../../relais/src/contrat';
import { FOYERS_DEMO } from '../../relais/src/demo';

// Appels au relais Cloudflare. Sans PUBLIC_RELAIS_URL (l'aperçu sur GitHub Pages aujourd'hui),
// les foyers de démonstration répondent à sa place et rien n'est enregistré.

const URL_RELAIS = import.meta.env.PUBLIC_RELAIS_URL?.replace(/\/+$/, '');

export const enApercu = !URL_RELAIS;

export type Lecture =
  | { statut: 'trouve'; lecture: LectureFoyer }
  | { statut: 'inconnu' }
  | { statut: 'panne' };

export type Envoi = { statut: 'recu'; recue_le: string } | { statut: 'refus'; erreur: string } | { statut: 'panne' };

export async function lireFoyer(saisie: string): Promise<Lecture> {
  const code = normaliserCode(saisie);
  if (!URL_RELAIS) {
    const foyer = FOYERS_DEMO.find((f) => f.code === code);
    return foyer
      ? { statut: 'trouve', lecture: { foyer: { nom: foyer.nom, invites: foyer.invites }, reponse: null, ouvert: true } }
      : { statut: 'inconnu' };
  }
  try {
    const reponse = await fetch(`${URL_RELAIS}/foyer?code=${encodeURIComponent(code)}`);
    if (reponse.status === 404) return { statut: 'inconnu' };
    if (!reponse.ok) return { statut: 'panne' };
    return { statut: 'trouve', lecture: (await reponse.json()) as LectureFoyer };
  } catch {
    return { statut: 'panne' };
  }
}

export async function envoyer(envoi: EnvoiRsvp): Promise<Envoi> {
  if (!URL_RELAIS) return { statut: 'recu', recue_le: new Date().toISOString() };
  try {
    const reponse = await fetch(`${URL_RELAIS}/rsvp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(envoi),
    });
    const corps = (await reponse.json().catch(() => null)) as { recue_le?: string; erreur?: string } | null;
    if (reponse.ok && corps?.recue_le) return { statut: 'recu', recue_le: corps.recue_le };
    if (reponse.status >= 400 && reponse.status < 500 && corps?.erreur) return { statut: 'refus', erreur: corps.erreur };
    return { statut: 'panne' };
  } catch {
    return { statut: 'panne' };
  }
}
