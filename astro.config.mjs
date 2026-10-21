// @ts-check
import { defineConfig } from 'astro/config';

// En CI (GitHub Pages), l'origine et le chemin de base viennent de actions/configure-pages.
export default defineConfig({
  site: process.env.SITE_ORIGIN || 'http://localhost:4321',
  base: process.env.SITE_BASE || '/',
  trailingSlash: 'always',
});
