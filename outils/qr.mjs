// QR codes par foyer, pour l'impression des faire-part (HQ #2009).
//
//   npm ci --prefix outils
//   node outils/qr.mjs <liste.csv> [--sortie qr-sortie] [--adresse https://…/site-mariage/]
//
// Entrée : un CSV, une ligne par personne invitée, colonnes foyer ; prenom ; nom ; code (facultatif).
// Les personnes d'un même foyer partagent un code. Un foyer sans code en reçoit un, tiré au hasard :
// la liste complétée (liste-avec-codes.csv) devient alors la source, car un code imprimé ne change plus.
//
// Sortie : un SVG par foyer (marine #004672, fond transparent, marge de 4 modules à laisser vide),
// foyers.csv (l'index pour l'imprimeur) et planche.html (contrôle visuel).
//
// La liste des invités est une donnée personnelle : elle ne vit jamais dans ce dépôt public.

import { randomInt } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import QRCode from 'qrcode';

const MARINE = '#004672';
// Alphabet de Crockford : ni I, L, O ni U, qu'on confond en les tapant.
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const LONGUEUR_CODE = 8;

function arguments_(argv) {
  const options = { sortie: 'qr-sortie', adresse: 'https://herynyandry.github.io/site-mariage/' };
  const positionnels = [];
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--sortie') options.sortie = argv[(i += 1)];
    else if (argv[i] === '--adresse') options.adresse = argv[(i += 1)];
    else positionnels.push(argv[i]);
  }
  if (positionnels.length !== 1 || !options.sortie || !options.adresse) {
    console.error('Usage : node outils/qr.mjs <liste.csv> [--sortie dossier] [--adresse https://…/]');
    process.exit(2);
  }
  return { ...options, liste: positionnels[0] };
}

/** CSV d'Excel ou de Google Sheets : séparateur « ; » ou « , », champs entre guillemets, BOM. */
function lireCsv(texte) {
  const propre = texte.replace(/^﻿/, '');
  const premiere = propre.split(/\r?\n/, 1)[0];
  const separateur = (premiere.match(/;/g) ?? []).length >= (premiere.match(/,/g) ?? []).length ? ';' : ',';
  const lignes = [];
  let ligne = [];
  let champ = '';
  let guillemets = false;
  for (let i = 0; i < propre.length; i += 1) {
    const c = propre[i];
    if (guillemets) {
      if (c === '"' && propre[i + 1] === '"') {
        champ += '"';
        i += 1;
      } else if (c === '"') guillemets = false;
      else champ += c;
    } else if (c === '"') guillemets = true;
    else if (c === separateur) {
      ligne.push(champ);
      champ = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && propre[i + 1] === '\n') i += 1;
      ligne.push(champ);
      lignes.push(ligne);
      ligne = [];
      champ = '';
    } else champ += c;
  }
  if (champ !== '' || ligne.length) {
    ligne.push(champ);
    lignes.push(ligne);
  }
  return lignes.filter((l) => l.some((v) => v.trim() !== ''));
}

function ecrireCsv(lignes) {
  const echapper = (v) => (/[;"\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  return `﻿${lignes.map((l) => l.map((v) => echapper(String(v))).join(';')).join('\r\n')}\r\n`;
}

const normaliserCode = (saisie) => saisie.toUpperCase().replace(/[^A-Z0-9]/g, '');

function nouveauCode(pris) {
  for (;;) {
    let code = '';
    for (let i = 0; i < LONGUEUR_CODE; i += 1) code += ALPHABET[randomInt(ALPHABET.length)];
    if (!pris.has(code)) return code;
  }
}

function slug(texte) {
  return texte
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function echapperHtml(texte) {
  return texte.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
}

const { liste, sortie, adresse } = arguments_(process.argv.slice(2));
const [entete, ...lignes] = lireCsv(readFileSync(liste, 'utf8'));
const colonnes = entete.map((c) => slug(c));
const index = (nom) => colonnes.indexOf(nom);
for (const requise of ['foyer', 'prenom', 'nom']) {
  if (index(requise) < 0) {
    console.error(`Colonne « ${requise} » absente. Colonnes lues : ${entete.join(', ')}`);
    process.exit(1);
  }
}

// Regrouper par foyer, et vérifier que chaque foyer a au plus un code, et chaque code un seul foyer.
const foyers = new Map();
for (const [n, ligne] of lignes.entries()) {
  const nom = (ligne[index('foyer')] ?? '').trim();
  if (!nom) {
    console.error(`Ligne ${n + 2} : personne sans foyer.`);
    process.exit(1);
  }
  const foyer = foyers.get(nom) ?? { nom, code: '', personnes: [] };
  const code = normaliserCode(ligne[index('code')] ?? '');
  if (code && foyer.code && code !== foyer.code) {
    console.error(`Foyer « ${nom} » : deux codes différents (${foyer.code}, ${code}).`);
    process.exit(1);
  }
  foyer.code ||= code;
  foyer.personnes.push(`${(ligne[index('prenom')] ?? '').trim()} ${(ligne[index('nom')] ?? '').trim()}`.trim());
  foyers.set(nom, foyer);
}
const pris = new Map();
for (const foyer of foyers.values()) {
  if (!foyer.code) continue;
  if (pris.has(foyer.code)) {
    console.error(`Le code ${foyer.code} sert à deux foyers : « ${pris.get(foyer.code)} » et « ${foyer.nom} ».`);
    process.exit(1);
  }
  pris.set(foyer.code, foyer.nom);
}
const attribues = [];
for (const foyer of foyers.values()) {
  if (foyer.code) continue;
  foyer.code = nouveauCode(pris);
  pris.set(foyer.code, foyer.nom);
  attribues.push(foyer);
}

mkdirSync(sortie, { recursive: true });
const base = adresse.endsWith('/') ? adresse : `${adresse}/`;
const index_ = [['code', 'foyer', 'personnes', 'adresse', 'fichier']];
const vignettes = [];
for (const foyer of foyers.values()) {
  const url = `${base}?f=${foyer.code}`;
  const fichier = `${slug(foyer.nom) || 'foyer'}_${foyer.code}.svg`;
  // Correction Q (25 %) : un faire-part se plie, se frotte, se pose sur une table.
  const svg = await QRCode.toString(url, { type: 'svg', errorCorrectionLevel: 'Q', margin: 4, color: { dark: MARINE, light: '#0000' } });
  writeFileSync(join(sortie, fichier), svg);
  index_.push([foyer.code, foyer.nom, foyer.personnes.join(' · '), url, fichier]);
  vignettes.push(
    `<figure><img src="${echapperHtml(fichier)}" alt=""><figcaption><strong>${echapperHtml(foyer.nom)}</strong><br>${echapperHtml(foyer.personnes.join(' · '))}<br><code>${foyer.code}</code></figcaption></figure>`,
  );
}
writeFileSync(join(sortie, 'foyers.csv'), ecrireCsv(index_));

// La liste d'entrée, telle quelle, avec la colonne code remplie (ajoutée au bout si elle manquait).
const enteteSortie = index('code') < 0 ? [...entete, 'code'] : entete;
const colonneCode = index('code') < 0 ? entete.length : index('code');
const completees = lignes.map((ligne) => {
  const copie = [...ligne];
  while (copie.length < enteteSortie.length) copie.push('');
  copie[colonneCode] = foyers.get(ligne[index('foyer')].trim()).code;
  return copie;
});
writeFileSync(join(sortie, 'liste-avec-codes.csv'), ecrireCsv([enteteSortie, ...completees]));

writeFileSync(
  join(sortie, 'planche.html'),
  `<!doctype html><html lang="fr"><meta charset="utf-8"><title>QR par foyer</title>
<style>body{margin:24px;background:#FFF4E9;color:#004672;font:14px/1.4 system-ui,sans-serif}main{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:24px}figure{margin:0}img{width:100%;display:block}code{letter-spacing:.15em}</style>
<h1>QR par foyer — ${foyers.size} foyers</h1><p>Adresse : ${echapperHtml(base)}?f=CODE</p><main>${vignettes.join('')}</main></html>\n`,
);

console.log(`${foyers.size} foyers, ${lignes.length} personnes → ${sortie}/`);
if (attribues.length) {
  console.log(`${attribues.length} nouveau(x) code(s) : ${attribues.map((f) => `${f.code} (${f.nom})`).join(', ')}.`);
  console.log(`La source est maintenant ${join(sortie, 'liste-avec-codes.csv')} : un code imprimé ne change plus.`);
}
