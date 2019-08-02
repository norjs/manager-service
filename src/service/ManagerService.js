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
     * @private
     */
    onInstallAction (payload) {

        TypeUtils.assert(payload, "NorManagerInstallActionObject");

        const results = [];

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
                }).then(result => {
                    results.push(result);
                });

            };

        });

        return _.reduce(steps, (a, b) => a.then(b), Promise.resolve()).then(() => results);

    }

    /**
     *
     * @param payload {NorManagerStartActionObject}
     * @private
     */
    onStartAction (payload) {
        TypeUtils.assert(payload, "NorManagerStartActionObject");
        console.log(`WOOT: start action with `, payload, this._services);


    }

}

/**
 *
 * @type {typeof ManagerService}
 */
module.exports = ManagerService;
