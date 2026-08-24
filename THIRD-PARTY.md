# Third-party assets

Files taken over from elsewhere and shipped as part of this application. Code
written here is not listed; this is for things whose licence belongs to
somebody else.

## Fonts

Both faces are served from the gateway itself rather than from a CDN. A gateway
without internet access would otherwise render the interface in a fallback font
and every icon as its own ligature name in plain text.

### Inter

- **Files**: `src/fonts/inter-latin.woff2`, `src/fonts/inter-latin-ext.woff2`
- **Source**: <https://fonts.google.com/specimen/Inter> (upstream: <https://github.com/rsms/inter>), v20 as served by Google Fonts
- **Licence**: SIL Open Font License 1.1 — `src/assets/fonts/LICENSE-Inter.txt`
- **Taken over**: 2026-08-24
- **Modified**: no. These are the variable-font subsets Google Fonts serves per
  unicode range, byte for byte.

### Material Symbols Rounded

- **File**: `src/fonts/material-symbols-rounded.woff2`
- **Source**: <https://fonts.google.com/icons> (upstream: <https://github.com/google/material-design-icons>), v368 as served by Google Fonts
- **Licence**: Apache License 2.0 — `src/assets/fonts/LICENSE-MaterialSymbols.txt`
- **Taken over**: 2026-08-24
- **Modified**: subset. The full face carries thousands of icons and several
  megabytes; this one carries the icons the templates name, and nothing else.

#### Regenerating the icon subset

The font files sit in `src/fonts/` so the bundler emits them once, hashed;
their licences and the icon list stay under `src/assets/fonts/`, which is
copied verbatim.

`src/assets/fonts/icon-names.txt` is the list of icons in the file, and
`npm run check:icons` fails when a template asks for one that is not in it.
When that happens, or when an icon is no longer used and the file may shrink:

```sh
# 1. the icons the templates currently name
grep -rhoE ">[a-z_]{3,}</mat-icon>" src/app --include='*.html' \
  | sed 's/>//;s/<\/mat-icon>//' | sort -u > src/assets/fonts/icon-names.txt

# 2. a font cut to exactly those, via the icon_names parameter
ICONS=$(tr '\n' ',' < src/assets/fonts/icon-names.txt | sed 's/,$//')
curl -sS -A "Mozilla/5.0 Chrome/151.0" -G "https://fonts.googleapis.com/css2" \
  --data-urlencode "family=Material Symbols Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" \
  --data-urlencode "icon_names=$ICONS" --data-urlencode "display=block" -o /tmp/symbols.css

# 3. the file the stylesheet points at
curl -sS -A "Mozilla/5.0 Chrome/151.0" \
  -o src/fonts/material-symbols-rounded.woff2 \
  "$(grep -oE 'https://fonts.gstatic.com/l/font\?[^)]+' /tmp/symbols.css)"
```

A browser-like user agent matters: Google Fonts serves `woff2` only to clients
it believes support it, and an unrecognised agent gets `ttf` instead.

The `@font-face` rules themselves live in `src/fonts/fonts.css` and are
written here rather than taken over, so the stylesheet Google serves is not
part of this repository.
