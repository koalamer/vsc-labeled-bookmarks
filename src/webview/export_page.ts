import { WebViewContent } from "./webview_content";
import { HeaderContent } from "./header_content";

export class ExportPage extends WebViewContent {

    private header: HeaderContent;

    public constructor() {
        super();
        this.name = "exportTo";
        this.header = new HeaderContent("Export");
    }

    public getContent(): string {
        return this.header.getContent();
    }
}