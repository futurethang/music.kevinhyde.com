import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const PLATFORMS = ['bandcamp', 'spotify', 'soundcloud', 'apple', 'youtube', 'other'] as const;

const outlet = z.object({
  platform: z.enum(PLATFORMS),
  url: z.string().url(),
  label: z.string().optional(),
});

const track = z.object({
  title: z.string(),
  src: z.string(),
  duration: z.string().optional(),
});

const releases = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/releases' }),
  schema: z
    .object({
      title: z.string(),
      artist: z.string(),
      role: z.string(),
      // "YYYY-MM" or "YYYY"
      date: z.string().regex(/^\d{4}(-\d{2})?$/, 'date must be "YYYY" or "YYYY-MM"'),
      format: z.string(),
      cover: z.string(),
      coverAlt: z.string(),
      outlets: z.array(outlet).default([]),
      selfHosted: z.object({ tracks: z.array(track).min(1) }).nullable().optional(),
      myPart: z.string().optional(),
      credits: z.array(z.object({ role: z.string(), name: z.string() })).default([]),
    })
    // Spec §5: "A release needs at least one outlet or selfHosted.
    // Validate this at build time."
    .refine((r) => r.outlets.length > 0 || (r.selfHosted?.tracks?.length ?? 0) > 0, {
      message:
        'Release needs at least one entry in `outlets`, or a `selfHosted.tracks` array. ' +
        'A release with neither has no way to be listened to.',
      path: ['outlets'],
    }),
});

export const collections = { releases };
