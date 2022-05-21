import { WebViewContent } from "./webview_content";
import { HeaderContent } from "./header_content";

export class ImportPage extends WebViewContent {

    private header: HeaderContent;

    public constructor() {
        super();
        this.name = "importFrom";
        this.header = new HeaderContent("Import", this.name);
    }

    public async getContent(): Promise<string> {
        return await this.header.getContent();
    }
}