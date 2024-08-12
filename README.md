# Development
See `https://v17.angular.io/guide/setup-local` for installing the needed tools like NPM.
Then install the dependencies with `npm install` and run the development web server with `ng serve`.

In angular most configurations like base URLs for API calls are done in environments under `src/environment`. 
Runnin `ng serve` will use the mock environment from `src/environment/environment.mock.ts`.
All calls to external APIs are mocked. There is a development environment which can be configured under `src/environment/environment.local.dev.ts` to use a custom base url like `http://localhost:8080/core` but this wont work at the moment as CORS is not enabled server side. To use other environments, change `defaultConfiguration` under `angular.json`.


# Docker Images
There is a prod image with all optimizations and the respective production environment under `src/environment/environment.prod.ts` and there is a debug image without optimizations.
This will provide clearer logs in case of runtime errors.