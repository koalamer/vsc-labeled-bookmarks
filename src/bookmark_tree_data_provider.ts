import { EventEmitter, TreeDataProvider, TreeItem } from "vscode";
import * as vscode from 'vscode';
import { Bookmark } from './bookmark';
import { BookmarkTreeItem } from "./bookmark_tree_item";
import { Group } from './group';

export class BookmarkTreeDataProvider implements TreeDataProvider<BookmarkTreeItem> {
    private groups: Array<Group>;
    private bookmarks: Array<Bookmark>;
    private byGroup: boolean;

    private rootElements: Array<BookmarkTreeItem> = [];
    private childElements: Map<BookmarkTreeItem, Array<BookmarkTreeItem>>;

    private changeEmitter = new EventEmitter<BookmarkTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData = this.changeEmitter.event;

    // workaround for tree views not updating when hidden
    private isRefreshPending = false;
    private readonly refreshGracePeriod = 100;

    constructor(groups: Array<Group>, bookmarks: Array<Bookmark>, byGroup: boolean) {
        this.groups = groups;
        this.bookmarks = bookmarks;
        this.byGroup = byGroup;
        this.childElements = new Map();
    }

    public getTreeItem(element: BookmarkTreeItem): TreeItem {
        return element;
    }

    public getChildren(element?: BookmarkTreeItem | undefined): Thenable<BookmarkTreeItem[]> {
        if (!element) {
            this.isRefreshPending = false;
            if (this.byGroup) {
                this.rootElements = this.groups.map(group => BookmarkTreeItem.fromGroup(group));
                return Promise.resolve(this.rootElements);
            } else {
                this.rootElements = this.getFiles(this.bookmarks)
                    .map(fsPath => BookmarkTreeItem.fromFSPath(fsPath, null));
                return Promise.resolve(this.rootElements);
            }
        }

        let filterGroup = element.getFilterGroup();

        let baseFSPath = element.getBaseFSPath();
        if (baseFSPath !== null) {
            let bookmarks = this.bookmarks.filter(bookmark => { return (bookmark.fsPath === baseFSPath); });
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
            let files = this.getFiles(this.bookmarks.filter(bookmark => { return bookmark.group === filterGroup; }));

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

    public refresh() {
        this.isRefreshPending = true;
        this.changeEmitter.fire();
        this.rootElements.forEach(element => {
            this.changeEmitter.fire(element);
            if (this.byGroup) {
                this.childElements.get(element)?.forEach(child => {
                    this.changeEmitter.fire(child);
                });
            }
        });
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

    public async getTargetForGroup(group: Group): Promise<BookmarkTreeItem | null> {
        if (!this.byGroup) {
            return null;
        }

        await this.handlePendingRefresh();

        let parent = this.rootElements.find(element => { return group === element.getBaseGroup(); });
        if (typeof parent === "undefined") {
            return null;
        }

        let children = this.childElements.get(parent);
        if (typeof children === "undefined") {
            return null;
        }

        if (children.length === 0) {
            return null;
        }

        return children[0];
    }

    public async getTargetForBookmark(bookmark: Bookmark): Promise<BookmarkTreeItem> {
        await this.handlePendingRefresh();

        for (let [parent, children] of this.childElements) {
            let target = children.find(child => child.getBaseBookmark() === bookmark);
            if (typeof target !== "undefined") {
                return target;
            }
        }

        return BookmarkTreeItem.fromNone();
    }

    public getParent(element: BookmarkTreeItem): BookmarkTreeItem | null | undefined {
        return element.getParent();
    }

    private getFiles(bookmarks: Array<Bookmark>): Array<string> {
        let files = new Array<string>();
        for (let i = 0; i < bookmarks.length; i++) {

            if (i === 0 || bookmarks[i].fsPath !== bookmarks[i - 1].fsPath) {
                files.push(bookmarks[i].fsPath);
            }
        }
        return files;
    }

    private async handlePendingRefresh() {
        if (this.isRefreshPending) {
            await this.init();
            await new Promise(resolve => setTimeout(resolve, this.refreshGracePeriod));
        }
    }
}