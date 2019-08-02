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
 */
class ServiceInstance {

    /**
     *
     * @param name {string}
     */
    constructor ({
        name,
        childProcess
    }) {

        /**
         * The service name
         *
         * @member {string}
         * @private
         */
        this._name = name;

        /**
         * The NodeJS child process object
         *
         * @member {ChildProcess}
         * @private
         */
        this._childProcess = childProcess;

    }

    /**
     *
     * @returns {string}
     */
    get name () {
        return this._name;
    }

    /**
     *
     * @returns {ChildProcess}
     */
    get childProcess () {
        return this._childProcess;
    }

    /**
     * Called before destroy happens.
     *
     * You may delete references to outside objects here.
     *
     */
    onDestroy () {
        this._childProcess = undefined;
    }

}

/**
 *
 * @type {typeof ServiceInstance}
 */
module.exports = ServiceInstance;
