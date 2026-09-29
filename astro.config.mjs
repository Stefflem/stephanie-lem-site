// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

/* Les pages en `noindex` sont retirées du plan du site après la construction,
   par `scripts/nettoie-sitemap.mjs` : il lit le HTML produit, donc il suit
   tout seul les offres que Stéphanie met en pause depuis son espace. */
export default defineConfig({
  site: 'https://stephanielem.fr',
  integrations: [sitemap()],
  build: { format: 'directory' },
});
