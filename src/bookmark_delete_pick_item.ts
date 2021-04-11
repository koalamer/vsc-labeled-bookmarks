import * as vscode from "vscode";
import { QuickPickItem } from 'vscode';
import { Bookmark } from "./bookmark";

export class BookmarkDeletePickItem implements QuickPickItem {
    bookmark: Bookmark;
    index: string;
    label: string;
    description?: string;
    detail?: string;
    picked: boolean;
    alwaysShow: boolean;

    constructor(bookmark: Bookmark, index: string, label: string, description?: string, detail?: string) {
        this.bookmark = bookmark;
        this.index = index;
        this.label = label;
        this.description = description;
        this.detail = detail;
        this.picked = false;
        this.alwaysShow = false;
    }

    public static fromGroupEntry(index: string, bookmark: Bookmark): BookmarkDeletePickItem {
        let label = bookmark.label;
        let description = "";
        let detail = bookmark.fsPath + " line " + (bookmark.line + 1);
        return new BookmarkDeletePickItem(bookmark, index, label, description, detail);
    }

    public static sort(a: BookmarkDeletePickItem, b: BookmarkDeletePickItem): number {
        return a.bookmark.fsPath.localeCompare(b.bookmark.fsPath)
            || (a.bookmark.line - b.bookmark.line);
    }
}