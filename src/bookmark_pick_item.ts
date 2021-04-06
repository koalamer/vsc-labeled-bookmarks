import { QuickPickItem, workspace } from 'vscode';
import { Bookmark } from "./bookmark";

export class BookmarkPickItem implements QuickPickItem {
    bookmark: Bookmark;
    label: string;
    description?: string;
    detail?: string;
    picked: boolean;
    alwaysShow: boolean;

    constructor(group: Bookmark, label: string, description?: string, detail?: string, picked: boolean = false, alwaysShow: boolean = false) {
        this.bookmark = group;
        this.label = label;
        this.description = description;
        this.detail = detail;
        this.picked = picked;
        this.alwaysShow = alwaysShow;
    }

    public static fromBookmark(bookmark: Bookmark): BookmarkPickItem {
        let label = bookmark.label;
        let description = "";
        let detail = bookmark.fsPath + " line " + (bookmark.line + 1);
        return new BookmarkPickItem(bookmark, label, description, detail);
    }
}