import { OutputChannel, window } from "vscode";

export class Logger {
    private isEnabled: boolean;
    private name: string;
    private output: OutputChannel | null;

    constructor(name: string, isEnabled: boolean = true) {
        this.name = name;
        this.isEnabled = false;
        this.output = null;
        this.setIsEnabled(isEnabled);
    }

    setIsEnabled(isEnabled: boolean) {
        if (isEnabled && this.output === null) {
            this.output = window.createOutputChannel(this.name);
        }
        this.isEnabled = isEnabled;
    }

    public log(message: string) {
        if (!this.isEnabled) {
            return;
        }

        let date = new Date();
        this.output?.appendLine(date.toISOString() + " " + message);
    }
}