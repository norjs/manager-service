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
 * @type {typeof LogUtils}
 */
const LogUtils = require('@norjs/utils/Log');

/**
 *
 * @type {typeof ChildProcessUtils}
 */
const ChildProcessUtils = require('@norjs/utils/ChildProcess');

// Types and interfaces
require('@norjs/types/NorConfigurationObject.js');
require('@norjs/types/NorManagerInstallActionObject.js');
require('@norjs/types/NorManagerStartActionObject.js');
require('@norjs/types/NorManagerStatusActionObject.js');

/**
 *
 * @type {ServiceInstance}
 */
const ServiceInstance = require('./ServiceInstance.js');

/**
 *
 */
class ManagerService {

    /**
     *
     * @param services {Object.<string,NorConfigurationServiceObject>}
     * @param mode {string} The running mode, eg. "production" or "development".
     */
    constructor ({
        services,
        mode
    }) {

        /**
         *
         * @member {Object.<string,NorConfigurationServiceObject>}
         * @private
         */
        this._services = services;

        /**
         *
         * @member {Object.<string, ServiceInstance>}
         * @private
         */
        this._instances = {};

        /**
         * The running mode.
         *
         *  - `"production"`
         *  - `"development"`
         *
         * @member {string}
         * @private
         */
        this._mode = mode;

        /**
         *
         * @member {typeof ManagerService}
         */
        this.Class = ManagerService;

    }

    /**
     *
     * @returns {string}
     * @abstract
     */
    static getAppName () {
        return '@norjs/manager-service';
    }

    // noinspection JSMethodCanBeStatic
    /**
     *
     * @param port {string} A string which presents where the service is running
     */
    onListen (port) {
        console.log(LogUtils.getLine(`${ManagerService.getAppName()} running at ${port}` ));
    }

    // noinspection JSMethodCanBeStatic
    /**
     * Close the server
     */
    destroy () {
        console.log(LogUtils.getLine(`${ManagerService.getAppName()} destroyed`));
    }

    /**
     *
     * @param payload {NorManagerInstallActionObject}
     */
    onInstallAction (payload) {

        TypeUtils.assert(payload, "NorManagerInstallActionObject");

        const serviceKeys = this._filterServiceKeys(
            _.keys(this._services),
            {
                production: payload.production,
                development: payload.development,
                name: payload.name
            }
        );

        const steps = _.map(serviceKeys, key => {
            return () => {

                const service = this._services[key];

                if (!service.path) {
                    return Promise.resolve({name: key, status: -1, error: `No service.path defined!`});
                }

                const stdoutEnabled = !!payload.debug;

                const options = {
                    cwd: service.path,
                    stdout: stdoutEnabled
                };

                return ChildProcessUtils.execute('npm', ['install'], options).then( result => {
                    return {name: key, status: result.status, debug: result.stdout, warnings: result.stderr};
                }).catch( err => {
                    if (err.status) {
                        return {name: key, status: err.status, error: err.stderr, debug: err.stdout};
                    } else {
                        return {name: key, status: -1, error: `${err}`};
                    }
                });

            };

        });

        return ManagerService._collectResults(steps);

    }

    /**
     *
     * @param payload {NorManagerStartActionObject}
     */
    onStartAction (payload) {

        TypeUtils.assert(payload, "NorManagerStartActionObject");

        const serviceKeys = this._filterServiceKeys(_.keys(this._services), {
            production: payload.production,
            development: payload.development,
            name: payload.name
        });

        const steps = _.map(serviceKeys, key => {
            return () => {

                const service = this._services[key];

                if (!service.path) {
                    return Promise.resolve({name: key, status: -3, error: `No service.path defined!`});
                }

                if (_.has(this._instances, key)) {
                    return Promise.resolve({name: key, status: -3, error: `Service was already started`});
                }

                const options = {
                    cwd: service.path,
                    env: service.env ? _.cloneDeep(service.env) : {},
                    stdout: (data) => {
                        console.log(LogUtils.getLine(`[${key}] '${data}'`));
                    },
                    stderr: (data) => {
                        console.error(LogUtils.getLine(`[${key}] '${data}'`));
                    }
                };

                const promise = ChildProcessUtils.execute('npm', ['start'], options).then( result => {
                    console.log(LogUtils.getLine(`Service "${key}" stopped with a status ${result.status}`));
                }, err => {
                    if (err.status) {
                        if (err.stderr) {
                            console.error(LogUtils.getLine(`Service "${key}" stopped with a status ${err.status}: "${err.stderr}"`));
                        } else {
                            console.error(LogUtils.getLine(`Service "${key}" stopped with a status ${err.status}`));
                        }
                    } else {
                        console.error(LogUtils.getLine(`Service "${key}" stopped with an error: `, err));
                    }
                }).catch(err => {
                    console.error(LogUtils.getLine(`Service "${key}" had an exception: `, err));
                }).finally(() => {

                    this._removeInstance(key);

                });

                // noinspection UnnecessaryLocalVariableJS
                const instance = new ServiceInstance({
                    name: key,
                    childProcess: promise.CHILD
                });

                this._instances[key] = instance;

                // FIXME: We should wait for a timeout until resolving, eg. for 15 seconds, to see if the service start fails.

                return Promise.resolve({name: key, state: "started" } );
            };

        });

        return ManagerService._collectResults(steps);

    }

    /**
     *
     * @param payload {NorManagerStatusActionObject}
     */
    onStatusAction (payload) {

        TypeUtils.assert(payload, "NorManagerStatusActionObject");

        const serviceKeys = this._filterServiceKeys(_.keys(this._services), {
            production: payload.production,
            development: payload.development,
            name: payload.name
        });

        return _.map(serviceKeys, key => {

            const service = this._services[key];
            const instance = _.has(this._instances, key) ? this._instances[key] : undefined;

            return {
                name: key,
                state: instance ? 'started' : 'stopped',
                production: service.production,
                development: service.development,
                env: _.cloneDeep(service.env)
            };

        });

    }

    /**
     * Removes an instance which no longer is running
     *
     * @param name {string}
     * @private
     */
    _removeInstance (name) {

        LogicUtils.tryCatch( () => this._instances[name].onDestroy() , err => this._handleError(err) );

        delete this._instances[name];

    }

    /**
     *
     * @param keys {Array.<string>}
     * @param mode {string}
     * @param value {boolean}
     * @private
     */
    _filterServiceKeysForMode (keys, mode, value) {

        let modeKey = undefined;
        switch (mode) {
            case "production": modeKey = "production"; break;
            case "development": modeKey = "development"; break;
            default: throw new TypeError(`Unknown mode: "${mode}"`);
        }

        return _.filter(keys, key => {

            if (!_.has(this._services, key)) {
                return false;
            }

            const service = this._services[key];

            return service[modeKey] === value;

        });
    }

    /**
     *
     * @param keys {Array.<string>}
     * @param property {string}
     * @param value {*}
     * @private
     */
    _filterServiceKeysByProperty (keys, property, value) {

        return _.filter(keys, key => {

            if (!_.has(this._services, key)) {
                return false;
            }

            const service = this._services[key];

            return service[property] === value;

        });
    }

    /**
     *
     * @param serviceKeys {Array.<string>}
     * @param production {undefined|boolean}
     * @param development {undefined|boolean}
     * @param name {undefined|string}
     * @returns {Array.<string>}
     * @private
     */
    _filterServiceKeys (
        serviceKeys,
        {
            production = undefined,
            development = undefined,
            name = undefined
        }
    ) {

        if (_.isString(name)) {
            serviceKeys = this._filterServiceKeysByProperty(serviceKeys, "name", name);
        }

        if (_.isBoolean(production)) {
            serviceKeys = this._filterServiceKeysForMode(serviceKeys, "production", production);
        }

        if (_.isBoolean(development)) {
            serviceKeys = this._filterServiceKeysForMode(serviceKeys, "development", development);
        }

        return serviceKeys;
    }

    // noinspection JSMethodCanBeStatic
    _handleError (err) {
        console.error(LogUtils.getLine(`Exception: "${err}": `, err));
    }

    /**
     *
     * @param steps {Array.<Function>}
     * @returns {Promise.<*>}
     * @private
     */
    static _collectResults (steps) {

        // noinspection JSMismatchedCollectionQueryUpdate
        let results = [];

        return _.reduce(
            steps,
            (a, b) => a.then(b).then(result => {
                results.push(result);
            }),
            Promise.resolve()
        ).then(
            () => results
        );

    }

}

/**
 *
 * @type {typeof ManagerService}
 */
module.exports = ManagerService;
