import * as vscode from 'vscode';
import * as path from 'path';
import { ExtensionContext, Uri } from 'vscode';
import { BookmarkDataProvider } from '../interface/bookmark_data_provider';
import { WebviewPanel } from "vscode";
import { WebviewState } from "./webview_state";
import { StorageManager } from '../interface/storage_manager';
import { WebViewContent } from './webview_content';
import { MainPage } from './main_page';
import { ExportPage } from './export_page';
import { MessageChannel } from 'worker_threads';
import { type } from 'os';
import { ImportPage } from './import_page';
import { MovePage } from './move_page';
import { SwitchPage } from './switch_page';
import { ArrangePage } from './arrange_page';
import { ExportAsDocumentPage } from './export_as_document';

export class BookmarkWebview {
    private panel: WebviewPanel | undefined;
    private formState: WebviewState;

    private ctx: ExtensionContext;
    private bookmarkDataProvider: BookmarkDataProvider;
    private storageManager: StorageManager;
    private actionOptions: Map<string, string>;
    private storageTypeOptions: Map<string, string>;

    private logoImageUrl: string;
    private jsUrl: string;
    private cssUrl: string;

    private pages: Map<string, WebViewContent>;
    private activePage: WebViewContent;

    public constructor(
        ctx: ExtensionContext,
        bookmarkDataProvider: BookmarkDataProvider,
        storageManager: StorageManager,
        actionOptions: Map<string, string>,
        storageTypeOptions: Map<string, string>
    ) {
        if (actionOptions.size === 0
            || storageTypeOptions.size === 0
        ) {
            throw new Error("Webview initialization failed");
        };

        this.formState = new WebviewState();

        this.ctx = ctx;
        this.bookmarkDataProvider = bookmarkDataProvider;
        this.storageManager = storageManager;
        this.actionOptions = actionOptions;
        this.storageTypeOptions = storageTypeOptions;

        this.logoImageUrl = "";
        this.jsUrl = "";
        this.cssUrl = "";

        this.pages = new Map();

        let mainPage = new MainPage();
        this.addPage(mainPage);
        this.activePage = mainPage;

        this.addPage(new ExportPage());
        this.addPage(new ImportPage());
        this.addPage(new MovePage());
        this.addPage(new SwitchPage());
        this.addPage(new ArrangePage());
        this.addPage(new ExportAsDocumentPage());
    }

    private addPage(page: WebViewContent) {
        this.pages.set(page.getName(), page);
    }

    public reveal() {
        if (typeof this.panel === "undefined") {
            this.panel = vscode.window.createWebviewPanel(
                'labeledBookmarks',
                'Labeled Bookmarks',
                vscode.ViewColumn.Active,
                {
                    enableScripts: true,
                    enableFindWidget: true,
                    localResourceRoots: [vscode.Uri.file(this.ctx.extensionPath)],
                }
            );
        }

        this.panel.reveal();

        if (typeof this.panel === "undefined") {
            throw new Error("Could not initialize webview.");
        }

        this.logoImageUrl = this.toWebviewUrl(["resources", "vsc-labeled-bookmarks-logo.png"]);
        this.jsUrl = this.toWebviewUrl(["resources", "webview.js"]);
        this.cssUrl = this.toWebviewUrl(["resources", "webview.css"]);

        this.panel.iconPath = Uri.file(path.join(this.ctx.extensionPath, "resources", "vsc-labeled-bookmarks-logo.png"));

        this.panel.webview.onDidReceiveMessage(
            this.receiveMessageFromWebview.bind(this),
            undefined,
            this.ctx.subscriptions
        );

        this.panel.onDidDispose(() => {
            this.panel = undefined;
        });

        this.refresh();
    }

    private toWebviewUrl(pathElements: string[]): string {
        if (typeof this.panel === "undefined") {
            throw new Error("Webview is uninitialized.");
        }

        pathElements.unshift(this.ctx.extensionPath);
        return this.panel.webview.asWebviewUri(
            Uri.file(
                path.join(...pathElements)
            )).toString();
    }

    private sendMessageToWebView(message: any) {
        if (typeof this.panel === "undefined") {
            throw new Error("Webview is uninitialized.");
        }

        this.panel.webview.postMessage(message);
    }

    private receiveMessageFromWebview(message: any) {
        let name: string = message.name ?? "";
        let value: any = message.value ?? "";

        if (name === "page") {
            this.switchToPage(value);
            return;
        }
        // todo handle incoming message
        vscode.window.showInformationMessage(JSON.stringify(message));
    }

    private refresh() {
        if (typeof this.panel === "undefined") {
            throw new Error("Wwebview is uninitialized.");
        }

        this.panel.webview.html = this.getWebviewContents();
    }

    private switchToPage(pageName: string) {
        if (!this.pages.has(pageName)) {
            pageName = "main";
        }

        let page = this.pages.get(pageName);
        if (typeof page === "undefined") {
            return;
        }

        this.activePage = page;
        this.refresh();
    }

    private getWebviewContents() {
        if (typeof this.panel === "undefined") {
            throw new Error("Webview is uninitialized.");
        }

        return `<!DOCTYPE html>
            <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta
                        http-equiv="Content-Security-Policy"
                        content="default-src 'none';
                            img-src ${this.panel.webview.cspSource} https:;
                            script-src ${this.panel.webview.cspSource};
                            style-src ${this.panel.webview.cspSource};
                            "/>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Cat Coding</title>
                    <link rel="stylesheet" href="${this.cssUrl}" />
                    <script src="${this.jsUrl}" defer></script> 
                </head>
                <body>
                    ${this.activePage.getContent()}
                </body>
            </html>`;
    }
}