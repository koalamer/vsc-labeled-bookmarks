import { OutputChannel, window } from "vscode";

export class Logger {
    isEnabled: boolean;
    output: OutputChannel;

    constructor(name: string) {
        this.isEnabled = true;
        this.output = window.createOutputChannel(name);
    }

    public log(message: string) {
        if (!this.isEnabled) {
            return;
        }

        let date = new Date();
        this.output.appendLine(date.toISOString() + " " + message);
    }
}