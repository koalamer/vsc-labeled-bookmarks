import { WebViewContent } from "./webview_content";
import { HeaderContent } from "./header_content";

export class ExportDocumentPage extends WebViewContent {

    private header: HeaderContent;

    public constructor() {
        super();
        this.name = "exportAsDocument";
        this.header = new HeaderContent("Export as Document", this.name);
    }

    public async getContent(): Promise<string> {
        return await this.header.getContent();
    }
}