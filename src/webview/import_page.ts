import { WebViewContent } from "./webview_content";
import { HeaderContent } from "./header_content";

export class ImportPage extends WebViewContent {

    private header: HeaderContent;

    public constructor() {
        super();
        this.name = "importFrom";
        this.header = new HeaderContent("Import");
    }

    public getContent(): string {
        return this.header.getContent();
    }
}