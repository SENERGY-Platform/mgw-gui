# Configuration is compile-time only

## Applies when

Adding or changing any setting in this application, or being asked to make
something configurable per installation.

**Not this if**: you know the cloud platform frontend's runtime configuration
(`set-env.ts` / `env.template.json`, values read from `window.env`). That
pattern does **not** exist here, and looking for it is the usual detour.

## There is no runtime configuration

Every setting lives in `src/environments/*.ts` and is selected by
`fileReplacements` in `angular.json`. The four build configurations are
`production`, `debug`, `local_development` and `development_mock`.

There is no `config.json` fetched at startup, no `APP_INITIALIZER`, no
`window.__env`, and the Dockerfile does no `envsubst` on the build output.

**The practical consequence:** anything an operator should be able to change per
installation cannot be expressed today. It either goes into the image at build
time — one image per value — or a runtime mechanism has to be introduced first.
Worth knowing before promising a configurable anything.

## The one runtime artefact does not reach the app

The Dockerfile writes its `VERSION` build argument into `version.txt` in the web
root, and nginx serves it at `/version`. **Nothing in the application reads it.**

`environment.uiVersion` is the literal string `'UI-VERSION'` in all five
environment files, and no substitution for it exists anywhere in the repository.
So the version shown in the shell — and anything derived from it — is that
placeholder, not the built version. This looks like a display bug and is a
missing build step.
