import { Event, EventEmitter, TreeDataProvider, TreeItem } from "vscode";
import * as vscode from 'vscode';
import { Bookmark } from './bookmark';
import { BookmarkTreeItem } from "./bookmark_tree_item";
import { Group } from './group';

export class BookmarkTreeDataProvider implements TreeDataProvider<BookmarkTreeItem> {
    private groups: Array<Group>;
    private bookmarks: Array<Bookmark>;
    private byGroup: boolean;

    private changeEmitter = new EventEmitter<BookmarkTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData = this.changeEmitter.event;

    constructor(groups: Array<Group>, bookmarks: Array<Bookmark>, byGroup: boolean) {
        this.groups = groups;
        this.bookmarks = bookmarks;
        this.byGroup = byGroup;
    }

    public getTreeItem(element: BookmarkTreeItem): TreeItem {
        return element;
    }

    public getChildren(element?: BookmarkTreeItem | undefined): Thenable<BookmarkTreeItem[]> {
        if (!element) {
            if (this.byGroup) {
                return Promise.resolve(this.groups.map(group => BookmarkTreeItem.fromGroup(group)));
            } else {
                return Promise.resolve(
                    this.getFiles(this.bookmarks).map(fsPath => BookmarkTreeItem.fromFSPath(fsPath, null))
                );
            }
        }

        let filterGroup = element.getFilterGroup();

        let baseFSPath = element.getBaseFSPath();
        if (baseFSPath !== null) {
            let bms = this.bookmarks.filter(bookmark => { return (bookmark.fsPath === baseFSPath); });
            if (filterGroup !== null) {
                bms = bms.filter(bookmark => { return bookmark.group === filterGroup; });
            }
            return Promise.resolve(bms.map(bookmark => BookmarkTreeItem.fromBookmark(bookmark)));
        }

        let baseGroup = element.getBaseGroup();
        if (baseGroup !== null) {
            let files = this.getFiles(this.bookmarks.filter(bookmark => { return bookmark.group === filterGroup; }));
            return Promise.resolve(files.map(fsPath => BookmarkTreeItem.fromFSPath(fsPath, filterGroup)));
        }

        return Promise.resolve([]);
    }

    public refresh() {
        this.changeEmitter.fire();
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