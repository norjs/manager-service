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
require('@norjs/types/NorManagerStatusActionObject.js');

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
         * @member {{POST: {"/install/": (function(*=, *=): Promise<{payload: *}>), "/status/": (function(*=, *=): Promise<{payload: *}>), "/start/": (function(*=, *=): Promise<{payload: *}>)}, GET: {"/install/": {path: string, method: string}, "/status/": {path: string, method: string}, "/start/": {path: string, method: string}, "/": {path: string, actions: *[]}}}}
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
                            path: "/status/",
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

                "/status/": {
                    path: "/status/",
                    method: "POST"
                },

                "/start/": {
                    path: "/start/",
                    method: "POST"
                }

            },

            POST: {
                "/install/": (req, res) => this._onInstallRequest(req, res),
                "/start/": (req, res) => this._onStartRequest(req, res),
                "/status/": (req, res) => this._onStatusRequest(req, res)
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
    _onStatusRequest (req, res) {
        return HttpUtils.getRequestDataAsJson(req).then(
            data => this._onStatusAction(data ? data.payload : {})
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
        return this._manager.onInstallAction(payload);
    }

    /**
     *
     * @param payload {NorManagerStatusActionObject}
     * @private
     */
    _onStatusAction (payload) {
        TypeUtils.assert(payload, "NorManagerStatusActionObject");
        return this._manager.onStatusAction(payload);
    }

    /**
     *
     * @param payload {NorManagerStartActionObject}
     * @private
     */
    _onStartAction (payload) {
        TypeUtils.assert(payload, "NorManagerStartActionObject");
        return this._manager.onStartAction(payload);
    }

}

/**
 *
 * @type {typeof HttpManagerAdapter}
 */
module.exports = HttpManagerAdapter;
