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
 * @type {typeof PromiseUtils}
 */
const PromiseUtils = require('@norjs/utils/Promise');

/**
 *
 * @type {typeof HttpUtils}
 */
const HttpUtils = require('@norjs/utils/Http');

// Types and interfaces
require('@norjs/types/NorConfigurationObject.js');

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
     *
     * @param req {HttpRequestObject}
     * @param res {HttpResponseObject}
     * @return {Promise}
     */
    onRequest (req, res) {

        console.log(LogUtils.getLine(`Request "${req.method} ${req.url}" started`));

        return HttpUtils.routeRequest(HttpUtils.getRequestAction(req), {
            GET: {
                "/": () => ({path: "index"}),
                "/install/": () => ({path: "install"}),
                "/start/": () => ({path: "start"})
            }
        });

    }

    /**
     * Close the server
     */
    destroy () {
        console.log(LogUtils.getLine(`${ManagerService.getAppName()} destroyed`));
    }

}

/**
 *
 * @type {typeof ManagerService}
 */
module.exports = ManagerService;
