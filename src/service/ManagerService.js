import _ from 'lodash';
import TypeUtils from "@norjs/utils/Type";
import LogicUtils from '@norjs/utils/Logic';
import LogUtils from '@norjs/utils/Log';
import ChildProcessUtils from '@norjs/utils/ChildProcess';

// Types and interfaces
import '@norjs/types/NorConfigurationObject.js';
import '@norjs/types/NorManagerInstallActionObject.js';
import '@norjs/types/NorManagerStartActionObject.js';
import '@norjs/types/NorManagerStatusActionObject.js';
import '@norjs/types/NorManagerStopActionObject.js';

import ServiceInstance from './ServiceInstance.js';

/**
 *
 */
class ManagerService {

    /**
     *
     * @param services {Object.<string,NorConfigurationServiceObject>}
     * @param mode {string} The running mode, eg. "production" or "development".
     * @param autoStart {boolean} If `true`, will start services marked with "autoStart" property at start up
     */
    constructor ({
        services = {},
        mode = "development",
        autoStart = true
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
         * If enabled, will start "autoStart" services at `.onInit()` when the service is initialized.
         *
         * @member {boolean}
         * @private
         */
        this._autoStartEnabled = autoStart;

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

    /**
     * Called after all the parts of the service are initialized.
     *
     * This will start the process to auto start services, etc.
     *
     */
    onInit () {

        if (this._autoStartEnabled) {
            this._autoStartServices();
        } else {
            console.log(LogUtils.getLine(`Auto start feature disabled.` ));
        }

    }

    // noinspection JSMethodCanBeStatic
    /**
     * Called after the HTTP server is listening somewhere for this service.
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

        LogicUtils.tryCatch( () => this._stopServices(), err => this._handleError(err) );

        _.forEach( _.keys(this._instances), instance => {
            this._removeInstance(instance);
        });

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
                autoStart: payload.autoStart,
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

                /**
                 *
                 * @type {NorChildProcess}
                 */
                const child = ChildProcessUtils.execute('npm', ['install'], options);

                return child.resultPromise.then( result => {
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
            autoStart: payload.autoStart,
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
                        data.split('\n').filter(row => !!_.trim(row)).forEach(row => {
                            console.log(LogUtils.getLine(`[${key}] ${row}`));
                        });
                    },
                    stderr: (data) => {
                        data.split('\n').filter(row => !!_.trim(row)).forEach(row => {
                            console.error(LogUtils.getLine(`[${key}] ${row}`));
                        });
                    }
                };

                /**
                 *
                 * @type {NorChildProcess}
                 */
                const child = ChildProcessUtils.execute('npm', ['start'], options);

                child.resultPromise.then( result => {
                    if (result && result.status !== undefined) {
                        console.log(LogUtils.getLine(`Service "${key}" stopped with a status ${result ? result.status : undefined}`));
                    } else {
                        console.error(LogUtils.getLine(`Service "${key}" stopped with an unexpected result status:`), result);
                    }
                }, err => {
                    if (err.status) {
                        if (err.stderr) {
                            console.error(LogUtils.getLine(`Service "${key}" stopped with a status ${err.status}: "${err.stderr}"`));
                        } else {
                            console.error(LogUtils.getLine(`Service "${key}" stopped with a status ${err.status}`));
                        }
                    } else {
                        console.error(LogUtils.getLine(`Service "${key}" stopped with an error: `), err);
                    }
                }).catch(err => {
                    console.error(LogUtils.getLine(`Service "${key}" had an exception: `), err);
                    if (err.stack) {
                        console.debug(LogUtils.getLine(`Exception with stack: `), err.stack);
                    }
                }).finally(() => {

                    this._removeInstance(key);

                });

                // noinspection UnnecessaryLocalVariableJS
                const instance = new ServiceInstance({
                    name: key,
                    childProcess: child
                });

                this._instances[key] = instance;

                return new Promise( resolve => {
                    setTimeout(() => {
                        resolve({name: key, state: this._instances[key] ? "started" : "stopped" } );
                    }, 1000);
                });

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
            autoStart: payload.autoStart,
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
     *
     * @param payload {NorManagerStopActionObject}
     * @returns {Promise.<Array.<{name: string, state: string}>>}
     */
    onStopAction (payload) {

        TypeUtils.assert(payload, "NorManagerStopActionObject");

        const serviceKeys = this._filterServiceKeys(_.keys(this._instances), {
            production: payload.production,
            development: payload.development,
            name: payload.name
        });

        _.map(serviceKeys, key => {
            const instance = this._instances[key];
            LogicUtils.tryCatch( () => {

                const pid = instance.getPid();

                console.log(LogUtils.getLine(`Stopping service "${key}" with pid ${pid}...`));

                process.kill(pid, 'SIGTERM');

            }, err => this._handleError(err) );
        });

        return Promise.resolve(_.map(
            serviceKeys,
            key => ({
                name: key,
                state: _.has(this._instances, key) ? 'started' : 'stopped'
            })
        ));

    }

    /**
     * Removes an instance which no longer is running
     *
     * @param name {string}
     * @private
     */
    _removeInstance (name) {

        if (_.has(this._instances, name)) {

            LogicUtils.tryCatch( () => this._instances[name].onDestroy() , err => this._handleError(err) );

            delete this._instances[name];

        }

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
            case "autoStart": modeKey = "autoStart"; break;
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
     * @param autoStart {undefined|boolean}
     * @param name {undefined|string}
     * @returns {Array.<string>}
     * @private
     */
    _filterServiceKeys (
        serviceKeys,
        {
            production = undefined,
            development = undefined,
            autoStart = undefined,
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

        if (_.isBoolean(autoStart)) {
            serviceKeys = this._filterServiceKeysForMode(serviceKeys, "autoStart", autoStart);
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

    /**
     * Generate a start action for auto start services.
     *
     * @protected
     */
    _autoStartServices () {

        let payload = {
            autoStart: true
        };

        // Start services marked with autoStart
        switch (this._mode) {
            case "production":
                payload.production = true;
                break;
            case "development":
                payload.development = true;
                break;
            default:
                throw new TypeUtils(`Unknown mode: "${this._mode}"`);
        }

        console.log(LogUtils.getLine(`Starting ${this._mode} services...` ));
        this.onStartAction(payload).then( result => {
            console.log(LogUtils.getLine(`Services started: ${ result.map(result => `${result.name}@${result.state}`).join(', ') }` ));
        }).catch( err => {
            console.error(LogUtils.getLine(`Failed to start services: "${err}": `, err));
        } );

    }

    /**
     *
     * @protected
     */
    _stopServices () {

        let payload = {};

        console.log(LogUtils.getLine(`Stopping services...` ));

        this.onStopAction(payload).then( result => {
            console.log(LogUtils.getLine(`Services stopped: ${ result.map(result => `${result.name}@${result.state}`).join(', ') }` ));
        }).catch( err => {
            console.error(LogUtils.getLine(`Failed to stop services: "${err}": `, err));
        } );

    }

}

export default ManagerService;
