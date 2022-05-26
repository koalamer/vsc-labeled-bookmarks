import { WebViewContent } from "./webview_content";
import { HeaderContent } from "./header_content";
import { StorageManager } from "../interface/storage_manager";
import { WebviewContentHelper } from "../interface/webview_content_helper";
import { StorageActionResult } from '../storage/storage_action_result';

export class MovePage extends WebViewContent {

    private header: HeaderContent;
    private webviewContentHelper: WebviewContentHelper;
    private storageManger: StorageManager;

    public constructor(storageManager: StorageManager, webviewContentHelper: WebviewContentHelper) {
        super();
        this.name = "moveTo";
        this.header = new HeaderContent("Move Database", this.name);
        this.webviewContentHelper = webviewContentHelper;

        this.storageManger = storageManager;
    }

    public processMessage(operation: string, name: string, formData: any): void {
        if (operation === "submit" && name === "moveTo") {
            let params = JSON.parse(formData);

            let storageType: string = params.storageType ?? "";
            let targetFile: string = params.targetFile ?? "";

            if (storageType === "") {
                this.storageActionResult = StorageActionResult.simpleError("No storage type selected.");
                this.webviewContentHelper.refreshView();
                return;
            }

            if (storageType === "file" && targetFile === "") {
                this.storageActionResult = StorageActionResult.simpleError("No target file selected.");
                this.webviewContentHelper.refreshView();
                return;
            }

            this.storageManger.executeStorageAction("moveTo", storageType, targetFile, []).then(
                (storageActionResult) => {
                    this.storageActionResult = storageActionResult;
                    this.webviewContentHelper.refreshView();
                }
            );
        }
    }

    public async getContent(): Promise<string> {
        return await this.header.getContent() +
            await this.bodyContent()
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

        return `<form name="moveTo">
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
                        data-file-input-name="targetFile"
                        data-access-type="write"
                        value="..."
                    />
                    <input
                        type="text"
                        name="targetFile"
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
                    value="Move"
                    data-form="moveTo"
                />
            </p>
        </form>`;
    }
}