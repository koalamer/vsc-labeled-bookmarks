import { WebViewContent } from "./webview_content";
import { HeaderContent } from "./header_content";

export class ExportAsDocumentPage extends WebViewContent {

    private header: HeaderContent;

    public constructor() {
        super();
        this.name = "exportAsDocument";
        this.header = new HeaderContent("Export as Document");
    }

    public getContent(): string {
        return this.header.getContent();
    }
}