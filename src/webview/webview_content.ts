import { StorageActionResult } from "../storage/storage_action_result";

export abstract class WebViewContent {

    protected name: string = "abstract";
    protected params: Map<string, any> = new Map();
    protected storageActionResult: StorageActionResult | undefined;


    public getName(): string {
        return this.name;
    };

    public processMessage(operation: string, name: string, value: any): void {
        switch (operation) {
            case "set":
                this.params.set(name, value);
                break;
        }
    }

    public getContent(): Promise<string> {
        return Promise.resolve(``);
    }

    public getStorageActionContent() {
        if (typeof this.storageActionResult === "undefined") {
            return "";
        }

        let result = this.storageActionResult;
        let outcome = result.success
            ? "success"
            : "failure";

        let content = `
            <p>
                ${new Date(result.timestamp).toLocaleString()} - ${outcome}
            </p>
            <p
        `;

        if (result.infos.length + result.warnings.length + result.errors.length === 0) {
            return content;
        }

        content += "<p>";
        result.errors.forEach((em) => {
            content += `<span class="error-message">${em}</span><br />`;
        });
        result.warnings.forEach((wm) => {
            content += `<span class="warning-message">${wm}</span><br />`;
        });
        result.infos.forEach((im) => {
            content += `${im}<br />`;
        });
        content += "</p>";

        return content;
    };
}