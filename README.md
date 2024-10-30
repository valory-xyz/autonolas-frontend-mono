# AutonolasFrontendMono

This mono repo contains the frontend for the Autonolas project. It is based on the Nx workspace and contains the following projects:
- [Registry](https://registry.olas.network/)
- [Bond](https://bond.olas.network/)
- [Govern](https://govern.olas.network/)
- [Launch](https://launch.olas.network/)
- [Operate](https://operate.olas.network/)

## Start the app

To start the development server run `npx nx run [app-name]:serve`. Open your browser and navigate to http://localhost:4200/. 

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
