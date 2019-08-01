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

        /**
         *
         * @type {{GET: {"/install/": (function(): {path: string}), "/start/": (function(): {path: string}), "/": (function(): {path: string})}}}
         * @private
         */
        this._routes = {

            GET: {

                "/": {
                    path: "/",
                    actions: [
                        {
                            path: "/install/",
                            method: "POST"
                        },
                        {
                            path: "/start/",
                            method: "POST"
                        }
                    ]
                },

                "/install/": {
                    path: "/install/",
                    method: "POST"
                },

                "/start/": {
                    path: "/start/",
                    method: "POST"
                }

            },

            POST: {
                "/install/": (req, res) => this._onInstallRequest(req, res),
                "/start/": (req, res) => this._onStartRequest(req, res)
            }

        };

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

        return HttpUtils.routeRequest(HttpUtils.getRequestAction(req), this._routes, req, res);

    }

    /**
     * Close the server
     */
    destroy () {
        console.log(LogUtils.getLine(`${ManagerService.getAppName()} destroyed`));
    }

    _onInstallRequest (req, res) {
        return HttpUtils.getRequestDataAsJson(req).then(data => this._onInstallAction(data ? data.payload : {}));
    }

    _onStartRequest (req, res) {
        return HttpUtils.getRequestDataAsJson(req).then(data => this._onStartAction(data ? data.payload : {}));
    }

    /**
     *
     * @param payload {NorManagerInstallActionObject}
     * @private
     */
    _onInstallAction (payload) {
        TypeUtils.assert(payload, "NorManagerInstallActionObject");
        console.log(`WOOT: install action with `, payload);


    }

    /**
     *
     * @param payload {NorManagerStartActionObject}
     * @private
     */
    _onStartAction (payload) {
        TypeUtils.assert(payload, "NorManagerStartActionObject");
        console.log(`WOOT: start action with `, payload);
    }

}

/**
 *
 * @type {typeof ManagerService}
 */
module.exports = ManagerService;
