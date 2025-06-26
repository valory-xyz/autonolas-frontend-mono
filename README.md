# AutonolasFrontendMono

This mono repo contains the frontend for the Autonolas project. It is based on the Nx workspace and contains the following projects:
- [Registry](https://registry.olas.network/)
- [Bond](https://bond.olas.network/)
- [Govern](https://govern.olas.network/)
- [Launch](https://launch.olas.network/)
- [Operate](https://operate.olas.network/)
- [Build](https://build.olas.network/)(work in progress)


## Start the app

- To start the development server run the following command. Open your browser and navigate to http://localhost:4200/.
  ```bash
  npx nx run [app-name]:serve
  ```

- To create an app in the monorepo, use:
  ```bash
  npx nx generate @nx/react:app apps/<app-name>
  ```

- To create a library in the monorepo:
  - For a React library, use:
    ```bash
    npx nx generate @nx/react:library libs/<lib-name>
    ```
  - For a JavaScript library, use:
    ```bash
    npx nx generate @nx/js:library libs/<lib-name>
    ```
  and other documentation can be found in the [Nx documentation](https://nx.dev/features/generate-code#generate-code).
  - For general questions on creating apps and libraries:
    - Which bundler would you like to use to build the library? Choose 'none' to skip build setup: `vite`.
    - Which testing framework would you like to use? Choose 'none' to skip testing setup: `jest`.

- To run tests for a specific app or library, use:
  ```bash
  npx nx test <app-or-lib-name>
  ```
- To clear the cache, use:
  ```bash
  npx nx reset
  ```

## License
![MIT](https://img.shields.io/badge/License-MIT-yellow.svg)