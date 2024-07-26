# Development
This will use the mock environment from `environment/environment.mock.ts`.
All calls to external APIs are mocked. There is a development environment which can be configured under `environment/environment.local.dev.ts` to use a custom base url like `http://localhost:8080/core` but this wont work at the moment as CORS is not enabled server side. To use other environments, change `defaultConfiguration` under `angular.json`.

```
ng serve
```

# Docker Images
There is a prod image with all optimizations and there is a debug image without optimizaitons.
This will provide clearer logs in case of runtime errorss.