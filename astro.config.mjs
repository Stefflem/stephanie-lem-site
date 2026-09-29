// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://stephanielem.fr',
  integrations: [sitemap()],
  build: { format: 'directory' },
});
