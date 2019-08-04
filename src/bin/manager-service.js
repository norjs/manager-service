#!/usr/bin/env node

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
 * @type {typeof StringUtils}
 */
const StringUtils = require('@norjs/utils/String');

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

/**
 *
 * @type {FileSystemModule}
 */
const FS = require('fs');

LogicUtils.tryCatch( () => {

    // noinspection JSUnresolvedVariable
    /**
     *
     * @type {string}
     */
    const NOR_MANAGER_CONFIG = process.env.NOR_MANAGER_CONFIG || ( FS.existsSync('./nor.js') ? './nor.js' : undefined ) || './nor.json';

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

    const ARGV = process.argv;
    const HAS_PRODUCTION_ARG = _.some(ARGV, arg => arg === "production");
    const HAS_DEVELOPMENT_ARG = _.some(ARGV, arg => arg === "development");

    if ( HAS_PRODUCTION_ARG && HAS_DEVELOPMENT_ARG ) {
        throw new TypeError(`You cannot have both 'production' and 'development' arguments.`);
    }

    /**
     * This is the last --auto-start=true or --auto-start=false from command line arguments.
     *
     * If no arguments specified, it will be `undefined`.
     *
     * @type {boolean|undefined}
     */
    const AUTO_START_ARG = _.last(_.filter(_.filter(ARGV, arg => arg.startsWith('--auto-start=') ).map(arg => StringUtils.parseBoolean(arg.substr('--auto-start='.length))), arg => _.isBoolean(arg)));

    // noinspection JSUnresolvedVariable
    /**
     * The value of NOR_MANAGER_AUTO_START, otherwise AUTO_START_ARG, otherwise `true`.
     *
     * @type {boolean}
     */
    const NOR_MANAGER_AUTO_START = _.isBoolean(AUTO_START_ARG) ? AUTO_START_ARG : StringUtils.parseBoolean(process.env.NOR_MANAGER_AUTO_START, true);

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
                autoStart: serviceConfig.autoStart,
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
        mode: NODE_ENV,
        autoStart: NOR_MANAGER_AUTO_START
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

    service.onInit();

}, err => ProcessUtils.handleError(err) );
