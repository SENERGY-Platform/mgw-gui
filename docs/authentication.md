# Authentication

## Applies when

Touching the auth guard, the HTTP interceptor, or the login page — or wondering
why a cold start under `ng serve` produces a wave of 401s that a deployed core
never shows.

**Not this if**: you are chasing a 401 on a single endpoint while the rest of
the application works. That is an authorization question about that endpoint,
not the session, and nothing here applies. This document is about *whether
there is a session at all*.

## The gateway, not the application, decides who gets the app

The core's nginx puts `/core/web-ui` behind the same `auth_request` as
`/core/api`. Without a session the document itself is answered with a redirect
to the login page, so **in a deployed core the application is only ever served
to someone who is already logged in**.

Under `ng serve` that is not true. The dev server serves the application
directly and only `/core` is proxied, so the app boots unauthenticated and its
pages start loading data that cannot be fetched.

This is the single most misread thing about auth here: the 401s on a cold
development start are an artefact of the dev server, not a production defect.
Before treating one as a bug, check which of the two you are looking at.

## The guard covers the cold start, the interceptor covers expiry

They are not redundant, they cover different moments:

- **`authGuard`** (`core/services/auth/auth.guard.ts`) runs before a page is
  activated. Without it every page starts its data loading, collects a 401 per
  request, and only then gets sent to the login form.
- **`AuthCheckInterceptor`** covers a session that expires while the
  application is already open. No guard sees that — the routes were activated
  while the session was still good.

Every feature route sits under one guarded pass-through in `app.routes.ts`; the
login route stays outside it. Adding a feature to that list is what guards it,
so a new feature added elsewhere in the array is unprotected.

## The session probe asks a health endpoint, deliberately

There is no `whoami` to ask. The gateway keeps `/validate-session` as an
internal nginx location and exposes only the login and logout flows under
`/core/auth`. Every `/core/api` path sits behind the same `auth_request`, which
makes a health endpoint the cheapest honest stand-in: it answers 200 with a
session and 401 without one, and being asked is its entire job.

`AuthService.hasSession()` probes
`/core/api/module-manager/health/service` and caches the answer for the life of
the loaded application. Two details are load-bearing:

- The probe sets the `SKIP_AUTH_REDIRECT` context token. Without it the
  interceptor would redirect on the probe's own 401 and pre-empt the decision
  the guard is about to make.
- **Only a 401 counts as "no session".** A service that is down must not read
  as logged out — that would trade an error the user can act on for a login
  screen that will not help them.

## The redirect is routed, not assigned to `location`

The interceptor navigates with the router. Assigning to `window.location.href`
reloads the document and throws away whatever the user had typed into the page
they were on — a half-filled deployment form, for instance. The login page
reloads on its own once the session is back, so the reload is not needed
earlier.

Two guards on that redirect:

- It fires **once** for a whole page's worth of failed requests, not once per
  request.
- It does not fire at all when the login page is already showing. A request
  dispatched before the redirect can still fail after it, and navigating again
  would overwrite the `return_to` captured the first time with the login page
  itself — stranding the user on the login form after signing in.

`return_to` is `window.location.pathname + search`, the browser's own path. The
router's URL starts below the base href the gateway serves the application
under, so using it would drop that prefix in production.
