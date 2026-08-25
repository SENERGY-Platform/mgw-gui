# UI structure

## Applies when

Changing or adding a page on the `next-gen` branch, as of 2026-08-20.

**Not this if**: you are on `master`. That is the legacy UI compatible with the
old core and follows none of the conventions below.

## Navigation follows what is managed

Not which service owns it: Overview, then Modules (installed, catalog,
repositories), then Resources (secrets, global configs, endpoints), then System.

Endpoints used to be reachable by URL only and are now linked — the reason the
grouping is by subject rather than by backend is exactly that: a page nobody can
navigate to is a page nobody finds.

## Conventions a new page has to follow

- **Angular Material 3** with a single token set; light and dark follow
  `color-scheme`. Colours come from `--mat-sys-*` and a small set of semantic
  status tokens, **never from literals**.
- A page states its title and its own primary action — `mgw-page-header`.
- State is shown as a labelled pill, not as a bare coloured dot —
  `mgw-status-pill`. A colour alone is not readable for everyone and not
  translatable.
- An empty table explains what to do next — `mgw-empty-state`.
- Shared layout classes are prefixed `mgw-` in `styles.css`.

## Old routes redirect

Bookmarks keep working: `/secrets`, `/modules/manage`,
`/modules/global-configs`, `/deployments/endpoints`. Removing a redirect breaks
links people have saved, which produces a bug report that looks like a missing
page.

## Development

- `npm run start:local` serves against a real local core through the dev proxy
  (`proxy.conf.json`).
- CI runs on every push: secrets scan, build (strict `tsc`), Karma suite, npm
  audit. Since 2026-08-20 the tag-triggered image builds run the test suite
  before pushing, so a red state cannot ship as `:latest`.
- Toolchain is Node 24 everywhere — local, CI and the Docker build image — so
  the lockfile is always written and consumed by the same npm major.
