import { WebViewContent as WebViewContent } from "./webview_content";

export class HeaderContent extends WebViewContent {

    private subTitle: string;
    private page: string;

    public constructor(subTitle: string, page: string) {
        super();
        this.subTitle = subTitle;
        this.page = page;
    }

    public async getContent(): Promise<string> {
        let subTitle = "";
        let mainLink = "";

        if (this.subTitle !== "") {
            subTitle = ` - ${this.subTitle}`;
            mainLink = `
                <h3 class="header-link"><a data-page="main" href="">back to main</a></h3>
                <h3 class="header-link"><a data-page="${this.page}" href="" data-date="${new Date().toLocaleString()}">reload</a></h3>
            `;
        }

        return `${mainLink}
            <h1>Labeled Bookmarks${subTitle}</h1>
            <hr />
            `;
    }
}