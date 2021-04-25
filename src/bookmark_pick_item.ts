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

    public static fromBookmark(bookmark: Bookmark): BookmarkPickItem {
        let label = bookmark.label ?? bookmark.currentLineText;
        let description = "in " + bookmark.group.name
            + (bookmark.label === null ? "" : " - " + bookmark.currentLineText);
        let detail = "line " + (bookmark.lineNumber + 1) + " "
            + workspace.asRelativePath(bookmark.fsPath);

        if (bookmark.failedJump) {
            label = "$(warning) " + label;
            detail = "$(warning) " + detail;
        }

        return new BookmarkPickItem(bookmark, label, description, detail);
    }

    // public static sort(a: BookmarkPickItem, b: BookmarkPickItem): number {
    //     return a.bookmark.fsPath.localeCompare(b.bookmark.fsPath)
    //         || (a.bookmark.lineNumber - b.bookmark.lineNumber)
    //         || (a.bookmark.characterNumber - b.bookmark.characterNumber);
    // }
}