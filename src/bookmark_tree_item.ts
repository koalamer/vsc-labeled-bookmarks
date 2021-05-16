import { TreeItem, TreeItemCollapsibleState, workspace } from 'vscode';
import { Bookmark } from './bookmark';
import { Group } from './group';

export class BookmarkTreeItem extends TreeItem {
    private base: Bookmark | Group | null = null;

    static fromBookmark(bookmark: Bookmark): BookmarkTreeItem {
        let label = (typeof bookmark.label !== "undefined" ? bookmark.label + " - " : "") + "line " + (bookmark.lineNumber + 1);
        let result = new BookmarkTreeItem(label, TreeItemCollapsibleState.None);
        result.iconPath = bookmark.group.decorationSvg;
        result.base = bookmark;
        result.command = {
            "title": "jump to bookmark",
            "command": "vsc-labeled-bookmarks.jumpToBookmark",
            "arguments": [bookmark, false]
        };
        return result;
    }

    static fromGroup(group: Group): BookmarkTreeItem {
        let label = group.name;
        let result = new BookmarkTreeItem(label, TreeItemCollapsibleState.Expanded);
        result.iconPath = group.decorationSvg;
        result.base = group;
        return result;
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
}
