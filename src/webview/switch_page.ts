import { WebViewContent } from "./webview_content";
import { HeaderContent } from "./header_content";

export class SwitchPage extends WebViewContent {

    private header: HeaderContent;

    public constructor() {
        super();
        this.name = "switchTo";
        this.header = new HeaderContent("Switch Database");
    }

    public getContent(): string {
        return this.header.getContent();
    }
}