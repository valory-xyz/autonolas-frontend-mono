# AutonolasFrontendMono

This mono repo contains the frontend for the Autonolas project. It is based on the Nx workspace and contains the following projects:
- [shorts.wtf](https://www.shorts.wtf/)
- [autonolas-registry](https://registry.olas.network/)

## Start the app

To start the development server run `npx nx run [app-name]:serve`. Open your browser and navigate to http://localhost:4200/. 

## Create a new app

To create a new app run `npx nx generate @nx/next:app [app-name]`. This will create a new app in the `apps` folder.

## More info

Learn more about Nx with `Next` [in the docs](https://nx.dev/nx-api/next) such as 
- Creating a new app
- Generating libraries
- Generating components with storybook, etc

## Running tasks

To execute tasks with Nx use the following syntax:

```
nx <target> <project> <...options>
```

You can also run multiple targets:

```
nx run-many -t <target1> <target2>
```

..or add `-p` to filter specific projects

```
nx run-many -t <target1> <target2> -p <proj1> <proj2>
```

## Nx console extension

It is recommended to use the [Nx Console extensions](https://nx.dev/nx-console) for your IDE. It provides autocomplete support, a UI for exploring and running tasks & generators and more!
