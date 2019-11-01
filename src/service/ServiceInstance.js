import LogUtils from "@norjs/utils/Log";
import LogicUtils from "@norjs/utils/Logic";

const nrLog = LogUtils.getLogger('ServiceInstance');

/**
 *
 */
export class ServiceInstance {

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

        LogicUtils.tryCatch(() => this._childProcess.destroy(), err => nrLog.error(err));

        this._childProcess = undefined;

    }

    /**
     * Get the pid of the child process
     * @returns {number|undefined}
     */
    getPid () {
        return this._pid;
    }

    /**
     *
     * @param signal {number|string}
     */
    kill (signal = 'SIGTERM') {

        nrLog.trace(`Killing pid ${this._pid} with signal ${signal}`);

        this._childProcess.kill(signal);

    }

    /**
     * Sends a signal to the group of the pid.
     *
     * *NOTE!* The internal child process must be started with detached mode.
     *
     * @param signal {number|string}
     */
    killGroup (signal = 'SIGTERM') {

        nrLog.trace(`Killing pid group for ${this._pid} with signal ${signal}`);

        this._childProcess.killGroup(signal);

    }

    hasStdIn () {
        return this._childProcess.hasStdIn();
    }

    /**
     * Send CTRL-C to sub process.
     */
    sendCtrlC () {

        nrLog.trace(`Sending CTRL-C to ${this._pid}`);

        this._childProcess.sendCtrlC();

    }



}

export default ServiceInstance;
