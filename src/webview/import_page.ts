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
        this.asyncProcessMessageMessage(operation, name, formData);
    }

    private async asyncProcessMessageMessage(operation: string, name: string, formData: any) {
        if (operation === "submit" && name === "importFile") {
            let params = JSON.parse(formData);

            this.importFilePath = params.importFilePath ?? "";
            this.selectedGroups = params.groups ?? [];
            this.conflictResolutionMode = params.conflictResolution ?? "";

            let incomingPaths: string[] = params.incomingPaths ?? [];
            let assignedPaths: string[] = params.assignedPaths ?? [];

            this.pathMapping = new Map();
            incomingPaths.forEach((v, key) => {
                if (assignedPaths.length <= key) {
                    return;
                }
                let assignedPath = assignedPaths[key];
                this.pathMapping.set(v, assignedPath);
            });

            if (this.importFilePath === "") {
                this.storageActionResult = StorageActionResult.simpleError("No export file selected.");
                this.refreshAfterAction();
                return;
            }

            this.importStorage = new BookmarkStorageInFile(vscode.Uri.file(this.importFilePath));
            try {
                await this.importStorage.readStorage();
            } catch (e) {
                this.storageActionResult = StorageActionResult.simpleError("Reading the storage file failed.");
                this.refreshAfterAction();
                return;
            }

            if (this.selectedGroups.length === 0) {
                this.storageActionResult = StorageActionResult.simpleError("No groups were selected.");
                this.refreshAfterAction();
                return;
            }

            if (!ImportPage.conflictResolutionModes.has(this.conflictResolutionMode)) {
                this.storageActionResult = StorageActionResult.simpleError("Invalid conflisct resolution mode.");
                this.refreshAfterAction();
                return;
            }

            // todo path mapping errors can be warnings runtime
            this.storageManger.executeStorageAction("exportTo", "file", this.importFilePath, this.selectedGroups, this.pathMapping).then(
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

        let importFilePath = "";

        let activeStorageGroupControls = "";
        // let activeStorageGroupControls = this.webviewContentHelper.getGroupListFormControls(
        //     this.storageManger.getActiveStorage().getGroups(),
        //     "groups"
        // );

        return `<form name="export">
            <h2>Select source file</h2>
            <p class="file-selection">
                <input
                    type="button"
                    class="file-selector"
                    data-file-input-name="importFile"
                    data-access-type="read"
                    value="..."
                />
                <input
                    type="text"
                    name="importFile"
                    readonly
                    placeholder="no file selected"
                />
            </p>

            <h2>Select bookmark groups</h2>
            <p class="group-selection">
                ` + activeStorageGroupControls + `
            </p>

            <hr />
            <p>
                <input
                    type="button"
                    class="submit"
                    value="Export"
                    data-form="export"
                />
            </p>
        </form>`;
    }
}