import { Logger } from "../logger/logger";

export class RateLimiter {
    private limitedFunc: () => void;
    private pendingCallCount: number;
    private initialDelay: number;
    private isInitialDelayOver: boolean;
    private repeatInterval: number;
    private initialTimeout: NodeJS.Timeout | null;
    private repeatTimeout: NodeJS.Timeout | null;

    private debugLogger: Logger;

    constructor(limitedFunc: () => void, initialDelay: number, repeatInterval: number) {
        this.limitedFunc = limitedFunc;
        this.pendingCallCount = 0;
        this.initialDelay = initialDelay;
        this.isInitialDelayOver = false;
        this.repeatInterval = repeatInterval;
        this.initialTimeout = null;
        this.repeatTimeout = null;

        this.debugLogger = new Logger("rateLimiter", false);
    }

    public fire(repeated: boolean = false) {
        if (!repeated) {
            this.pendingCallCount++;
        }

        if (!this.isInitialDelayOver) {
            if (this.initialDelay > 0) {
                if (this.initialTimeout !== null) {
                    return;
                }

                this.debugLogger.log("start initial timeout");
                this.startInitialTimeout();
                return;
            }

            this.isInitialDelayOver = true;
        }

        if (this.repeatTimeout !== null) {
            return;
        }

        this.debugLogger.log("execute limitedFunc with " + this.pendingCallCount + " pending call count");
        this.pendingCallCount = 0;
        this.limitedFunc();

        this.repeatTimeout = setTimeout(
            () => {
                this.repeatTimeout = null;
                if (this.pendingCallCount === 0) {
                    this.debugLogger.log("reset");
                    this.reset();
                    return;
                }
                this.fire(true);
            },
            this.repeatInterval
        );
    }

    private startInitialTimeout() {
        this.initialTimeout = setTimeout(
            () => {
                this.isInitialDelayOver = true;
                this.fire(true);
            },
            this.initialDelay
        );
    }

    private reset() {
        this.initialTimeout = null;
        this.isInitialDelayOver = false;
        this.repeatTimeout = null;

    }
}