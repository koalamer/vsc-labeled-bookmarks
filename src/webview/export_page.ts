import * as vscode from 'vscode';
import { WebViewContent } from "./webview_content";
import { HeaderContent } from "./header_content";
import { StorageManager } from "../interface/storage_manager";
import { WebviewContentHelper } from "../interface/webview_content_helper";

export class ExportPage extends WebViewContent {

    private header: HeaderContent;
    private webviewContentHelper: WebviewContentHelper;
    private storageManger: StorageManager;

    public constructor(storageManager: StorageManager, webviewContentHelper: WebviewContentHelper) {
        super();
        this.name = "exportTo";
        this.header = new HeaderContent("Export", this.name);
        this.webviewContentHelper = webviewContentHelper;

        this.storageManger = storageManager;
    }

    public processMessage(operation: string, name: string, formData: any): void {
        if (operation === "submit" && name === "export") {
            let params = JSON.parse(formData);

            let exportFile: string = params.exportFile ?? "";
            let selectedGroups: string[] = params.groups ?? [];

            if (exportFile === "") {
                vscode.window.showErrorMessage("No export file selected.");
                return;
            }

            if (selectedGroups.length === 0) {
                vscode.window.showErrorMessage("No groups were selected.");
                return;
            }

            this.storageManger.executeStorageAction("exportTo", "file", exportFile, selectedGroups);
        }
    }

    public async getContent(): Promise<string> {
        return await this.header.getContent()
            + await this.bodyContent();
    }

    private async bodyContent() {
        let activeStorageGroupControls = this.webviewContentHelper.getGroupListFormControls(
            this.storageManger.getActiveStorage().getGroups(),
            "groups"
        );

        return `<form name="export">
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
                    data-form="export"
                />
            </p>
        </form>`;
    }
}