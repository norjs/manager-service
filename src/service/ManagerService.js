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
     */
    constructor ({
        services
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

        const steps = _.map(_.keys(this._services), key => {
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

        const steps = _.map(_.keys(this._services), key => {
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

        return _.map(_.keys(this._services), key => {

            // const service = this._services[key];
            const instance = _.has(this._instances, key) ? this._instances[key] : undefined;

            return {
                name: key,
                state: instance ? 'started' : 'stopped'
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
