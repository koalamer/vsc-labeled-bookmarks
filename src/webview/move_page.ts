import { WebViewContent } from "./webview_content";
import { HeaderContent } from "./header_content";

export class MovePage extends WebViewContent {

    private header: HeaderContent;

    public constructor() {
        super();
        this.name = "moveTo";
        this.header = new HeaderContent("Move Database");
    }

    public async getContent(): Promise<string> {
        return await this.header.getContent();
    }
}