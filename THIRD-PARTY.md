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

The font holds the icons listed in `src/assets/fonts/icon-names.txt`, and
`npm run check:icons` fails when something the syntax marks as an icon is not
among them. `scripts/icon-usage.mjs` decides what counts as used, and
`scripts/material-symbols-names.txt` lists every name the full face knows,
extracted from its ligature table - which is what makes it possible to tell an
icon name from an ordinary string.

That distinction matters more than it looks. Icon names arrive from three
places: the content of a `<mat-icon>`, an `icon:` property in TypeScript, and
occasionally a method that just returns one. Only the first two are
recognisable as icons from their syntax; the theme toggle's `light_mode` is a
string like any other. Cutting the font from templates alone once cost the
navigation every one of its icons, with nothing failing anywhere.

The file a name sits in matters as much as its syntax. A component with an
inline `template:` keeps its markup in the `.ts`, so scanning `<mat-icon>` in
`.html` alone misses it — that is how every page lost its back arrow while
`check:icons` reported all icons present. The markup patterns therefore run
over both suffixes.

```sh
# 1. what the application asks for: the certain ones, plus the literals that
#    are real icon names
npm run --silent icons:list > src/assets/fonts/icon-names.txt

# 2. a font cut to exactly those
ICONS=$(tr '\n' ',' < src/assets/fonts/icon-names.txt | sed 's/,$//')
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36"
curl -sS -A "$UA" -G "https://fonts.googleapis.com/css2" \
  --data-urlencode "family=Material Symbols Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" \
  --data-urlencode "icon_names=$ICONS" --data-urlencode "display=block" -o /tmp/symbols.css

# 3. the file the stylesheet points at
curl -sS -A "$UA" \
  -o src/fonts/material-symbols-rounded.woff2 \
  "$(grep -oE 'https://fonts.gstatic.com/[^)]+' /tmp/symbols.css | head -1)"

# 4. look at a page afterwards. A missing icon shows as its own name in words
#    and no test catches it.
```

A browser-like user agent matters, and it has to be a complete one: Google Fonts
serves `woff2` only to clients it believes support it. A short string such as
`Mozilla/5.0 Chrome/151.0` no longer qualifies — the answer is then `ttf`, split
across one `@font-face` per axis instead of a single file, which is why the
download picks the first URL. Check `format('woff2')` in the css before
downloading; that is the cheap way to notice.

`scripts/material-symbols-names.txt` only needs regenerating when the upstream
face gains icons. It comes from the ligature table of the full `woff2`, read
with `fonttools`.

The `@font-face` rules themselves live in `src/fonts/fonts.css` and are written
here rather than taken over, so the stylesheet Google serves is not part of this
repository.
