// Essai du contrat du relais, contre un `wrangler dev` qui tourne.
//   node essai.mjs ouvert   (npm run dev)
//   node essai.mjs clos     (npm run dev -- --var DATE_LIMITE_RSVP:2020-01-01T00:00:00Z)
//   node essai.mjs notion   (wrangler dev, sans base factice)
// Chaque cas porte son attendu ; une seule ligne rouge fait sortir en erreur.

const RELAIS = process.env.RELAIS ?? 'http://localhost:8787';
const SITE = 'http://localhost:4321';
const mode = process.argv[2] ?? 'ouvert';
let rouges = 0;

function verifier(nom, condition, detail) {
  console.log(`${condition ? 'VERT ' : 'ROUGE'} ${nom}${condition ? '' : ` — ${detail}`}`);
  if (!condition) rouges += 1;
}

async function appel(chemin, { methode = 'GET', corps, origine = SITE } = {}) {
  const reponse = await fetch(`${RELAIS}${chemin}`, {
    method: methode,
    headers: { Origin: origine, ...(corps !== undefined ? { 'Content-Type': 'application/json' } : {}) },
    body: corps === undefined ? undefined : typeof corps === 'string' ? corps : JSON.stringify(corps),
  });
  const texte = await reponse.text();
  return { statut: reponse.status, entetes: reponse.headers, json: texte ? JSON.parse(texte) : null };
}

const personnes = (ids) => ids.map((invite_id) => ({ invite_id, mariage: 'oui', brunch: 'non', regime: '' }));
const foyer = { email: 'camille@exemple.fr', chanson: 'Mafana', surprise: 'oui', message: 'Vive les mariés' };
const complet = { code: 'DEMO', personnes: personnes(['demo-1', 'demo-2', 'demo-3']), foyer };

if (mode === 'notion') {
  const r = await appel('/foyer?code=DEMO');
  verifier('sans base factice : 503 explicite', r.statut === 503 && /Notion/.test(r.json?.erreur), JSON.stringify(r));
} else if (mode === 'clos') {
  const lecture = await appel('/foyer?code=DEMO');
  verifier('après la date limite : lecture, ouvert = false', lecture.statut === 200 && lecture.json.ouvert === false, JSON.stringify(lecture.json));
  const envoi = await appel('/rsvp', { methode: 'POST', corps: complet });
  verifier('après la date limite : envoi refusé (403)', envoi.statut === 403, `${envoi.statut} ${JSON.stringify(envoi.json)}`);
} else {
  let r = await appel('/foyer?code=demo');
  verifier('code en minuscules reconnu, 3 invités, pas encore de réponse',
    r.statut === 200 && r.json.foyer.nom === 'Famille Démo' && r.json.foyer.invites.length === 3 && r.json.reponse === null && r.json.ouvert === true,
    JSON.stringify(r.json));

  r = await appel('/foyer?code=de-mo%20');
  verifier('code tapé avec tiret et espace reconnu', r.statut === 200, String(r.statut));

  r = await appel('/foyer?code=INCONNU');
  verifier('code inconnu : 404', r.statut === 404, String(r.statut));

  r = await appel('/rsvp', { methode: 'POST', corps: { ...complet, personnes: personnes(['demo-1', 'demo-2']) } });
  verifier('une personne oubliée : 400 qui la nomme', r.statut === 400 && /Lou/.test(r.json.erreur), JSON.stringify(r.json));

  r = await appel('/rsvp', { methode: 'POST', corps: { ...complet, personnes: personnes(['demo-1', 'demo-2', 'demo-3', 'solo-1']) } });
  verifier("l'invité d'un autre foyer : 400", r.statut === 400, JSON.stringify(r.json));

  r = await appel('/rsvp', { methode: 'POST', corps: { ...complet, personnes: personnes(['demo-1', 'demo-1', 'demo-3']) } });
  verifier('une personne en double : 400', r.statut === 400, JSON.stringify(r.json));

  r = await appel('/rsvp', { methode: 'POST', corps: { ...complet, personnes: [{ ...complet.personnes[0], mariage: 'peut-être' }, ...complet.personnes.slice(1)] } });
  verifier('présence hors oui/non : 400', r.statut === 400, JSON.stringify(r.json));

  r = await appel('/rsvp', { methode: 'POST', corps: { ...complet, foyer: { ...foyer, email: 'pas-une-adresse' } } });
  verifier('e-mail invalide : 400', r.statut === 400, JSON.stringify(r.json));

  r = await appel('/rsvp', { methode: 'POST', corps: '{pas du json' });
  verifier('corps illisible : 400', r.statut === 400, String(r.statut));

  r = await appel('/rsvp', { methode: 'POST', corps: { ...complet, foyer: { ...foyer, message: 'x'.repeat(25_000) } } });
  verifier('corps de plus de 20 ko : 413', r.statut === 413, String(r.statut));

  r = await appel('/foyer?code=DEMO');
  verifier('aucun envoi refusé ne s\'est enregistré', r.json.reponse === null, JSON.stringify(r.json.reponse));

  r = await appel('/rsvp', { methode: 'POST', corps: { ...complet, admin: true, foyer: { ...foyer, chanson: '  Mafana  ', role: 'x' } } });
  verifier('réponse complète : 200 avec la date de réception', r.statut === 200 && !Number.isNaN(Date.parse(r.json.recue_le)), JSON.stringify(r.json));

  r = await appel('/foyer?code=DEMO');
  const lu = r.json.reponse;
  verifier('la réponse se relit pour être modifiée, nettoyée (espaces, champs en trop)',
    lu && lu.personnes.length === 3 && lu.foyer.chanson === 'Mafana' && !('role' in lu.foyer) && !('admin' in lu),
    JSON.stringify(lu));

  r = await appel('/rsvp', { methode: 'POST', corps: { ...complet, foyer: { ...foyer, message: 'Finalement, on change' } } });
  const relu = (await appel('/foyer?code=DEMO')).json.reponse;
  verifier('une nouvelle réponse remplace la précédente', r.statut === 200 && relu.foyer.message === 'Finalement, on change', JSON.stringify(relu?.foyer));

  r = await appel('/foyer?code=SOLO');
  verifier("les foyers ne voient pas la réponse d'un autre", r.json.reponse === null, JSON.stringify(r.json.reponse));

  r = await appel('/rsvp', { methode: 'OPTIONS' });
  verifier('pré-vol depuis le site : 204 + origine autorisée',
    r.statut === 204 && r.entetes.get('access-control-allow-origin') === SITE, `${r.statut} ${r.entetes.get('access-control-allow-origin')}`);

  r = await appel('/foyer?code=DEMO', { origine: 'https://ailleurs.example' });
  verifier("une autre origine n'obtient pas l'autorisation CORS", r.entetes.get('access-control-allow-origin') === null, String(r.entetes.get('access-control-allow-origin')));
}

console.log(rouges ? `${rouges} rouge(s)` : 'tout est vert');
process.exit(rouges ? 1 : 0);
