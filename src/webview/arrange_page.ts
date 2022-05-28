import { WebViewContent } from "./webview_content";
import { HeaderContent } from "./header_content";
import { WebviewContentHelper } from "../interface/webview_content_helper";

export class ArrangePage extends WebViewContent {

    private header: HeaderContent;

    public constructor(webviewContentHelper: WebviewContentHelper) {
        super(webviewContentHelper);
        this.name = "arrange";
        this.header = new HeaderContent(webviewContentHelper, "Arrange", this.name);
    }

    public async getContent(): Promise<string> {
        return await this.header.getContent();
    }
}