import type { Foyer, OuiNon, ReponseFoyer, ReponsePersonne } from './contrat';

// Le corps d'un POST vient d'un téléphone inconnu : on ne garde que les champs attendus,
// coupés, bornés, et rattachés aux invités nommés du foyer (la FAQ : pas d'invité en plus).

const LONGUEURS = { regime: 300, email: 200, chanson: 200, message: 2000 } as const;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type Verdict =
  | { ok: true; personnes: ReponsePersonne[]; foyer: ReponseFoyer }
  | { ok: false; erreur: string };

function objet(valeur: unknown): Record<string, unknown> | null {
  return typeof valeur === 'object' && valeur !== null && !Array.isArray(valeur)
    ? (valeur as Record<string, unknown>)
    : null;
}

function texte(valeur: unknown, max: number): string | null {
  if (valeur === undefined || valeur === null) return '';
  if (typeof valeur !== 'string') return null;
  const propre = valeur.trim();
  return propre.length <= max ? propre : null;
}

function ouiNon(valeur: unknown): OuiNon | null {
  return valeur === 'oui' || valeur === 'non' ? valeur : null;
}

export function valider(corps: unknown, foyer: Foyer): Verdict {
  const envoi = objet(corps);
  if (!envoi || !Array.isArray(envoi.personnes)) return { ok: false, erreur: 'Réponse illisible.' };

  const attendus = new Map(foyer.invites.map((invite) => [invite.id, invite]));
  const personnes: ReponsePersonne[] = [];
  for (const brute of envoi.personnes) {
    const p = objet(brute);
    const invite = p && typeof p.invite_id === 'string' ? attendus.get(p.invite_id) : undefined;
    if (!p || !invite) return { ok: false, erreur: "Une personne ne figure pas sur l'invitation." };
    if (personnes.some((deja) => deja.invite_id === invite.id)) {
      return { ok: false, erreur: `${invite.prenom} apparaît deux fois.` };
    }
    const mariage = ouiNon(p.mariage);
    const brunch = ouiNon(p.brunch);
    if (!mariage || !brunch) return { ok: false, erreur: `Il manque la présence de ${invite.prenom}.` };
    const regime = texte(p.regime, LONGUEURS.regime);
    if (regime === null) return { ok: false, erreur: `Le régime de ${invite.prenom} est trop long.` };
    personnes.push({ invite_id: invite.id, mariage, brunch, regime });
  }
  const oublie = foyer.invites.find((invite) => !personnes.some((p) => p.invite_id === invite.id));
  if (oublie) return { ok: false, erreur: `Il manque la réponse de ${oublie.prenom}.` };

  const f = objet(envoi.foyer) ?? {};
  const email = texte(f.email, LONGUEURS.email);
  const chanson = texte(f.chanson, LONGUEURS.chanson);
  const message = texte(f.message, LONGUEURS.message);
  const surprise = f.surprise === undefined || f.surprise === '' ? '' : ouiNon(f.surprise);
  if (email === null || (email !== '' && !EMAIL.test(email))) return { ok: false, erreur: "L'adresse e-mail est invalide." };
  if (chanson === null) return { ok: false, erreur: 'Le titre de la chanson est trop long.' };
  if (message === null) return { ok: false, erreur: 'Le message est trop long.' };
  if (surprise === null) return { ok: false, erreur: 'Réponse à la surprise illisible.' };

  return { ok: true, personnes, foyer: { email, chanson, surprise, message } };
}
