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
    calendly: z.string().optional(),
    intervenantes: z.array(z.object({
      nom: z.string(),
      role: z.string().optional().default(''),
      texte: z.string().optional().default(''),
      image: z.string().optional(),
      instagram: z.string().optional(),
    })).optional().default([]),
    visuel_ensemble: z.string().optional(),
    visuels: z.array(z.object({
      image: z.string(),
      legende: z.string().optional().default(''),
    })).optional().default([]),
    seo_description: z.string().optional().default(''),
  }),
});

const reglages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/reglages' }),
  schema: z.object({
    socle_lien_paiement: z.string().optional().default(''),
    socle_prix: z.string().optional().default(''),
    socle_prix_barre: z.string().optional().default(''),
    // Decap écrit cette date sans guillemets, YAML la rend alors en objet Date.
    // On ramène systématiquement à une chaîne ISO, que le compteur sait lire.
    socle_fin_promo: z.preprocess(
      (v) => (v instanceof Date ? v.toISOString() : v ?? ''),
      z.string(),
    ).default(''),
    ysaline_lien_paiement: z.string().optional().default(''),
    ysaline_prix: z.string().optional().default(''),
    contact: z.string().optional().default(''),
    fichier_guide_offert: z.string().optional().default(''),
    fichier_tenir_lespace: z.string().optional().default(''),
    fichier_quick_start: z.string().optional().default(''),
    fichier_hypnose_peur: z.string().optional().default(''),
    fichier_hypnose_ancrage: z.string().optional().default(''),
    lien_telegram: z.string().optional().default(''),
  }),
});

export const collections = { pages, projets, blog, vente, reglages };
