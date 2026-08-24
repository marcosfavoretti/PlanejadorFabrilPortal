# PlanejamentoEthosPortal

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.1.2.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## API client

`src/api` is a committed artifact and is part of the source of truth for builds and deploys.

To update the generated client, run locally:

```bash
npm run generate
```

For a production-style generation, Kubb loads `.env.production` (or the
existing `.env.prod`) first and falls back to `.env` for values that are not
defined there:

```bash
npm run generate --production
```

To generate every client with the development host, set the host explicitly
in `.env.production` (or in the shell):

```dotenv
KUBB_API_HOST=https://dev.ethos.ind.br
```

`KUBB_API_HOST` changes only the host embedded in the generated clients; the
Swagger URLs remain controlled by their respective `API_SWAGGER_*` variables.

Operational rules:

- CI does not call Swagger or regenerate `src/api`.
- Production and CI only accept committed generated code pointing to `https://app.ethos.ind.br`.
- Before committing changes in `src/api`, validate the committed client with:

```bash
npm run check:api-client
```

The generator depends on the Swagger environment variables configured for local use in `kubb.config.ts`. A development host can be selected explicitly with `KUBB_API_HOST`; this is intended for local validation and should not be committed to `src/api`.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
