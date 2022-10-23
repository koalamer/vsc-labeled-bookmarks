import * as vscode from 'vscode';
import { WebViewContent } from "./webview_content";
import { HeaderContent } from "./header_content";
import { WebviewContentHelper } from "../interface/webview_content_helper";
import { StorageManager } from "../interface/storage_manager";
import { BookmarkDataStorage } from "../interface/bookmark_data_storage";
import { StorageActionResult } from "../storage/storage_action_result";
import { BookmarkStorageDummy } from "../storage/bookmark_storage_dummy";
import { BookmarkStorageInFile } from "../storage/bookmark_storage_in_file";

const resetSubmitter: string = "Reset";
const testSubmitter: string = "Test";

export class ImportPage extends WebViewContent {

    private header: HeaderContent;
    private storageManger: StorageManager;

    private step: number = 0;
    private importFilePath: string = "";
    private importStorage: BookmarkDataStorage = new BookmarkStorageDummy();
    private selectedGroups: string[] = [];
    private folderMapping: Map<string, string> = new Map();
    private fileMapping: Map<string, string> = new Map();
    private fileStats: Map<string, vscode.FileStat> = new Map();

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

    private async asyncProcessMessage(operation: string, paramName: string, formData: any) {


        if (operation === "fileSelected" && paramName === "importFilePath") {
            this.webviewContentHelper.setFormElement("step", "1");
            this.webviewContentHelper.submitForm();
        }

        if (operation === "submit") {
            if (paramName === resetSubmitter) {
                this.step = 0;
                this.storageActionResult = StorageActionResult.simpleSuccess();
                this.storageActionResult.infos.push("reset");
                this.importFilePath = "";
                this.importStorage = new BookmarkStorageDummy();
                this.selectedGroups = [];
                this.folderMapping = new Map();
                this.fileMapping = new Map();
                this.fileStats = new Map();


                this.refreshAfterAction();
                return;
            }

            let params = JSON.parse(formData);

            vscode.window.showInformationMessage(params);

            this.step = parseInt(params.step) ?? 0;

            if (paramName === testSubmitter) {
                this.step = 2;
            }

            this.importFilePath = params.importFilePath ?? "";
            this.storageActionResult = StorageActionResult.simpleSuccess();

            // step 0: wait for file to be selected
            if (this.step === 0) {
                return;
            };

            // step 1: wait for the import file to be selected
            if (this.importFilePath === "") {
                this.storageActionResult = StorageActionResult.simpleError("No import file selected.");
                this.step = 0;
                this.refreshAfterAction();
                return;
            }

            this.importStorage = new BookmarkStorageInFile(vscode.Uri.file(this.importFilePath));
            try {
                await this.importStorage.readStorage();
                await new Promise(resolve => setTimeout(resolve, 250)); // give time for icon creation
            } catch (e) {
                this.storageActionResult = StorageActionResult.simpleError("Reading the storage file failed.");
                this.step = 0;
                this.refreshAfterAction();
                return;
            }

            if (this.step === 1) {
                this.storageActionResult = new StorageActionResult(
                    true,
                    ["Select groups to be imported and how referenced files should be mapped"],
                    [],
                    []
                );

                this.refreshAfterAction();
                return;
            };

            // step 2: wait for folder mapping and import group selection and test it
            this.selectedGroups = params.groups ?? [];
            this.folderMapping = params.folderMapping ? new Map(Object.entries(params.folderMapping)) : new Map();

            if (this.selectedGroups.length === 0) {
                this.storageActionResult = StorageActionResult.simpleError("No groups were selected.");
                this.step = 1;
                this.refreshAfterAction();
                return;
            }

            if (this.folderMapping.size === 0) {
                this.storageActionResult = StorageActionResult.simpleError("No folder mapping specified.");
                this.step = 1;
                this.refreshAfterAction();
                return;
            }

            if (this.step === 2) {
                // update mapping results only for step 2
                this.fileStats.clear();
                this.fileMapping.clear();

                let incomingFiles: string[] = new Array();
                for (let f of this.importStorage.getBookmarks()) {
                    if (incomingFiles.includes(f.fsPath)) {
                        continue;
                    }
                    incomingFiles.push(f.fsPath);
                }
                incomingFiles.sort();

                for (let fileName of incomingFiles) {
                    fileName = fileName.replace(/\\/g, "/");

                    this.fileMapping.set(fileName, fileName);

                    this.folderMapping.forEach((mappedFolder, incomingFolder) => {
                        if (fileName.startsWith(incomingFolder)) {
                            this.fileMapping.set(fileName, mappedFolder + fileName.substring(incomingFolder.length));
                        }
                    });
                }

                for (let [_, mappedFile] of this.fileMapping.entries()) {
                    if (this.fileStats.has(mappedFile)) {
                        return;
                    }

                    try {
                        let stat = await vscode.workspace.fs.stat(vscode.Uri.file(mappedFile));
                        this.fileStats.set(mappedFile, stat);
                    } catch (e) {
                        ;
                    }

                };

                this.refreshAfterAction();
                return;
            };

            // step 3: do the import
            this.storageManger.executeStorageAction("importFrom", "file", this.importFilePath, this.selectedGroups, this.folderMapping).then(
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

        // file is selected
        if (this.step > 0) {
            let incomingGroupControls = this.webviewContentHelper.getGroupListFormControls(
                this.importStorage.getGroups(),
                "groups",
                true
            );

            let folderMappingControls = this.webviewContentHelper.getMappingFormControls(
                this.importStorage.getWorkspaceFolders()
                    .map((f) => { return f.replace(/\\/g, "/"); }),
                this.storageManger.getActiveStorage().getWorkspaceFolders()
                    .map((f) => { return f.replace(/\\/g, "/"); }),
                "folderMapping"
            );

            content += `
                <h2>Select groups to be imported</h2>

                <p class="group-selection">
                    ` + incomingGroupControls + `
                </p>

                <h2>Select folder mapping</h2>

                <p>
                    `+ folderMappingControls + `
                </p>

            `;
        }

        // mapping test results
        if (this.step === 2) {
            let fileStatHTML = "<ul>";

            this.fileMapping.forEach((newPath, origPath) => {
                let stats = this.fileStats.get(newPath);
                let statHTML = "";
                if (typeof stats === "undefined") {
                    statHTML = `<span class="error-message">failed to stat</span>`;
                } else if (stats.type & vscode.FileType.Unknown) {
                    statHTML = `<span class="error-message">unknown</span>`;
                } else if (stats.type & vscode.FileType.File) {
                    statHTML = `<span class="info-message">existing file</span>`;
                } else if (stats.type & vscode.FileType.Directory) {
                    statHTML = `<span class="error-message">directory</span>`;
                }

                fileStatHTML += `<li>
                    <div>from ${origPath}</div>
                    <div>to ${statHTML} ${newPath}</div>
                    </li>`;
            });
            fileStatHTML += "</ul>";


            content += `
                <h2>Resulting file path translation</h2>

                <p class="group-selection">
                    ${fileStatHTML}
                </p>

            `;
        }

        content += `<hr />
            <p>`;

        if (this.step > 0) {
            content += `<input type="button" class="submit" value="${resetSubmitter}" />`;
        }

        if (this.step >= 1) {
            content += `<input type="button" class="submit" value="${testSubmitter}" />`;
        }

        if (this.step === 2) {
            content += `<input type="button" class="submit" value="Import" />`;
        }

        content += `</p>`;

        content += `</form>`;
        return content;
    }
}