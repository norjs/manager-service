
const _ = require('lodash');

/**
 *
 * @type {typeof TypeUtils}
 */
const TypeUtils = require("@norjs/utils/Type");

/**
 *
 * @type {typeof LogicUtils}
 */
const LogicUtils = require('@norjs/utils/Logic');

/**
 *
 * @type {typeof HttpUtils}
 */
const HttpUtils = require('@norjs/utils/Http');

/**
 *
 * @type {typeof ManagerService}
 */
const ManagerService = require('../service/ManagerService.js');

/**
 *
 * @type {typeof HttpManagerAdapter}
 */
const HttpManagerAdapter = require('../service/HttpManagerAdapter.js');

/**
 *
 * @type {typeof ProcessUtils}
 */
const ProcessUtils = require('@norjs/utils/Process');

// Types and interfaces
require('@norjs/types/NorConfigurationObject.js');

/**
 *
 * @type {PathModule}
 */
const PATH = require('path');

LogicUtils.tryCatch( () => {

    // noinspection JSUnresolvedVariable
    /**
     *
     * @type {string}
     */
    const NOR_MANAGER_CONFIG = process.env.NOR_MANAGER_CONFIG || './nor.json';

    // noinspection JSUnresolvedVariable
    /**
     *
     * @type {string}
     */
    const NOR_MANAGER_SERVICE_PATH = process.env.NOR_MANAGER_SERVICE_PATH || PATH.dirname(NOR_MANAGER_CONFIG);

    // noinspection JSUnresolvedVariable
    /**
     *
     * @type {string}
     */
    const NODE_LISTEN = process.env.NODE_LISTEN || './socket.sock';

    const HAS_PRODUCTION_ARG = _.some(process.argv, arg => arg === "production");
    const HAS_DEVELOPMENT_ARG = _.some(process.argv, arg => arg === "development");

    if ( HAS_PRODUCTION_ARG && HAS_DEVELOPMENT_ARG ) {
        throw new TypeError(`You cannot have both 'production' and 'development' arguments.`);
    }

    /**
     * The default environment to start services.
     *
     * The Environment Option "NODE_ENV" can be overwritten using a command line argument.
     *
     * Defaults to `development`.
     *
     * @type {string}
     */
    const NODE_ENV = HAS_PRODUCTION_ARG ? 'production' : ( HAS_DEVELOPMENT_ARG ? 'development' : (process.env.NODE_ENV || 'development'));

    // noinspection JSValidateTypes
    /**
     *
     * @type {NorConfigurationObject}
     */
    const config = ProcessUtils.requireFile(NOR_MANAGER_CONFIG);
    TypeUtils.assert(config, "NorConfigurationObject");

    /**
     *
     * @type {HttpServerModule & HttpClientModule}
     */
    const HTTP = require('http');

    /**
     * Services by their name
     *
     * @type {Object.<string,NorConfigurationServiceObject>}
     */
    const services = {};

    if (config.services && _.keys(config.services).length) {
        _.forEach(_.keys(config.services), key => {

            /**
             *
             * @type {NorConfigurationServiceObject}
             */
            const serviceConfig = config.services[key];

            const servicePath = serviceConfig.path;

            const serviceConfigPath = PATH.resolve(
                NOR_MANAGER_SERVICE_PATH,
                servicePath.startsWith('.')
                    ? servicePath
                    : PATH.join("./node_modules", servicePath)
            );

            services[key] = {
                name: key,
                path: serviceConfigPath,
                production: serviceConfig.production,
                development: serviceConfig.development,
                env: serviceConfig.env
            };

        });
    }

    /**
     * This is the buiness logic for manager service
     *
     * @type {ManagerService}
     */
    const service = new ManagerService({
        services,
        mode: NODE_ENV
    });

    /**
     * This class converts HTTP requests to actions in ManagerService
     *
     * @type {HttpManagerAdapter}
     */
    const httpManagerAdapter = new HttpManagerAdapter({
        manager: service
    });

    // Create server
    const server = HttpUtils.createJsonServer(
        HTTP,
        (req, res) => httpManagerAdapter.onRequest(req, res)
    );

    // Start listening
    HttpUtils.listen(server, NODE_LISTEN, () => {
        LogicUtils.tryCatch( () => service.onListen(HttpUtils.getLabel(NODE_LISTEN)), err => ProcessUtils.handleError(err) );
    });

    // Setup automatic destroy on when process ends
    ProcessUtils.setupDestroy(() => {

        LogicUtils.tryCatch( () => service.destroy(), err => ProcessUtils.handleError(err) );

        LogicUtils.tryCatch( () => server.close(), err => ProcessUtils.handleError(err) );

    });

}, err => ProcessUtils.handleError(err) );
