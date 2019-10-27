import TypeUtils from "@norjs/utils/Type";
import LogUtils from '@norjs/utils/Log';
import HttpUtils from '@norjs/utils/Http';

// Types and interfaces
import '@norjs/types/NorConfigurationObject.js';
import '@norjs/types/NorManagerInstallActionObject.js';
import '@norjs/types/NorManagerStartActionObject.js';
import '@norjs/types/NorManagerStatusActionObject.js';
import '@norjs/types/NorManagerStopActionObject.js';

/**
 *
 */
export class HttpManagerAdapter {

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
                        },
                        {
                            path: "/stop/",
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
                },

                "/stop/": {
                    path: "/stop/",
                    method: "POST"
                }

            },

            POST: {
                "/install/": (req, res) => this._onInstallRequest(req, res),
                "/start/": (req, res) => this._onStartRequest(req, res),
                "/status/": (req, res) => this._onStatusRequest(req, res),
                "/stop/": (req, res) => this._onStopRequest(req, res)
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

        // noinspection JSUnresolvedVariable
        const method = req.method;

        console.log(LogUtils.getLine(`Request "${method} ${req.url}" started`));

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
     * @param req {HttpRequestObject}
     * @param res {HttpResponseObject}
     * @returns {Promise<{payload: *}>}
     * @private
     */
    _onStopRequest (req, res) {
        return HttpUtils.getRequestDataAsJson(req).then(
            data => this._onStopAction(data ? data.payload : {})
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

    /**
     *
     * @param payload {NorManagerStopActionObject}
     * @private
     */
    _onStopAction (payload) {
        TypeUtils.assert(payload, "NorManagerStopActionObject");
        return this._manager.onStopAction(payload);
    }

}

/**
 *
 * @type {typeof HttpManagerAdapter}
 */
export default HttpManagerAdapter;
