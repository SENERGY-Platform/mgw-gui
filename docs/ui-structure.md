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

## Sortable tables bind MatSort through a setter

Every list here renders its table behind a condition — a spinner while loading,
an empty state when there is nothing to show. `ngAfterViewInit` therefore runs
before the table exists, `@ViewChild(MatSort)` stays `undefined`, and the hook
does not run a second time. A table wired that way silently keeps whatever order
the API sent, and a click on a column header does nothing.

Bind it from a setter instead, which fires whenever the table appears:

```ts
@ViewChild(MatSort) set tableSort(sort: MatSort | undefined) {
  if (sort) {
    this.dataSource.sort = sort;
  }
}
```

The guard is not cosmetic: the setter fires with `undefined` when a filter
empties the table, and without it the sort would be torn down.

Anything that does not depend on the view — `filterPredicate`,
`sortingDataAccessor` — goes in `ngOnInit`, which is guaranteed to run before the
setter, so the accessor is in place the first time rows are sorted.

Two tables in one component need a template reference each
(`#endpointSort="matSort"`) and one setter per table. A type-based
`@ViewChild(MatSort)` binds whichever renders first and leaves the other
unsorted — that was the state of the endpoints page until 2026-08-31.

## Old routes redirect

Bookmarks keep working: `/secrets`, `/modules/manage`,
`/modules/global-configs`, `/deployments/endpoints`. Removing a redirect breaks
links people have saved, which produces a bug report that looks like a missing
page.

One route was dropped **without** a redirect on 2026-08-31: the container logs
moved from `/containers/<name>/logs` under the module that owns the container,
and the new path needs a module id the old URL does not carry. There is no
target to redirect to, so saved links to that page fail.

## A page on two routes derives its back target

The container logs page is mounted twice: under the module that owns the
container (`modules/detail/:id/containers/:containerId/logs`), and under
`system/status/container-logs/:containerId` for the core services, which carry
no module id. A back target built from `params['id']` without checking it
yields `/modules/detail/undefined` on the second route — a 404 the router
cannot warn about, because the path is syntactically valid.

The query parameters travelling with it need the same treatment:
`tab=containers` selects a tab the service list does not have. Read the
parameter, derive target and query parameters together, and pin each route in a
spec — `logs.component.spec.ts` builds the component on both. Until 2026-09-07
it had no spec at all, which is how the undefined target reached an install.

## Development

- `npm run start:local` serves against a real local core through the dev proxy
  (`proxy.conf.json`).
- CI runs on every push: secrets scan, build (strict `tsc`), Karma suite, npm
  audit. Since 2026-08-20 the tag-triggered image builds run the test suite
  before pushing, so a red state cannot ship as `:latest`.
- Toolchain is Node 24 everywhere — local, CI and the Docker build image — so
  the lockfile is always written and consumed by the same npm major.
