# Build pitfalls

## Applies when

Changing `build/Dockerfile`, the `test` target in `angular.json`, or anything
that decides which files reach an image — as of 2026-08-26.

**Not this if**: you are looking for where settings live and why nothing can be
configured per installation. That is
[configuration-is-compile-time-only.md](configuration-is-compile-time-only.md).

Three traps, none of which announces itself. All three shipped at some point
and were found by looking, not by a failing build.

## A shared serve stage leaks one build into the other

`COPY` overwrites by name. Everything that does **not** collide simply stays.

A stage that holds one build and is then extended by another therefore ships
both: the production image carried 80 source maps and two unminified bundles
next to the ones `index.html` actually loads — 15.6 MB of web root, of which
8.2 MB were maps of code nobody serves. Source maps hand out the original
sources, so this is not only weight.

Each serve target copies its own build from a base stage that holds nothing but
the server configuration. Production is 2.1 MB. When adding a target, copy the
build in that target, never in a shared parent.

## tsconfig.app.json does not see the mock services

It declares `"files": ["src/main.ts"]`, so the type checker follows imports from
there and nothing else. The mock services hang off `environment.mock.ts`, which
is only swapped in by a `fileReplacement` for the `development_mock`
configuration — so `tsc -p tsconfig.app.json` never reads them.

The consequence: a model can be renamed and the mocks keep the old field names
without anything failing. It happened when the module-manager's repository
structs gained json tags; the models and every consumer were updated and the
type check stayed green while the mock was still on the old names.

Anything that changes a shared model needs a build with `-c development_mock`,
not just a type check. That build does reach them.

## Icon names arrive from three places, two of them recognisable

The icon font is cut down to the icons this application asks for — the full face
is 5.3 MB against 137 kB. `npm run check:icons` guards it, and
[THIRD-PARTY.md](../THIRD-PARTY.md) documents the regeneration.

What makes it easy to get wrong: icon names come from the content of a
`<mat-icon>`, from an `icon:` property in TypeScript, and occasionally from a
method that just returns one. Only the first two are recognisable as icons from
their syntax. Cutting the font from the templates alone once cost the navigation
every one of its icons — its names live in `nav.model.ts` — and the theme
toggle's three, which a method returns.

A missing icon renders as its own name in words. Nothing fails: not the build,
not a test, and no spec renders an icon. It is visible only by looking at a
page, which is the reason `check:icons` exists and the reason it reports
"possible" names separately from certain ones.
