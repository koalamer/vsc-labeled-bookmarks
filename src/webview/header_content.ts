import { WebViewContent as WebViewContent } from "./webview_content";

export class HeaderContent extends WebViewContent {

    private subTitle: string;

    public constructor(subTitle: string) {
        super();
        this.subTitle = subTitle;
    }

    public async getContent(): Promise<string> {
        let subTitle = "";
        let mainLink = "";

        if (this.subTitle !== "") {
            subTitle = ` - ${this.subTitle}`;
            mainLink = `<h3 class="back-to-main"><a data-page="main">back to main</a></h3>`;
        }

        return `${mainLink}
            <h1>Labeled Bookmarks${subTitle}</h1>`;
    }
}