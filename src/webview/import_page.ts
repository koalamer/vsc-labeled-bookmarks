import * as vscode from 'vscode';
import { WebViewContent } from "./webview_content";
import { HeaderContent } from "./header_content";
import { WebviewContentHelper } from "../interface/webview_content_helper";
import { StorageManager } from "../interface/storage_manager";
import { BookmarkDataStorage } from "../interface/bookmark_data_storage";
import { StorageActionResult } from "../storage/storage_action_result";
import { BookmarkStorageDummy } from "../storage/bookmark_storage_dummy";
import { BookmarkStorageInFile } from "../storage/bookmark_storage_in_file";

export class ImportPage extends WebViewContent {

    private header: HeaderContent;
    private storageManger: StorageManager;

    private step: number = 0;
    private importFilePath: string = "";
    private importStorage: BookmarkDataStorage = new BookmarkStorageDummy();
    private selectedGroups: string[] = [];
    private conflictResolutionMode: string = "rename";
    private pathMapping: Map<string, string> = new Map();

    private static readonly conflictResolutionModes: Map<string, string> = new Map([
        ["skip", "keep existing groups"],
        ["merge", "merge contents of groups"],
        ["replace", "replace existing groups with imported"],
        ["rename", "rename incoming group"]
    ]);

    public constructor(storageManager: StorageManager, webviewContentHelper: WebviewContentHelper) {
        super(webviewContentHelper);
        this.name = "importFrom";
        this.header = new HeaderContent(webviewContentHelper, "Import", this.name);
        this.storageManger = storageManager;
    }

    public processMessage(operation: string, name: string, formData: any) {
        this.asyncProcessMessage(operation, name, formData);
    }

    private async asyncProcessMessage(operation: string, name: string, formData: any) {
        if (operation === "reset") {
            this.step = 0;
            this.storageActionResult = StorageActionResult.simpleSuccess();
            this.importFilePath = "";
            this.importStorage = new BookmarkStorageDummy();
            this.selectedGroups = [];
            this.conflictResolutionMode = "rename";
            this.pathMapping = new Map();
            this.refreshAfterAction();
            return;
        }

        if (operation === "fileSelected" && name === "importFilePath") {
            this.webviewContentHelper.setFormElement("step", "1");
            this.webviewContentHelper.submitForm();
        }

        if (operation === "submit") {
            let params = JSON.parse(formData);

            vscode.window.showInformationMessage(params);

            this.step = parseInt(params.step) ?? 0;
            this.importFilePath = params.importFilePath ?? "";
            this.selectedGroups = params.groups ?? [];
            this.conflictResolutionMode = params.conflictResolution ?? "";
            this.storageActionResult = StorageActionResult.simpleSuccess();

            // let incomingPaths: string[] = params.incomingPaths ?? [];
            // let assignedPaths: string[] = params.assignedPaths ?? [];

            // this.pathMapping = new Map();
            // incomingPaths.forEach((v, key) => {
            // if (assignedPaths.length <= key) {
            // return;
            // }
            // let assignedPath = assignedPaths[key];
            // this.pathMapping.set(v, assignedPath);
            // });

            // wait for file to be selected
            if (this.step === 0) {
                return;
            };

            if (this.importFilePath === "") {
                this.storageActionResult = StorageActionResult.simpleError("No import file selected.");
                this.step = 0;
                this.refreshAfterAction();
                return;
            }

            this.importStorage = new BookmarkStorageInFile(vscode.Uri.file(this.importFilePath));
            try {
                await this.importStorage.readStorage();
            } catch (e) {
                this.storageActionResult = StorageActionResult.simpleError("Reading the storage file failed.");
                this.step = 0;
                this.refreshAfterAction();
                return;
            }

            this.storageActionResult = new StorageActionResult(
                true,
                ["Import file opened", "Select groups to be imported"],
                [],
                []
            );

            // give time for icon creation
            await new Promise(r => setTimeout(r, 250));

            this.refreshAfterAction();

            // wait for folder mapping and import group selection
            if (this.step === 1) {
                this.refreshAfterAction();
                return;
            };

            if (this.selectedGroups.length === 0) {
                this.storageActionResult = StorageActionResult.simpleError("No groups were selected.");
                this.step = 1;
                this.refreshAfterAction();
                return;
            }

            if (!ImportPage.conflictResolutionModes.has(this.conflictResolutionMode)) {
                this.storageActionResult = StorageActionResult.simpleError("Invalid conflisct resolution mode.");
                this.step = 1;
                this.refreshAfterAction();
                return;
            }

            // todo path mapping errors can be warnings runtime
            this.storageManger.executeStorageAction("importFrom", "file", this.importFilePath, this.selectedGroups, this.pathMapping).then(
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

    private async bodyContent() {
        let content = `<form name="VSCLBForm">
            <input type="hidden" name="step" id="step" value="${this.step + 1}">`;

        content += `
            <h2>Select source file</h2>
            <p class="file-selection">
                <input
                    type="button"
                    class="file-selector"
                    data-file-input-name="importFilePath"
                    data-access-type="read"
                    value="..."
                />
                <input
                    type="text"
                    name="importFilePath"
                    readonly
                    value="${this.importFilePath}"
                    placeholder="no file selected"
                />
            </p>
            `;

        if (this.step > 0) {
            let incomingGroupControls = this.webviewContentHelper.getGroupListFormControls(
                this.importStorage.getGroups(),
                "groups",
                true
            );

            content += `<h2>Select groups to be imported</h2>
            <p class="group-selection">
                ` + incomingGroupControls + `
            </p>

            <p>
            Current folders: `+ this.storageManger.getActiveStorage().getWorkspaceFolders().join(", ") + `
            </p>

            <p>
            Incoming folders: `+ this.importStorage.getWorkspaceFolders().join(", ") + `
            </p>

            <hr />
            `;
        }

        if (this.step > 1) {
            content += `<p>
                <input type="button" class="submit" value="Import" data-form="import" />
            </p>`;
        }

        // <input type="button" class="reset" value="Reset" data-form="import" />
        content += `</form>`;

        return content;
    }
}