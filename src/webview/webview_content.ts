import { WebviewContentHelper } from "../interface/webview_content_helper";
import { StorageActionResult } from "../storage/storage_action_result";

export abstract class WebViewContent {

    public static readonly resultContainerId = "actionResult";

    protected name: string = "abstract";
    protected params: Map<string, any> = new Map();
    protected storageActionResult: StorageActionResult | undefined;
    protected webviewContentHelper: WebviewContentHelper;

    public constructor(webviewContentHelper: WebviewContentHelper) {
        this.webviewContentHelper = webviewContentHelper;
    }

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

    public refreshAfterAction() {
        if (this.storageActionResult?.success) {
            this.webviewContentHelper.refreshView();
            return;
        }

        this.webviewContentHelper.setHtmlContent(
            "#" + WebViewContent.resultContainerId,
            this.getStorageActionContentInner()
        );
    }

    public getStorageActionContent() {
        return `<div id="${WebViewContent.resultContainerId}">${this.getStorageActionContentInner()}</div>`;
    }

    public getStorageActionContentInner() {
        if (typeof this.storageActionResult === "undefined") {
            return "";
        }

        let result = this.storageActionResult;
        let resultStyle = result.success ? "info-message" : "error-message";

        let content = `
            <p class="${resultStyle}">
                ${new Date(result.timestamp).toLocaleString()}
            </p>
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
            content += `<span class="info-message">${im}</span><br />`;
        });
        content += "</p>";

        return content;
    };
}