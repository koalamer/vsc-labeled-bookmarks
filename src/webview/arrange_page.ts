import { WebViewContent } from "./webview_content";
import { HeaderContent } from "./header_content";

export class ArrangePage extends WebViewContent {

    private header: HeaderContent;

    public constructor() {
        super();
        this.name = "arrange";
        this.header = new HeaderContent("Arrange", this.name);
    }

    public async getContent(): Promise<string> {
        return await this.header.getContent();
    }
}