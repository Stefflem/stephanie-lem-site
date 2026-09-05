import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    eyebrow: z.string().optional(),
    lead: z.string().optional(),
    sub: z.string().optional(),
    intro: z.string().optional(),
    portrait: z.string().optional(),
    closing: z.string().optional(),
    cta_label: z.string().optional(),
    cta_href: z.string().optional(),
    cta2_label: z.string().optional(),
    cta2_href: z.string().optional(),
    instagram: z.string().optional(),
    email: z.string().optional(),
    whatsapp: z.string().optional(),
    seo_description: z.string().optional(),
  }),
});

const projets = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projets' }),
  schema: z.object({
    lieu: z.string(),
    sous_titre: z.string().optional().default(''),
    avec: z.string().optional().default(''),
    image: z.string(),
    ordre: z.number().default(99),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    theme: z.string().optional().default(''),
    date: z.coerce.date(),
    description: z.string().optional().default(''),
    draft: z.boolean().default(false),
  }),
});

export const collections = { pages, projets, blog };
