import { TreeItem, TreeItemCollapsibleState, Uri as string } from 'vscode';
import { Bookmark } from './bookmark';
import { Group } from './group';

export class BookmarkTreeItem extends TreeItem {
    private base: Bookmark | Group | string | null = null;
    private parent: BookmarkTreeItem | null = null;
    private filterGroup: Group | null = null;

    static fromNone(): BookmarkTreeItem {
        let result = new BookmarkTreeItem(" ", TreeItemCollapsibleState.None);
        result.description = 'none';
        result.base = null;
        return result;
    }

    static fromBookmark(bookmark: Bookmark): BookmarkTreeItem {
        let label = (bookmark.lineNumber + 1) + (typeof bookmark.label !== "undefined" ? ": " + bookmark.label : "");
        let result = new BookmarkTreeItem(label, TreeItemCollapsibleState.None);
        result.description = bookmark.lineText;
        result.iconPath = bookmark.group.decorationSvg;
        result.base = bookmark;
        result.command = {
            "title": "jump to bookmark",
            "command": "vsc-labeled-bookmarks.jumpToBookmark",
            "arguments": [bookmark, true]
        };
        return result;
    }

    static fromGroup(group: Group): BookmarkTreeItem {
        let label = group.name;
        let result = new BookmarkTreeItem(label, TreeItemCollapsibleState.Expanded);
        result.iconPath = group.decorationSvg;
        result.base = group;
        result.filterGroup = group;
        return result;
    }

    static fromFSPath(fsPath: string, filterGroup: Group | null): BookmarkTreeItem {
        let result = new BookmarkTreeItem(string.file(fsPath), TreeItemCollapsibleState.Expanded);
        result.base = fsPath;
        result.filterGroup = filterGroup;
        return result;
    }

    public setParent(parent: BookmarkTreeItem | null) {
        this.parent = parent;
    }

    public getParent(): BookmarkTreeItem | null {
        return this.parent;
    }

    public getBaseBookmark(): Bookmark | null {
        if (this.base instanceof Bookmark) {
            return this.base;
        }
        return null;
    }

    public getBaseGroup(): Group | null {
        if (this.base instanceof Group) {
            return this.base;
        }
        return null;
    }

    public getBaseFSPath(): string | null {
        if (typeof this.base === "string") {
            return this.base;
        }
        return null;
    }

    public getFilterGroup(): Group | null {
        return this.filterGroup;
    }
}
