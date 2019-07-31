
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
 * @type {typeof ManagerService}
 */
const ManagerService = require('../service/ManagerService.js');

/**
 *
 * @type {typeof HttpUtils}
 */
const HttpUtils = require('@norjs/utils/Http');

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

            const serviceConfigPath = PATH.resolve(NOR_MANAGER_SERVICE_PATH, serviceConfig.path);

            services[key] = {
                name: key,
                path: serviceConfigPath
            };

        });
    }

    /**
     *
     * @type {ManagerService}
     */
    const service = new ManagerService({
        services
    });

    // Create server
    const server = HttpUtils.createServer(HTTP,(req, res) => {
        return service.onRequest(req, res);
    } );

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
