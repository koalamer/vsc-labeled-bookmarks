import * as vscode from 'vscode';
import { WebViewContent } from "./webview_content";
import { HeaderContent } from "./header_content";
import { StorageManager } from "../interface/storage_manager";
import { WebviewContentHelper } from "../interface/webview_content_helper";
import { StorageActionResult } from '../storage/storage_action_result';

export class ExportPage extends WebViewContent {

    private header: HeaderContent;
    private storageManger: StorageManager;

    public constructor(storageManager: StorageManager, webviewContentHelper: WebviewContentHelper) {
        super(webviewContentHelper);
        this.name = "exportTo";
        this.header = new HeaderContent(webviewContentHelper, "Export", this.name);
        this.storageManger = storageManager;
    }

    public processMessage(operation: string, name: string, formData: any): void {
        if (operation === "submit") {
            let params = JSON.parse(formData);

            let exportFile: string = params.exportFile ?? "";
            let selectedGroups: string[] = params.groups ?? [];

            if (exportFile === "") {
                this.storageActionResult = StorageActionResult.simpleError("No export file selected.");
                this.refreshAfterAction();
                return;
            }

            if (selectedGroups.length === 0) {
                this.storageActionResult = StorageActionResult.simpleError("No groups were selected.");
                this.refreshAfterAction();
                return;
            }

            this.storageManger.executeStorageAction("exportTo", "file", exportFile, selectedGroups, new Map()).then(
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
        let activeStorageGroupControls = this.webviewContentHelper.getGroupListFormControls(
            this.storageManger.getActiveStorage().getGroups(),
            "groups",
            true
        );

        return `<form name="VSCLBForm">
            <h2>Select bookmark groups</h2>
            <p class="group-selection">
                ` + activeStorageGroupControls + `
            </p>

            <h2>Select target file</h2>
            <p class="file-selection">
                <input
                    type="button"
                    class="file-selector"
                    data-file-input-name="exportFile"
                    data-access-type="write"
                    value="..."
                />
                <input
                    type="text"
                    name="exportFile"
                    readonly
                    placeholder="no file selected"
                />
            </p>
 
            <hr />
            <p>
                <input
                    type="button"
                    class="submit"
                    value="Export"
                />
            </p>
        </form>`;
    }
}