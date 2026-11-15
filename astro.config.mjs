// @ts-check
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';

/**
 * Site ouvert aux invités (src/ouverture.json) : la publication échoue s'il reste un trou « [à remplir] »
 * dans le texte d'une page. Le faire-part n'est pas une page des invités : c'est l'aperçu d'impression des mariés.
 * @returns {import('astro').AstroIntegration}
 */
function pasDeTrouAvantOuverture() {
  return {
    name: 'pas-de-trou-avant-ouverture',
    hooks: {
      'astro:build:done': ({ dir, logger }) => {
        const { ouvert } = JSON.parse(readFileSync(new URL('./src/ouverture.json', import.meta.url), 'utf8'));
        if (!ouvert) return;
        const racine = fileURLToPath(dir);
        const trous = [];
        for (const fichier of readdirSync(racine, { recursive: true, encoding: 'utf8' })) {
          if (!fichier.endsWith('.html') || fichier.startsWith('faire-part')) continue;
          const texte = readFileSync(join(racine, fichier), 'utf8')
            .replace(/<(script|style)\b[\s\S]*?<\/\1>/g, '')
            .replace(/<[^>]*>/g, ' ');
          for (const trou of texte.match(/\[[^\]\n]{2,60}\]/g) ?? []) trous.push(`${fichier} : ${trou}`);
        }
        if (trous.length) {
          throw new Error(`Site ouvert, mais il reste des trous à remplir :\n  ${trous.join('\n  ')}`);
        }
        logger.info('Site ouvert : aucun trou à remplir.');
      },
    },
  };
}

// En CI (GitHub Pages), l'origine et le chemin de base viennent de actions/configure-pages.
export default defineConfig({
  site: process.env.SITE_ORIGIN || 'http://localhost:4321',
  base: process.env.SITE_BASE || '/',
  trailingSlash: 'always',
  integrations: [pasDeTrouAvantOuverture()],
});
