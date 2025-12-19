# Kevin Hyde Music

Personal music release site at [music.kevinhide.com](https://music.kevinhide.com).

## Adding a New Song

1. Export audio as 320kbps MP3
2. Name it: `[song-slug].mp3` (lowercase, hyphens)
3. Add to `/audio` folder
4. Create artwork or placeholder in `/artwork`
5. Add JSON metadata to `/catalog`
6. Add `<article class="track">` block to `index.html` (newest at top)
7. Commit and push

## File Naming Convention

```
audio/
  song-title.mp3        # 320kbps MP3
  song-title.flac       # Lossless (future)

artwork/
  song-title.jpg        # Final artwork (1400x1400)
  song-title-placeholder.svg  # Typographic placeholder
```

## Deployment

Site deploys automatically via Cloudflare Pages on push to `main`.

## Future Enhancements

- [ ] Download buttons with format options
- [ ] FLAC/lossless files
- [ ] Stripe tip jar integration
- [ ] Final artwork replacement
- [ ] RSS feed for releases
- [ ] Email signup
- [ ] Album consolidation pages

## Copyright

All music © 2025 Kevin Hyde. All rights reserved.
