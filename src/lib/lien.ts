// Préfixe un chemin interne par la base du site (« /site-mariage » sur GitHub Pages, « / » en local).
const base = import.meta.env.BASE_URL.replace(/\/+$/, '');

export function lien(chemin: string): string {
  return `${base}${chemin}`;
}
