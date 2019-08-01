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

    /**
     *
     * @param port {string} A string which presents where the service is running
     */
    onListen (port) {
        console.log(LogUtils.getLine(`${ManagerService.getAppName()} running at ${port}` ));
    }

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
        console.log(`WOOT: install action with `, payload, this._services);


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
