export class RateLimiter {
    private limitedFunc: () => void;
    private pendingCallCount: number;
    private initialDelay: number;
    private isInitialDelayOver: boolean;
    private repeatInterval: number;
    private initialTimeout: NodeJS.Timeout | null;
    private repeatTimeout: NodeJS.Timeout | null;

    constructor(limitedFunc: () => void, initialDelay: number, repeatInterval: number) {
        this.limitedFunc = limitedFunc;
        this.pendingCallCount = 0;
        this.initialDelay = initialDelay;
        this.isInitialDelayOver = false;
        this.repeatInterval = repeatInterval;
        this.initialTimeout = null;
        this.repeatTimeout = null;
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

                this.startInitialTimeout();
                return;
            }

            this.isInitialDelayOver = true;
        }

        if (this.repeatTimeout !== null) {
            return;
        }

        this.pendingCallCount = 0;
        this.limitedFunc();

        this.repeatTimeout = setTimeout(
            () => {
                this.repeatTimeout = null;
                if (this.pendingCallCount === 0) {
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