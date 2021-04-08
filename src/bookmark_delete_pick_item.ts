import { QuickPickItem, workspace } from 'vscode';
import { Bookmark } from "./bookmark";

export class BookmarkDeletePickItem implements QuickPickItem {
    index: string;
    label: string;
    description?: string;
    detail?: string;
    picked: boolean;
    alwaysShow: boolean;

    constructor(index: string, label: string, description?: string, detail?: string) {
        this.index = index;
        this.label = label;
        this.description = description;
        this.detail = detail;
        this.picked = false;
        this.alwaysShow = false;
    }

    public static fromGroupEntry(index:string, bookmark: Bookmark): BookmarkDeletePickItem {
        let label = bookmark.label;
        let description = "";
        let detail = bookmark.fsPath + " line " + (bookmark.line + 1);
        return new BookmarkDeletePickItem(index, label, description, detail);
    }
}