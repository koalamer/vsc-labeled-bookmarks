import { WebViewContent } from "./webview_content";
import { HeaderContent } from "./header_content";
import { StorageManager } from "../interface/storage_manager";
import { WebviewContentHelper } from "../interface/webview_content_helper";
import { StorageActionResult } from '../storage/storage_action_result';

export class SwitchPage extends WebViewContent {

    private header: HeaderContent;
    private storageManger: StorageManager;

    public constructor(storageManager: StorageManager, webviewContentHelper: WebviewContentHelper) {
        super(webviewContentHelper);
        this.name = "switchTo";
        this.header = new HeaderContent(webviewContentHelper, "Switch Database", this.name);
        this.storageManger = storageManager;
    }

    public processMessage(operation: string, name: string, formData: any): void {
        if (operation === "submit") {
            let params = JSON.parse(formData);

            let storageType: string = params.storageType ?? "";
            let otherFile: string = params.otherFile ?? "";

            if (storageType === "") {
                this.storageActionResult = StorageActionResult.simpleError("No storage type selected.");
                this.refreshAfterAction();
                return;
            }

            if (storageType === "file" && otherFile === "") {
                this.storageActionResult = StorageActionResult.simpleError("No file selected.");
                this.refreshAfterAction();
                return;
            }

            this.storageManger.executeStorageAction("switchTo", storageType, otherFile, [], new Map()).then(
                (storageActionResult) => {
                    this.storageActionResult = storageActionResult;
                    this.refreshAfterAction();
                }
            );
        }
    }

    public async getContent(): Promise<string> {
        return await this.header.getContent()
            + await this.bodyContent()
            + this.getStorageActionContent();
    }

    private async bodyContent(): Promise<string> {
        let currentType = this.storageManger.getActiveStorage().getStorageType();
        let currentPath = this.storageManger.getActiveStorage().getStoragePath();
        let currentStorageText: string;

        if (currentType === "workspaceState") {
            currentStorageText = "workspace state";
        } else {
            currentStorageText = "JSON file: " + currentPath;
        }

        return `<form name="VSCLBForm">
            <h2>Current location</h2>
            <p>
                ${currentStorageText}
            </p>
            <h2>Select new location</h2>
            <p>
                <div>
                    <label>
                        <input type="radio" name="storageType" value="workspaceState">
                        workspace state
                    </label>
                </div>
                <div class="file-selection">
                    <label><input type="radio" name="storageType" value="file"> JSON file</label>
                    <input
                        type="button"
                        class="file-selector"
                        data-file-input-name="otherFile"
                        data-access-type="read"
                        value="..."
                    />
                    <input
                        type="text"
                        name="otherFile"
                        readonly
                        placeholder="no file selected"
                    />
                </div>
            </p>
            <hr />
            <p>
                <input
                    type="button"
                    class="submit"
                    value="Switch"
                />
            </p>
        </form>`;
    }
}