import { getCollection, type CollectionEntry } from 'astro:content';

export type Release = CollectionEntry<'releases'>;

export const PLATFORM_NAMES: Record<string, string> = {
  bandcamp: 'Bandcamp',
  spotify: 'Spotify',
  soundcloud: 'SoundCloud',
  apple: 'Apple Music',
  youtube: 'YouTube',
  other: 'Other',
};

/** Spec §7: Bandcamp shows "buy / download", streaming platforms show "stream". */
export const PLATFORM_HINTS: Record<string, string> = {
  bandcamp: 'buy / download',
  spotify: 'stream',
  soundcloud: 'stream',
  apple: 'stream',
  youtube: 'watch',
  other: '',
};

export function platformName(o: { platform: string; label?: string }): string {
  if (o.platform === 'other') return o.label ?? 'Other';
  return PLATFORM_NAMES[o.platform] ?? o.label ?? o.platform;
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function year(date: string): string {
  return date.slice(0, 4);
}

/** Short month label for the hanging date column. Empty when the date is year-only. */
export function month(date: string): string {
  const m = date.slice(5, 7);
  return m ? MONTHS[Number(m) - 1] ?? '' : '';
}

export function monthLong(date: string): string {
  const m = date.slice(5, 7);
  return m ? MONTHS_LONG[Number(m) - 1] ?? '' : '';
}

/**
 * Spec §5: sort newest first; ties keep authoring order.
 * A year-only date sorts as if it were December of that year, so "2024"
 * sits above "2024-09" rather than below every dated release in its year.
 */
export function sortReleases(entries: Release[]): Release[] {
  const keyed = entries.map((entry, i) => {
    const d = entry.data.date;
    const y = Number(d.slice(0, 4));
    const m = d.length > 4 ? Number(d.slice(5, 7)) : 12;
    return { entry, sort: y * 100 + m, i };
  });
  keyed.sort((a, b) => (b.sort - a.sort) || (a.i - b.i));
  return keyed.map((k) => k.entry);
}

export async function allReleases(): Promise<Release[]> {
  return sortReleases(await getCollection('releases'));
}

export function hasPlayer(r: Release): boolean {
  return (r.data.selfHosted?.tracks?.length ?? 0) > 0;
}
