# Development

See `https://v17.angular.io/guide/setup-local` for installing the needed tools like NPM.
Then install the dependencies with `npm install` and run the development web server with `ng serve`.

In angular most configurations like base URLs for API calls are done in environments under `src/environment`.
Runnin `ng serve` will use the mock environment from `src/environment/environment.mock.ts`.
All calls to external APIs are mocked. There is a development environment which can be configured under `src/environment/environment.local.dev.ts` to use a custom base url like `http://localhost:8080/core` but this wont work at the moment as CORS is not enabled server side. To use other environments, change `defaultConfiguration` under `angular.json`.

# Docker Images

There is a prod image with all optimizations and the respective production environment under `src/environment/environment.prod.ts` and there is a debug image without optimizations.
This will provide clearer logs in case of runtime errors.

# Internationalization

Runtime translation via [`@jsverse/transloco`](https://jsverse.gitbook.io/transloco) - chosen over Angular's
built-in i18n because that needs a build per language, and the MGW ships as one image. English (`en`) is the
only language today and stays the default; everything below still applies with one language, so that adding a
second is a translation exercise, not a restructuring.

## File layout

One translation file per feature area under `src/assets/i18n/<scope>/en.json` - `core`, `modules`,
`deployments`, `secrets`, `system`, `developer`, `overview`, `auth`, `container`. No shared/common file: if the
same phrase occurs in two areas, each area gets its own key with its own copy. The duplication is intentional -
it is what lets each area's file be owned and reviewed independently, and it means a change to one area's
wording can never silently change another's.

`src/assets/i18n/en.json` (no scope folder, sitting next to the per-area ones) is the one exception, and it
stays `{}`: Transloco loads this unscoped file once alongside the *first* scope any page uses, whether or not
anything actually asks for an unscoped key, and logs a load failure if it 404s. Keep it present and empty
rather than deleting it - it is bookkeeping for the library, not a place to put shared text.

A component that shows translated text declares which file it needs with `providers:
[provideTranslocoScope('<scope>')]` on the `@Component` (not only on a top-level page - every component that
uses the pipe, however small, so it works when tested or reused on its own). This controls which JSON gets
fetched; it does not shorten the keys you write - see the next section.

## Keys

Write the **fully-qualified key**, scope included, everywhere: `'core.shell.toggleNav' | transloco` in a
template, `translate('core.errorService.detailsAction')` in TypeScript. This is easy to get wrong: Transloco's
`autoPrefixKeys` option (on by default) suggests scoped keys can be written unprefixed and get the scope name
added automatically. In the version pinned here that only happens when `translate()` itself is called with a
scope-qualified `lang` argument (e.g. `translate('key', {}, 'core/en')`) - the `TranslocoPipe` does not do this
for you; it resolves the active language to a bare `'en'` before calling `translate()`, so an unprefixed key
silently renders as itself (Transloco's missing-key fallback) instead of throwing. Always write the scope
prefix by hand, and check a new key by looking at the rendered page - a raw key showing through is the tell.

JSON files nest by component/concern, matching the key path: `{"shell": {"toggleNav": "..."}, "nav": {...}}`.
Keep the nesting shallow enough to read at a glance; a dialog or component typically gets one top-level key
named after it.

## Templates and attributes

Text nodes take the pipe directly: `{{ 'core.shell.brandName' | transloco }}`. Attributes need a binding to
carry it - `aria-label="Toggle navigation"` becomes `[attr.aria-label]="'core.shell.toggleNav' | transloco"`,
and the same for `matTooltip`, `placeholder`, etc. (those already take a binding, so no `attr.` prefix:
`[matTooltip]="'...' | transloco"`).

## TypeScript-only messages

If a component field flows into the template through ordinary interpolation (`{{ someField }}`), keep
`someField` holding the *translated text*, resolved once via `TranslocoService.translate()` when the value is
set - see `FeedbackDialogComponent.screenshotError`. If the same field can be empty and templates should show a
fallback, let the **template** decide the fallback through the pipe instead of resolving it in the constructor
(`{{ context || ('core.errorDialog.defaultContext' | transloco) }}`) - a constructor-time `translate()` call
runs before the scope's translations may have loaded, whereas the pipe re-renders once they do.

The one case with no template at all - a `MatSnackBar.open(message, action)` call, for instance - has to call
`translate()` directly and accept the message as it is at that instant; see `ErrorService.handleError`. Unlike
the pipe, a direct `translate()` call never loads a scope itself, it only reads whatever is already cached -
this relies on some component with `provideTranslocoScope(...)` for the same scope having rendered earlier and
loaded it (in practice the shell, for `core`, well before any request can fail). A spec that calls such a
method in isolation has to load the scope itself first - see the `beforeEach` in `error.service.spec.ts`.

If the class is `providedIn: 'root'` and reachable from many unrelated feature areas (like `ErrorService`),
inject Transloco through `safeInjectTransloco()` (`src/app/core/services/language/safe-transloco.ts`) instead
of `inject(TranslocoService)` directly: a plain injection throws for any spec elsewhere in the app that
constructs the service without ever configuring Transloco, which - for a service this widely depended on - is
most of them.

## Static data driving a template

An array or record used only to feed a template (`NAV_ITEMS`, `TELEMETRY_LEVEL_OPTIONS`) holds translation
*keys* in its text fields, not display text - the template applies the pipe where it renders each entry. This
keeps the data structure itself language-agnostic and is the same pattern `ThemeService.label()` and
`ListJobTable.statusLabel()` use for a computed label.

## Plurals and interpolated values

No ICU/plural plugin is wired up - not needed yet with one language and few plural sites. Where a count needs
a plural, the JSON carries both forms under `.one`/`.other` and the caller picks in code:

```json
"summary": { "one": "{{failed}} of {{total}} item failed.", "other": "{{failed}} of {{total}} items failed." }
```

```ts
summaryKey(): string {
  return `core.jobResultDialog.summary.${this.items.length === 1 ? 'one' : 'other'}`;
}
```

```html
{{ summaryKey() | transloco: {failed: failedCount(), total: items.length} }}
```

Never build a sentence by concatenating strings - `status + ' (HTTP ' + code + ')'` reads wrong in most
languages. Put the whole sentence in the JSON with `{{placeholders}}` for the values instead, and pass them as
the pipe's (or `translate()`'s) second argument.

Not every "identifier plus a value" needs this: `JobResultItem.label` in `job-result-view.ts` sometimes holds a
raw id concatenated with a backend action tag (`"my-module (update)"`), and that stays as-is - it is closer to
a technical label than a sentence, and running it through the pipe would report every one of those as a missing
translation key. Judge by whether it reads as prose to a user or as an identifier with a qualifier.

## Tests

`src/testing/transloco-testing.ts` exports `provideTranslocoTesting(...scopes)`, which loads the *real* JSON
for each named scope (so a spec fails if a template and the JSON drift apart) and resolves synchronously - one
`fixture.detectChanges()` is enough, no `whenStable()` needed. Add a scope to its `SCOPED_TRANSLATIONS` map the
first time a spec needs it. Any spec that renders a component carrying `provideTranslocoScope(...)` needs this
in its `TestBed.configureTestingModule({imports: [...]})` - note `imports`, not `providers`:
`TranslocoTestingModule.forRoot(...)` is a `ModuleWithProviders`, not a plain provider.

## Adding a language

Add its code to `AVAILABLE_LANGS` in `src/app/core/services/language/language.service.ts` and drop a same-shaped
JSON file next to `en.json` in every scope that has translations ready. `LanguageSwitchComponent` (in the
shell's toolbar) only renders once `AVAILABLE_LANGS` holds more than one entry - nothing else has to change to
turn the switch on.
