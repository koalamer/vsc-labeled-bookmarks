import { QuickPickItem, workspace } from 'vscode';
import { Bookmark } from "./bookmark";

export class BookmarkPickItem implements QuickPickItem {
    bookmark: Bookmark;
    label: string;
    description?: string;
    detail?: string;
    picked: boolean;
    alwaysShow: boolean;

    constructor(
        bookmark: Bookmark,
        label: string,
        description?: string,
        detail?: string
    ) {
        this.bookmark = bookmark;
        this.label = label;
        this.description = description;
        this.detail = detail;
        this.picked = false;
        this.alwaysShow = false;
    }

    public static fromBookmark(bookmark: Bookmark, withGroupName: boolean): BookmarkPickItem {
        let label = (typeof bookmark.label !== "undefined" ? "$(tag) " + bookmark.label + ":\u2003" : "")
            + bookmark.lineText;
        let description = withGroupName ? bookmark.group.name : "";
        let detail = "line " + (bookmark.lineNumber + 1) + " "
            + workspace.asRelativePath(bookmark.fsPath);

        if (bookmark.failedJump) {
            label = "$(warning) " + label;
            detail = "$(warning) " + detail;
        }

        return new BookmarkPickItem(bookmark, label, description, detail);
    }
}