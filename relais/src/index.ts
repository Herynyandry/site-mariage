import { BaseFactice, type Base } from './base';
import { normaliserCode, type LectureFoyer } from './contrat';
import { valider } from './regles';

// Le relais : seul composant serveur du site (socle décidé le 23/10/2026, HQ #1977).
// Il garde la clé Notion hors du dépôt public et ne laisse passer que ce que les pages ont le droit de faire.

interface Env {
  /** « notion » en production ; « factice » en dev (npm run dev), foyers de démonstration en mémoire. */
  BASE: string;
  /** Origines autorisées à appeler le relais, séparées par des virgules. */
  ORIGINES: string;
  /** Au-delà de cet instant (ISO), une réponse se lit mais ne se modifie plus. */
  DATE_LIMITE_RSVP: string;
}

const TAILLE_MAX = 20_000;

let factice: BaseFactice | undefined;

function choisirBase(env: Env): Base | null {
  if (env.BASE === 'factice') return (factice ??= new BaseFactice());
  // La base Notion se branche avec l'accès des mariés (HQ #2085) : d'ici là, le relais le dit.
  return null;
}

function cors(requete: Request, env: Env): Record<string, string> {
  const origine = requete.headers.get('Origin');
  const permises = env.ORIGINES.split(',').map((o) => o.trim());
  if (!origine || !permises.includes(origine)) return { Vary: 'Origin' };
  return {
    'Access-Control-Allow-Origin': origine,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(corps: unknown, statut: number, entetes: Record<string, string>): Response {
  return new Response(JSON.stringify(corps), {
    status: statut,
    headers: { ...entetes, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

function ouvert(env: Env): boolean {
  return Date.now() < Date.parse(env.DATE_LIMITE_RSVP);
}

export default {
  async fetch(requete: Request, env: Env): Promise<Response> {
    const entetes = cors(requete, env);
    const { pathname, searchParams } = new URL(requete.url);

    if (requete.method === 'OPTIONS') return new Response(null, { status: 204, headers: entetes });

    const base = choisirBase(env);
    if (!base) return json({ erreur: "Le relais n'est pas encore branché sur Notion." }, 503, entetes);

    if (pathname === '/foyer' && requete.method === 'GET') {
      const code = normaliserCode(searchParams.get('code') ?? '');
      const foyer = code ? await base.lireFoyer(code) : null;
      if (!foyer) return json({ erreur: 'Code inconnu.' }, 404, entetes);
      const lecture: LectureFoyer = {
        foyer: { nom: foyer.nom, invites: foyer.invites },
        reponse: await base.lireReponse(code),
        ouvert: ouvert(env),
      };
      return json(lecture, 200, entetes);
    }

    if (pathname === '/rsvp' && requete.method === 'POST') {
      const brut = await requete.text();
      if (brut.length > TAILLE_MAX) return json({ erreur: 'Réponse trop longue.' }, 413, entetes);
      let corps: unknown;
      try {
        corps = JSON.parse(brut);
      } catch {
        return json({ erreur: 'Réponse illisible.' }, 400, entetes);
      }
      const saisie = typeof corps === 'object' && corps !== null ? (corps as { code?: unknown }).code : undefined;
      const code = typeof saisie === 'string' ? normaliserCode(saisie) : '';
      const foyer = code ? await base.lireFoyer(code) : null;
      if (!foyer) return json({ erreur: 'Code inconnu.' }, 404, entetes);
      if (!ouvert(env)) return json({ erreur: 'Les réponses sont closes.' }, 403, entetes);
      const verdict = valider(corps, foyer);
      if (!verdict.ok) return json({ erreur: verdict.erreur }, 400, entetes);
      const recue_le = new Date().toISOString();
      await base.ecrireReponse(code, { personnes: verdict.personnes, foyer: verdict.foyer, recue_le });
      return json({ recue_le }, 200, entetes);
    }

    return json({ erreur: 'Adresse inconnue.' }, 404, entetes);
  },
} satisfies ExportedHandler<Env>;
