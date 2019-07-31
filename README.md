# @norjs/manager-service

***NOTE!*** This README is a draft. This software is not yet published nor finished; until then this is the complete
specification for a developer.

This is a micro service which manages other services.

You may use it with [the @norjs/portal-service](https://github.com/norjs/portal-service) which (will eventually) 
implement the routing part of the configuration file, once it has support for this service.

### Install

```
npm install -d @norjs/manager-service
```

### Usage

Configuration file named `nor.json`:

```json
{
  "name": "my-awesome-app",
  "services": {
    "backend": {
      "path": "./backend",
      "production": true,
      "development": true,
      "env": {
        "NODE_LISTEN": "./backend.sock"
      }
    },
    "frontend": {
      "path": "./frontend",
      "production": true,
      "development": true,
      "env": {
        "NODE_LISTEN": "localhost:4000"
      }
    }
  }
}
```

Where `./backend` and `./frontend` are directories with standard `package.json` files and correct NPM rules for 
installing and starting the service.

Please note, that if you use `backend` or `frontend`, that will be recognized as a NPM package name, and 
`./node_modules/NAME` will be used instead as a path.

#### Installing services

If you're using NPM dependencies directly, you may not need to run the install step at all. Of course, you'll need to 
use `npm install` then.

Running `nor-manager-service install` will run the install command for each service in the development mode.

`nor-manager-service install production` will do the same in a production mode.
 
#### Starting services

`nor-manager-service start` will start each service in a development mode and open a combined console for each.

`nor-manager-service start production` will do the same in a production mode.

#### Using with the package.json

You may combine this as a single root `./package.json`:

```json
{
  "name": "my-awesome-app",
  "version": "1.0.0",
  "description": "My awesome full stack app",
  "scripts": {
    "install": "nor-manager-service install",
    "start": "nor-manager-service start"
  },
  "dependencies": {
    "@norjs/manager-service": "^1.0.10"
  }
}
```

#### Custom environment variables

You can configure custom environment variables with the `env` property.

#### Production and development modes

The configuration should have a boolean property `production` and/or `development` enabled.

Otherwise the service will not be started nor installed unless it is named directly in the command.

If the mode is omitted in a command, `development` will be used.

#### Service naming

The service has a short and full name. The full name is the project name combined using a slash with the sub service 
name, which is the keyword of the services property.

Eg, `my-awesome-app/backend` and `my-awesome-app/frontend` are two services from the main example.

If one uses the `my-awesome-app` as part of another managed service as a sub service, the name may be combined as
`some-name/my-awesome-app/backend`.

