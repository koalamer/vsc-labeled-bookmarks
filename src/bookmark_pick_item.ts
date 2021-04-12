import { QuickPickItem, workspace } from 'vscode';
import { Bookmark } from "./bookmark";

export class BookmarkPickItem implements QuickPickItem {
    bookmark: Bookmark;
    label: string;
    description?: string;
    detail?: string;
    picked: boolean;
    alwaysShow: boolean;

    constructor(bookmark: Bookmark, label: string, description?: string, detail?: string, picked: boolean = false, alwaysShow: boolean = false) {
        this.bookmark = bookmark;
        this.label = label;
        this.description = description;
        this.detail = detail;
        this.picked = picked;
        this.alwaysShow = alwaysShow;
    }

    public static fromBookmark(bookmark: Bookmark, groupName?: string): BookmarkPickItem {
        let label = bookmark.label;
        let description = "";
        if (typeof groupName !== "undefined") {
            description = "@" + groupName;
        }
        let detail = workspace.asRelativePath(bookmark.fsPath) + " line " + (bookmark.line + 1);
        if (bookmark.failedJump) {
            label = "$(warning) " + label;
            detail = "$(warning) " + detail;
        }
        return new BookmarkPickItem(bookmark, label, description, detail);
    }

    public static sort(a: BookmarkPickItem, b: BookmarkPickItem): number {
        return a.bookmark.fsPath.localeCompare(b.bookmark.fsPath)
            || (a.bookmark.line - b.bookmark.line)
            || (a.bookmark.label.localeCompare(b.bookmark.label));
    }
}