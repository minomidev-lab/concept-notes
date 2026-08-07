import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const concepts = defineCollection({
  loader: glob({
    pattern: '**/concept.md',
    base: './content',
    generateId: ({ entry }) => entry.replace(/\/concept\.md$/, ''),
  }),
  schema: z.object({
    title: z.string(),
    level: z.enum(['elementary', 'middle', 'high']),
    prev: z.array(z.string()).default([]),
    next: z.array(z.string()).default([]),
    order: z.number().default(0),
  }),
});

const notes = defineCollection({
  loader: glob({
    pattern: '**/my-note.md',
    base: './content',
    generateId: ({ entry }) => entry.replace(/\/my-note\.md$/, ''),
  }),
  schema: z.object({
    updated: z.coerce.date().optional(),
  }),
});

export const collections = { concepts, notes };
