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

    public getTargetForGroup(group: Group): BookmarkTreeItem | null {
        if (!this.byGroup) {
            vscode.window.showErrorMessage("Bookmark byGroup tree view uninitialized");
            return null;
        }

        let parent = this.rootElements.find(element => { return group === element.getBaseGroup(); });
        if (typeof parent === "undefined") {
            vscode.window.showErrorMessage("Bookmark byGroup tree view group not found");
            return null;
        }

        let children = this.childElements.get(parent);
        if (typeof children === "undefined") {
            vscode.window.showErrorMessage("Bookmark byGroup tree view group has no children");
            return null;
        }

        if (children.length === 0) {
            vscode.window.showErrorMessage("Bookmark byGroup tree view group empty child collection");
            return null;
        }

        return children[0];
    }

    public getTargetForBookmark(bookmark: Bookmark): BookmarkTreeItem {
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
}