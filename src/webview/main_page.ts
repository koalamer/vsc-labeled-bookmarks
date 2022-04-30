import { HeaderContent } from "./header_content";
import { WebViewContent } from "./webview_content";

export class MainPage extends WebViewContent {

    private header: HeaderContent;

    public constructor() {
        super();
        this.name = "main";
        this.header = new HeaderContent("");
    }

    public getContent(): string {
        return this.header.getContent() + `
            <div class="card-grid-container">
                <div data-page="exportTo">
                    <h3>Export to JSON</h3>
                    <p>Exports to JSON file. Skips bookmarks that are outside the
                        opened workspace folders. Replaces workspace folder paths
                        with placeholders.</p>
                </div>
                <div data-page="importFrom">
                    <h3>Import from JSON</h3>
                    <p>Imports from JSON file. Skips bookmarks that are outside
                        the opened workspace folders. Requires matching the imported
                        workspace folders to the ones in this workspace.</p>
                </div>
                <div data-page="moveTo">
                    <h3>Move Database</h3>
                    <p>Moves bookmark database from the current location to a new
                        one. Wipes the previously used location afterwards.</p>
                </div>
                <div data-page="switchTo">
                    <h3>Switch Database</h3>
                    <p>Use another database (file or the workspace state). Leaves
                        the previously used database location unchanged, so you
                        can return using it later.</p>
                </div>
                <div data-page="arrange">
                    <h3>Arrange Bookmarks</h3>
                    <p>Move bookmarks between groups.</p>
                </div>
                <div data-page="exportAsDocument">
                    <h3>Export as Document</h3>
                    <p>Export bookmark data as HTML or MD.</p>
                </div>
            </div>
        `;
    }
}