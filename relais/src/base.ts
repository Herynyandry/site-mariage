import type { Foyer, ReponseEnregistree } from './contrat';
import { FOYERS_DEMO } from './demo';

/** Là où vivent les foyers et leurs réponses : le Notion des mariés en production. */
export interface Base {
  lireFoyer(code: string): Promise<Foyer | null>;
  lireReponse(code: string): Promise<ReponseEnregistree | null>;
  /** Remplace la réponse précédente du foyer : on garde la dernière. */
  ecrireReponse(code: string, reponse: ReponseEnregistree): Promise<void>;
}

/**
 * Base en mémoire, pour le dev : les foyers de démonstration, et des réponses
 * qui vivent jusqu'au redémarrage de wrangler.
 */
export class BaseFactice implements Base {
  private readonly reponses = new Map<string, ReponseEnregistree>();

  async lireFoyer(code: string): Promise<Foyer | null> {
    return FOYERS_DEMO.find((foyer) => foyer.code === code) ?? null;
  }

  async lireReponse(code: string): Promise<ReponseEnregistree | null> {
    return this.reponses.get(code) ?? null;
  }

  async ecrireReponse(code: string, reponse: ReponseEnregistree): Promise<void> {
    this.reponses.set(code, structuredClone(reponse));
  }
}
