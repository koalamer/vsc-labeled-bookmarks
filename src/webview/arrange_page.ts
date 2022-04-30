import { WebViewContent } from "./webview_content";
import { HeaderContent } from "./header_content";

export class ArrangePage extends WebViewContent {

    private header: HeaderContent;

    public constructor() {
        super();
        this.name = "arrange";
        this.header = new HeaderContent("Arrange");
    }

    public getContent(): string {
        return this.header.getContent();
    }
}