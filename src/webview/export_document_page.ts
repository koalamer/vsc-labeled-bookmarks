import { WebViewContent } from "./webview_content";
import { HeaderContent } from "./header_content";
import { WebviewContentHelper } from "../interface/webview_content_helper";

export class ExportDocumentPage extends WebViewContent {

    private header: HeaderContent;

    public constructor(webviewContentHelper: WebviewContentHelper) {
        super(webviewContentHelper);
        this.name = "exportAsDocument";
        this.header = new HeaderContent(webviewContentHelper, "Export as Document", this.name);
    }

    public async getContent(): Promise<string> {
        return await this.header.getContent();
    }
}