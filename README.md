# @norjs/manager-service

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

If you're using NPM package names as a path, you must use `npm install` to install your projects. (See an issue #7 which would add support for the manager to do it for you.)

Executing an install action for `nor-manager-service` will run the `npm install` command for each matching local service.

```
curl -X POST localhost:3000/install -H "Content-Type: application/json" -d '{"payload":{"development": true}}'
```

The payload can have any combination of properties: 

 * `name` - Filter by a package name, as a `string`.
 * `production` - Filter services by production flag, as `true` | `false` | `undefined`
 * `development` - Filter services by development flag, as `true` | `false` | `undefined`
 * `debug` - Enable additional information in the response (eg. results from stdout), this may require memory.

#### Starting services

Executing a start action for `nor-manager-service` will start each service and write their logs to the manager's console.

```
curl -X POST localhost:3000/start -H "Content-Type: application/json" -d '{"payload":{"development": true}}'
```

The payload can have any combination of properties: 

 * `name` - Filter by a package name, as a `string`.
 * `production` - Filter services by production flag, as `true` | `false` | `undefined`
 * `development` - Filter services by development flag, as `true` | `false` | `undefined`

#### Requesting status of services

Executing a status action for `nor-manager-service` will display information for each service.

```
curl -X POST localhost:3000/status -H "Content-Type: application/json" -d '{"payload":{"development": true}}'
```

The payload can have any combination of properties: 

 * `name` - Filter by a package name, as a `string`.
 * `production` - Filter services by production flag, as `true` | `false` | `undefined`
 * `development` - Filter services by development flag, as `true` | `false` | `undefined`

#### Custom environment variables

You can configure custom environment variables with the `env` property.

#### Production and development modes

Any action should have a boolean property `production` and/or `development` as a boolean.

Otherwise the service will not be started nor installed unless it is named directly in the command.

#### Command line environment options

The `nor-manager-service` accepts following environment options:

 * `NOR_MANAGER_CONFIG` -- The path to configuration, defaults to `./norjs.json` 
 * `NOR_MANAGER_SERVICE_PATH` -- The path to configuration root directory, defaults to directory of `NOR_MANAGER_CONFIG`
 * `NODE_LISTEN` -- Where to start the service. Defaults to `./socket.sock`. Can also be a `hostname:port` or `port` for TCP connections.
 
### Testing with curl

To test a HTTP service at `localhost:3000`:

`curl -X POST localhost:3000/status -H "Content-Type: application/json" -d '{"payload": {"debug": true}}'`
