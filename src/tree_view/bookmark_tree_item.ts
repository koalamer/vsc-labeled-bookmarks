import { ThemeIcon, TreeItem, TreeItemCollapsibleState, workspace } from 'vscode';
import { Bookmark } from '../bookmark';
import { Group } from '../group';

export class BookmarkTreeItem extends TreeItem {
    private base: Bookmark | Group | string | null = null;
    private parent: BookmarkTreeItem | null = null;
    private filterGroup: Group | null = null;

    static fromNone(): BookmarkTreeItem {
        let result = new BookmarkTreeItem(" ", TreeItemCollapsibleState.None);
        result.contextValue = "none";
        result.description = "none";
        result.tooltip = "none";
        result.base = null;
        return result;
    }

    static fromBookmark(bookmark: Bookmark, collapse: boolean): BookmarkTreeItem {
        let label = (bookmark.lineNumber + 1) + (typeof bookmark.label !== "undefined" ? ": " + bookmark.label : "");
        let result = new BookmarkTreeItem(label, TreeItemCollapsibleState.None);
        result.contextValue = "bookmark";
        result.description = bookmark.lineText;
        result.iconPath = bookmark.group.decorationSvg;
        result.base = bookmark;
        result.tooltip = workspace.asRelativePath(bookmark.fsPath) + ": " + label;
        result.command = {
            "title": "jump to bookmark",
            "command": "vsc-labeled-bookmarks.jumpToBookmark",
            "arguments": [bookmark, true]
        };
        return result;
    }

    static fromGroup(group: Group, collapse: boolean): BookmarkTreeItem {
        let label = group.name;
        let result = new BookmarkTreeItem(label);
        result.contextValue = "group";
        result.iconPath = group.decorationSvg;
        result.base = group;
        result.filterGroup = group;
        result.tooltip = "Group '" + group.name + "'";
        result.collapsibleState = collapse ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.Expanded;
        return result;
    }

    static fromFSPath(fsPath: string, filterGroup: Group | null, collapse: boolean): BookmarkTreeItem {
        let dirName: string = "";
        let fileName: string = "";
        let relativePath = workspace.asRelativePath(fsPath);
        let lastSepPos = relativePath.lastIndexOf("/");
        if (lastSepPos > 0) {
            dirName = relativePath.substring(0, lastSepPos);
            fileName = relativePath.substring(lastSepPos + 1);
        } else if (lastSepPos < 0) {
            fileName = relativePath;
        } else {
            fileName = fileName.substring(1);
        }
        let result = new BookmarkTreeItem(fileName);
        result.description = dirName;
        result.contextValue = "file";
        result.iconPath = ThemeIcon.File;
        result.base = fsPath;
        result.filterGroup = filterGroup;
        result.tooltip = relativePath;
        result.collapsibleState = collapse ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.Expanded;
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
