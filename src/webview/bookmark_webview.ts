import * as vscode from 'vscode';
import * as path from 'path';
import { ExtensionContext, Uri } from 'vscode';
import { BookmarkDataProvider } from '../interface/bookmark_data_provider';
import { WebviewPanel } from "vscode";
import { StorageManager } from '../interface/storage_manager';
import { WebViewContent } from './webview_content';
import { MainPage } from './main_page';
import { ExportPage } from './export_page';
import { ImportPage } from './import_page';
import { MovePage } from './move_page';
import { SwitchPage } from './switch_page';
import { ArrangePage } from './arrange_page';
import { ExportDocumentPage } from './export_document_page';
import { WebviewContentHelper } from '../interface/webview_content_helper';
import { SerializableGroup } from '../storage/serializable_group';
import { DecorationFactory } from '../decoration_factory';

export class BookmarkWebview implements WebviewContentHelper {
    private panel: WebviewPanel | undefined;

    private ctx: ExtensionContext;
    private bookmarkDataProvider: BookmarkDataProvider;
    private storageManager: StorageManager;
    private actionOptions: Map<string, string>;
    private storageTypeOptions: Map<string, string>;
    private decorationFactory: DecorationFactory;

    private jsUrl: string;
    private cssUrl: string;

    private pages: Map<string, WebViewContent>;
    private activePage: WebViewContent;

    public constructor(
        ctx: ExtensionContext,
        bookmarkDataProvider: BookmarkDataProvider,
        storageManager: StorageManager,
        actionOptions: Map<string, string>,
        storageTypeOptions: Map<string, string>,
        decorationFactory: DecorationFactory
    ) {
        if (actionOptions.size === 0
            || storageTypeOptions.size === 0
        ) {
            throw new Error("Webview initialization failed");
        };

        this.ctx = ctx;
        this.bookmarkDataProvider = bookmarkDataProvider;
        this.storageManager = storageManager;
        this.actionOptions = actionOptions;
        this.storageTypeOptions = storageTypeOptions;
        this.decorationFactory = decorationFactory;

        this.jsUrl = "";
        this.cssUrl = "";

        this.pages = new Map();

        let mainPage = new MainPage(this);
        this.addPage(mainPage);
        this.activePage = mainPage;

        this.addPage(new ExportPage(storageManager, this));
        this.addPage(new ImportPage(storageManager, this));
        this.addPage(new MovePage(storageManager, this));
        this.addPage(new SwitchPage(storageManager, this));
        this.addPage(new ArrangePage(this));
        this.addPage(new ExportDocumentPage(this));
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
                    retainContextWhenHidden: true,
                }
            );
        }

        this.panel.reveal();

        if (typeof this.panel === "undefined") {
            throw new Error("Could not initialize webview.");
        }

        this.jsUrl = this.pathElementsToUrl(["resources", "webview.js"]);
        this.cssUrl = this.pathElementsToUrl(["resources", "webview.css"]);

        this.panel.iconPath = Uri.file(path.join(this.ctx.extensionPath, "resources", "vsc-labeled-bookmarks-logo.png"));

        this.panel.webview.onDidReceiveMessage(
            this.receiveMessageFromWebview.bind(this),
            undefined,
            this.ctx.subscriptions
        );

        this.panel.onDidDispose(() => {
            this.panel = undefined;
        });

        this.refreshView();
    }

    public pathToUrl(path: string): string {
        if (typeof this.panel === "undefined") {
            throw new Error("Webview is uninitialized.");
        }

        return this.panel.webview.asWebviewUri(Uri.file(path)).toString();
    }

    public pathElementsToUrl(pathElements: string[]): string {
        if (typeof this.panel === "undefined") {
            throw new Error("Webview is uninitialized.");
        }

        pathElements.unshift(this.ctx.extensionPath);
        return this.panel.webview.asWebviewUri(
            Uri.file(
                path.join(...pathElements)
            )).toString();
    }

    public uriToUrl(uri: Uri): string {
        if (typeof this.panel === "undefined") {
            throw new Error("Webview is uninitialized.");
        }

        return this.panel.webview.asWebviewUri(uri).toString();
    }

    public getGroupListFormControls(groups: SerializableGroup[], groupName: string, selectMultiple: false): string {
        let html = "";

        for (let g of groups) {
            let [svg, _fileNamePostfix] = this.decorationFactory.generateSvg(
                g.shape,
                g.color,
                g.iconText
            );

            let controlHtml = '';
            if (selectMultiple) {
                let controlId = `valueGroup.${groupName}.${g.name}`;
                controlHtml = `<input type="checkbox" name="${controlId}" id="${controlId}">`;
            } else {
                controlHtml = `<input type="radio" name="valueGroup.${groupName}" id="valueGroup.${groupName}.${g.name}">`;
            }
            html += `<div>
                    <label>
                        ${controlHtml}
                         
                        <svg viewBox="0 0 32 32" class="group-icon">${svg}</svg>
                        ${g.name}
                    </label>
                </div>`;
        };
        return html;
    }

    private sendMessageToWebView(message: any) {
        if (typeof this.panel === "undefined") {
            throw new Error("Webview is uninitialized.");
        }

        this.panel.webview.postMessage(message);
        vscode.window.showWarningMessage(JSON.stringify(message));
    }

    public setHtmlContent(selector: string, html: string) {
        this.sendMessageToWebView({
            operation: "setHtml",
            selector: selector,
            html: html,
        });
    }

    public setFormElement(elementName: string, value: string) {
        this.sendMessageToWebView({
            operation: "set",
            elementName: elementName,
            value: value,
        });
    }

    public submitForm() {
        this.sendMessageToWebView({
            operation: "submit",
        });
    }

    private receiveMessageFromWebview(message: any) {
        let operation: string = message.operation ?? "";
        let name: string = message.name ?? "";
        let value: any = message.value ?? "";

        if (operation === "show" && name === "page") {
            this.switchToPage(value);
            return;
        }

        if (operation === "selectFile") {
            let aWorkspaceFolder = vscode.workspace.workspaceFolders
                ? vscode.workspace.workspaceFolders[0]?.uri
                : undefined;

            if (value === "read") {
                vscode.window.showOpenDialog({
                    canSelectFiles: true,
                    canSelectFolders: false,
                    canSelectMany: false,
                    defaultUri: aWorkspaceFolder,
                    filters: { "json": ["json"] },
                    title: "Labeled Bookmarks: select file to read",
                }).then((result) => {
                    if (typeof result !== "undefined") {
                        this.setFormElement(name, result[0].fsPath);
                        this.receiveMessageFromWebview({
                            operation: 'fileSelected',
                            name: name,
                            value: value
                        });
                    }
                });
                return;
            }

            if (value === "write") {
                vscode.window.showSaveDialog({
                    defaultUri: aWorkspaceFolder,
                    filters: { "json": ["json"] },
                    saveLabel: undefined,
                    title: "Labeled Bookmarks: select file to write to",
                }).then((result) => {
                    if (typeof result !== "undefined") {
                        this.setFormElement(name, result.fsPath);
                        this.receiveMessageFromWebview({
                            operation: 'fileSelected',
                            name: name,
                            value: value
                        });
                    }
                });
                return;
            }
        }

        // todo handle unhadled incoming message
        vscode.window.showInformationMessage(JSON.stringify(message));

        this.activePage.processMessage(operation, name, value);
    }

    public refreshView() {
        if (typeof this.panel === "undefined") {
            throw new Error("Wwebview is uninitialized.");
        }

        this.getWebviewContents().then((contents) => {
            if (typeof this.panel === "undefined") {
                throw new Error("Wwebview is uninitialized.");
            }

            this.panel.webview.html = contents;
        });
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
        this.refreshView();
    }

    private async getWebviewContents() {
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
                    ${await this.activePage.getContent()}
                </body>
            </html>`;
    }
}