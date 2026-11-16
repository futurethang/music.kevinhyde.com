/**
 * Cover images live in src/assets/covers so Astro can optimise them
 * (resize + WebP) instead of serving the originals untouched from public/.
 *
 * Release JSON still stores a plain string like "/covers/foo.jpg", which
 * keeps the content files hand-editable and `npm run new` simple. This
 * maps that string onto the imported asset.
 */
const modules = import.meta.glob<{ default: ImageMetadata }>(
  '../assets/covers/*.{jpg,jpeg,png,webp,avif,svg}',
  { eager: true }
);

const byName = new Map<string, ImageMetadata>();
for (const [path, mod] of Object.entries(modules)) {
  byName.set(path.split('/').pop()!, mod.default);
}

export function cover(ref: string): ImageMetadata {
  const name = ref.split('/').pop()!;
  const img = byName.get(name);
  if (!img) {
    throw new Error(
      `Cover "${ref}" not found. Expected src/assets/covers/${name}. ` +
      `Available: ${[...byName.keys()].sort().join(', ')}`
    );
  }
  return img;
}

/** SVG placeholders are passed through rather than raster-optimised. */
export function isVector(ref: string): boolean {
  return ref.toLowerCase().endsWith('.svg');
}
