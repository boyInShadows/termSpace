# termspace brand assets

Primary blue: `#2051CE` · dark ink `#F4F3F8` · light ink `#2B2936` · dark bg `#1A1823`

## Logo (block mark) — `public/brand/`
| File | Use |
|---|---|
| `logo-mark.svg` | Master. Transparent, off-white tiles — for dark backgrounds, header, README on dark |
| `logo-mark-light.svg` | Transparent, dark tiles — for light backgrounds, print, docs |
| `logo-mark-{256,512,1024}.png` / `logo-mark-light-*.png` | Transparent raster exports of the two above |
| `logo-mark-tile.svg` / `logo-mark-tile-1024.png` | On brand background — social avatars, GitHub org, places that need a filled square |

Prefer the SVGs anywhere the web is involved; the PNGs are for places that can't take SVG.

## Favicon ("t" + caret) — Next.js app router conventions in `app/`
| File | Use |
|---|---|
| `app/icon.svg` | Modern browsers (replaces the old `>_` placeholder) |
| `app/favicon.ico` | Legacy / Safari / Windows shortcuts — 16, 32, 48 px layers |
| `app/apple-icon.png` | iOS home screen, 180×180 |

Extra sizes in `public/brand/`: `favicon-{16…512}.png`, `icon-192.png`, `icon-512.png` (for a web manifest),
`favicon-transparent-light.svg` (no tile, for light contexts).

The favicon keeps a dark rounded tile on purpose — tab bars vary in colour and a bare white "t" would disappear on light ones.
