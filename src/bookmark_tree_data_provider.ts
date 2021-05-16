import * as vscode from 'vscode';
import { TreeDataProvider, TreeItem } from "vscode";
import { Bookmark } from './bookmark';
import { BookmarkTreeItem } from "./bookmark_tree_item";
import { Group } from './group';

export class BookmarkTreeDataProvider implements TreeDataProvider<BookmarkTreeItem> {
    private groups: Array<Group>;
    private bookmarks: Array<Bookmark>;

    constructor(groups: Array<Group>, bookmarks: Array<Bookmark>) {
        this.groups = groups;
        this.bookmarks = bookmarks;
    }

    getTreeItem(element: BookmarkTreeItem): TreeItem {
        return element;
    }

    getChildren(element?: BookmarkTreeItem | undefined): Thenable<BookmarkTreeItem[]> {
        if (!element) {
            return Promise.resolve(this.groups.map(group => BookmarkTreeItem.fromGroup(group)));
        }

        let baseGroup = element.getBaseGroup();
        if (baseGroup !== null) {
            return Promise.resolve(
                this.bookmarks.filter(bookmark => bookmark.group === baseGroup)
                    .map(bookmark => BookmarkTreeItem.fromBookmark(bookmark))
            );
        }

        return Promise.resolve([]);
    }
}