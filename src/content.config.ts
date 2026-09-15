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
    offres: z.array(z.object({
      titre: z.string(),
      texte: z.string(),
      prix: z.string().optional().default(''),
      bouton: z.string(),
      href: z.string(),
      mise_en_avant: z.boolean().optional().default(false),
    })).optional().default([]),
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
    image: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

const vente = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/vente' }),
  schema: z.object({
    titre: z.string(),
    surtitre: z.string().optional().default(''),
    accroche: z.string().optional().default(''),
    sous_titres: z.array(z.string()).optional().default([]),
    bouton: z.string().optional().default(''),
    rassurance: z.string().optional().default(''),
    recois_titre: z.string().optional().default(''),
    recois: z.array(z.string()).optional().default([]),
    prix_titre: z.string().optional().default(''),
    prix_mentions: z.array(z.string()).optional().default([]),
    inclus_titre: z.string().optional().default(''),
    inclus: z.array(z.string()).optional().default([]),
    faq: z.array(z.object({ q: z.string(), r: z.string() })).optional().default([]),
    programme: z.array(z.object({ titre: z.string(), lignes: z.array(z.string()) })).optional().default([]),
    final_titre: z.string().optional().default(''),
    final_sous: z.string().optional().default(''),
    final_rassurance: z.string().optional().default(''),
    contact_texte: z.string().optional().default(''),
    image: z.string().optional(),
    banniere: z.string().optional(),
    visuel_ensemble: z.string().optional(),
    visuels: z.array(z.object({
      image: z.string(),
      legende: z.string().optional().default(''),
    })).optional().default([]),
    seo_description: z.string().optional().default(''),
  }),
});

export const collections = { pages, projets, blog, vente };
