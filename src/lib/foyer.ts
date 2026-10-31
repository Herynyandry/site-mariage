import { normaliserCode } from '../../relais/src/contrat';

// Le code du foyer arrive par le QR du faire-part (?f=CODE) et reste sur le téléphone :
// l'invité ne le tape qu'une fois, et seulement s'il n'a pas scanné.

const CLE = 'foyer';

/** Lit le code dans l'adresse s'il y est (et le garde), sinon celui gardé lors d'une visite précédente. */
export function codeDuFoyer(): string | null {
  const parametre = new URLSearchParams(location.search).get('f');
  if (parametre) {
    const code = normaliserCode(parametre);
    if (code) {
      garderCode(code);
      return code;
    }
  }
  try {
    return localStorage.getItem(CLE);
  } catch {
    return null;
  }
}

export function garderCode(code: string): void {
  try {
    localStorage.setItem(CLE, code);
  } catch {
    // Navigation privée stricte : le code ne survivra pas à la page, tant pis.
  }
}

export function oublierCode(): void {
  try {
    localStorage.removeItem(CLE);
  } catch {
    // Rien à oublier.
  }
}
