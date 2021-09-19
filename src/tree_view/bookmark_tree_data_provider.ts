import { EventEmitter, TreeDataProvider, TreeItem } from "vscode";
import { Bookmark } from '../bookmark';
import { BookmarkTreeItem } from "./bookmark_tree_item";
import { Group } from "../group";
import { BookmarkDataProvider } from "../interface/bookmark_data_provider";
import { Logger } from "../logger/logger";

export class BookmarkTreeDataProvider implements TreeDataProvider<BookmarkTreeItem> {
    protected bookmarkDataProvider: BookmarkDataProvider;

    protected rootElements: Array<BookmarkTreeItem> = [];
    protected childElements: Map<BookmarkTreeItem, Array<BookmarkTreeItem>>;

    protected changeEmitter = new EventEmitter<BookmarkTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData = this.changeEmitter.event;

    // workaround for tree views not updating when hidden
    protected isRefreshPending = false;
    protected readonly refreshGracePeriod = 100;

    protected debugLogger = new Logger('lb_tree_data_provider', true);

    constructor(bookmarkDataProvider: BookmarkDataProvider) {
        this.bookmarkDataProvider = bookmarkDataProvider;
        this.childElements = new Map();
    }

    public getTreeItem(element: BookmarkTreeItem): TreeItem {
        return element;
    }

    public getChildren(element?: BookmarkTreeItem | undefined): Thenable<BookmarkTreeItem[]> {
        if (!element) {
            this.debugLogger.log('get root items');
            this.isRefreshPending = false;
            this.setRootElements();
            return Promise.resolve(this.rootElements);
        }

        this.debugLogger.log('get non root items');

        let filterGroup = element.getFilterGroup();

        let baseFSPath = element.getBaseFSPath();
        if (baseFSPath !== null) {
            let bookmarks = this.bookmarkDataProvider.getBookmarks().filter(bookmark => { return (bookmark.fsPath === baseFSPath); });
            if (filterGroup !== null) {
                bookmarks = bookmarks.filter(bookmark => { return bookmark.group === filterGroup; });
            }

            let children: Array<BookmarkTreeItem>;

            if (bookmarks.length === 0) {
                children = [BookmarkTreeItem.fromNone()];
            } else {
                children = bookmarks.map(bookmark => BookmarkTreeItem.fromBookmark(bookmark));
            }

            children.forEach(child => child.setParent(element));
            this.childElements.set(element, children);
            return Promise.resolve(children);
        }

        let baseGroup = element.getBaseGroup();
        if (baseGroup !== null) {
            let files = this.getFiles(this.bookmarkDataProvider.getBookmarks().filter(bookmark => { return bookmark.group === filterGroup; }));

            let children: Array<BookmarkTreeItem>;

            if (files.length === 0) {
                children = [BookmarkTreeItem.fromNone()];
            } else {
                children = files.map(fsPath => BookmarkTreeItem.fromFSPath(fsPath, filterGroup));
            }

            children.forEach(child => child.setParent(element));
            this.childElements.set(element, children);
            return Promise.resolve(children);
        }

        return Promise.resolve([]);
    }

    protected setRootElements() {
        this.rootElements = [];
    }

    public refresh() {
        this.isRefreshPending = true;
        this.changeEmitter.fire();
    }

    public async init() {
        let nodesToProcess = new Array<BookmarkTreeItem | undefined>();
        nodesToProcess.push(undefined);

        while (nodesToProcess.length > 0) {
            let node = nodesToProcess.pop();
            let moreNodes = await this.getChildren(node);
            moreNodes.forEach(newNode => {
                if (typeof newNode !== "undefined") {
                    nodesToProcess.push(newNode);
                }
            });
        }
    };

    public getParent(element: BookmarkTreeItem): BookmarkTreeItem | null | undefined {
        return element.getParent();
    }

    protected getFiles(bookmarks: Array<Bookmark>): Array<string> {
        let files = new Array<string>();
        for (let i = 0; i < bookmarks.length; i++) {

            if (i === 0 || bookmarks[i].fsPath !== bookmarks[i - 1].fsPath) {
                files.push(bookmarks[i].fsPath);
            }
        }
        return files;
    }

    protected async handlePendingRefresh() {
        if (this.isRefreshPending) {
            await this.init();
            await new Promise(resolve => setTimeout(resolve, this.refreshGracePeriod));
        }
    }
}