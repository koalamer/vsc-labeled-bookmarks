import * as vscode from 'vscode';
import * as path from 'path';
import { ExtensionContext, Uri } from 'vscode';
import { BookmarkDataProvider } from '../interface/bookmark_data_provider';
import { WebviewPanel } from "vscode";
import { WebviewState } from "./webview_state";

export class BookmarkWebview {
    private panel: WebviewPanel | undefined;
    private formState: WebviewState;

    private ctx: ExtensionContext;
    private bookmarkDataProvider: BookmarkDataProvider;
    private actionOptions: Map<string, string>;
    private storageTypeOptions: Map<string, string>;

    private logoImageUrl: string;
    private jsUrl: string;
    private cssUrl: string;

    public constructor(
        ctx: ExtensionContext,
        bookmarkDataProvider: BookmarkDataProvider,
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
        this.actionOptions = actionOptions;
        this.storageTypeOptions = storageTypeOptions;

        this.logoImageUrl = "";
        this.jsUrl = "";
        this.cssUrl = "";
    }

    public reveal() {
        if (typeof this.panel === "undefined") {
            this.panel = vscode.window.createWebviewPanel(
                'labeledBookmarks',
                'Labeled Bookmarks',
                vscode.ViewColumn.Active,
                {
                    enableScripts: true,
                    enableFindWidget: false,
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

        this.panel.webview.html = this.getWebviewContents();

        this.panel.webview.onDidReceiveMessage(
            this.receiveMessageFromWebview,
            undefined,
            this.ctx.subscriptions
        );

        this.panel.onDidDispose(() => {
            this.panel = undefined;
        });
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
        // todo handle incoming message
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
            <h1>Heading 1</h1>
            <h2>Heading 2</h2>
            <h3>Heading 3</h3>
            <p>Asdk kajdsf kjash fkjasdh fkajsdhf kjasdh fkjashfdk asdkfh kjf</p>
            <img src="${this.logoImageUrl}" id="labeled-bookmarks-logo"/>
        </body>
        </html>`;
    }
}