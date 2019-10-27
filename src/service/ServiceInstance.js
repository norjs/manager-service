/**
 *
 */
class ServiceInstance {

    /**
     *
     * @param name {string}
     * @param childProcess {NorChildProcess}
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
         * @member {NorChildProcess}
         * @private
         */
        this._childProcess = childProcess;

        /**
         *
         * @member {number|undefined}
         * @private
         */
        this._pid = this._childProcess ? this._childProcess.pid : undefined;

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
     * @returns {NorChildProcess}
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

    /**
     * Get the pid of the child process
     * @returns {number|undefined}
     */
    getPid () {
        return this._pid;
    }

}

export default ServiceInstance;
