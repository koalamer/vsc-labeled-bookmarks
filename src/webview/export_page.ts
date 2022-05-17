import { WebViewContent } from "./webview_content";
import { HeaderContent } from "./header_content";
import { StorageManager } from "../interface/storage_manager";
import { WebviewContentHelper } from "../interface/webview_content_helper";

export class ExportPage extends WebViewContent {

    private header: HeaderContent;
    private webviewContentHelper: WebviewContentHelper;

    private storageManger: StorageManager;
    private selectedGroups: string[] = [];
    private selectedBookmark: string[] = [];

    public constructor(storageManager: StorageManager, webviewContentHelper: WebviewContentHelper) {
        super();
        this.name = "exportTo";
        this.header = new HeaderContent("Export");
        this.webviewContentHelper = webviewContentHelper;

        this.storageManger = storageManager;
    }

    public processMessage(name: string, value: any): void {
    }

    public async getContent(): Promise<string> {
        return await this.header.getContent()
            + await this.bodyContent();
    }

    private async bodyContent() {
        let activeStorageGroupControls = await this.webviewContentHelper.getGroupListFormControls(
            this.storageManger.getActiveStorage().getGroups(),
            "active"
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
 
            <h2>Execute</h2>
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