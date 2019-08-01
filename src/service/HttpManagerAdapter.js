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
class HttpManagerAdapter {

    /**
     *
     * @param manager {ManagerService}
     */
    constructor ({
        manager
    }) {

        /**
         *
         * @member {ManagerService}
         * @private
         */
        this._manager = manager;

        /**
         *
         * @member {typeof HttpManagerAdapter}
         */
        this.Class = HttpManagerAdapter;

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
     * @param req {HttpRequestObject}
     * @param res {HttpResponseObject}
     * @return {Promise}
     */
    onRequest (req, res) {

        console.log(LogUtils.getLine(`Request "${req.method} ${req.url}" started`));

        return HttpUtils.routeRequest(HttpUtils.getRequestAction(req), this._routes, req, res);

    }

    /**
     *
     * @param req {HttpRequestObject}
     * @param res {HttpResponseObject}
     * @returns {Promise<{payload: *}>}
     * @private
     */
    _onInstallRequest (req, res) {
        return HttpUtils.getRequestDataAsJson(req).then(
            data => this._onInstallAction(data ? data.payload : {})
        ).then(payload => ({payload}) );
    }

    /**
     *
     * @param req {HttpRequestObject}
     * @param res {HttpResponseObject}
     * @returns {Promise<{payload: *}>}
     * @private
     */
    _onStartRequest (req, res) {
        return HttpUtils.getRequestDataAsJson(req).then(
            data => this._onStartAction(data ? data.payload : {})
        ).then(payload => ({payload}) );
    }

    /**
     *
     * @param payload {NorManagerInstallActionObject}
     * @private
     */
    _onInstallAction (payload) {
        TypeUtils.assert(payload, "NorManagerInstallActionObject");
        console.log(`WOOT: install action with `, payload);
        return this._manager.onInstallAction(payload);
    }

    /**
     *
     * @param payload {NorManagerStartActionObject}
     * @private
     */
    _onStartAction (payload) {
        TypeUtils.assert(payload, "NorManagerStartActionObject");
        console.log(`WOOT: start action with `, payload);
        return this._manager.onStartAction(payload);
    }

}

/**
 *
 * @type {typeof HttpManagerAdapter}
 */
module.exports = HttpManagerAdapter;
