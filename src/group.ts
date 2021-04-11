import * as vscode from 'vscode';
import { TextEditorDecorationType, Uri } from 'vscode';
import { Bookmark } from "./bookmark";
import { DecorationFactory } from "./decoration_factory";
import { Main } from './main';
import { SerializableGroup } from "./serializable_group";

export class Group {
    static svgDir: Uri;

    static readonly inactiveTransparency: string = "33";

    main: Main;
    name: string;
    color: string;
    shape: string;
    iconText: string;
    inactiveColor: string;
    isActive: boolean;
    bookmarks: Map<string, Bookmark>;
    decoration: TextEditorDecorationType;
    inactiveDecoration: TextEditorDecorationType;
    navigationCache: Array<Bookmark>;

    constructor(main: Main, name: string, color: string, shape: string, text: string) {
        this.main = main;
        this.name = name;
        this.color = DecorationFactory.normalizeColorFormat(color);
        this.shape = shape;
        this.iconText = text;
        this.inactiveColor = this.color.substring(0, 6) + Group.inactiveTransparency;
        this.isActive = false;
        this.bookmarks = new Map<string, Bookmark>();
        this.decoration = DecorationFactory.placeholderDecoration;
        this.inactiveDecoration = DecorationFactory.placeholderDecoration;
        this.initDecorations();
        this.navigationCache = new Array<Bookmark>();
        this.generateNavigationCache();
    }

    public static fromSerializableGroup(main: Main, sg: SerializableGroup): Group {
        let result = new Group(main, sg.name, sg.color, sg.shape, sg.iconText);
        for (let i in sg.bookmarkKeys) {
            result.bookmarks.set(sg.bookmarkKeys[i], sg.bookmarkValues[i]);
        }
        result.generateNavigationCache();
        return result;
    }

    public getColor(): string {
        return this.color;
    }

    public initDecorations() {
        this.decoration = DecorationFactory.placeholderDecoration;
        this.inactiveDecoration = DecorationFactory.placeholderDecoration;

        DecorationFactory.create(this.shape, this.color, this.iconText).then(newDecoration => {
            this.decoration = newDecoration;
            this.main.groupChanged(this);
        });
        DecorationFactory.create(this.shape, this.inactiveColor, this.iconText).then(newInactiveDecoration => {
            this.inactiveDecoration = newInactiveDecoration;
            this.main.groupChanged(this);
        });
    }

    public isDecorationReady(): boolean {
        return this.decoration !== DecorationFactory.placeholderDecoration
            && this.inactiveDecoration !== DecorationFactory.placeholderDecoration;
    }

    public generateNavigationCache() {
        this.navigationCache = Array.from(this.bookmarks.values());
        this.navigationCache.sort(Bookmark.sortByLocation);
    }

    public toggleBookmark(fsPath: string, lineNumber: number) {
        let existingLabel = this.getBookmarkByPosition(fsPath, lineNumber);
        if (typeof existingLabel !== "undefined") {
            this.bookmarks.delete(existingLabel);
            this.generateNavigationCache();
            this.main.fileChanged(fsPath);
            return;
        }

        let newLabel = "line " + lineNumber + " of " + vscode.workspace.asRelativePath(fsPath);
        this.bookmarks.set(newLabel, new Bookmark(fsPath, newLabel, lineNumber));
        this.generateNavigationCache();
        this.main.groupChanged(this);
    }

    public addLabeledBookmark(label: string, fsPath: string, lineNumber: number) {
        let oldBookmarkFsPath = this.bookmarks.get(label)?.fsPath;
        this.bookmarks.set(label, new Bookmark(fsPath, label, lineNumber));
        this.generateNavigationCache();
        this.main.fileChanged(fsPath);
        if (typeof oldBookmarkFsPath !== "undefined" && oldBookmarkFsPath !== fsPath) {
            this.main.fileChanged(oldBookmarkFsPath);
        }
    }

    public deleteLabeledBookmark(label: string) {
        let bookmark = this.bookmarks.get(label);
        this.bookmarks.delete(label);
        this.generateNavigationCache();
        if (typeof bookmark !== "undefined") {
            this.main.fileChanged(bookmark.fsPath);
        }
    }

    public getBookmarksOfFsPath(fsPath: string): Array<Bookmark> {
        let result: Array<Bookmark> = [];
        for (let [_, bookmark] of this.bookmarks) {
            if (bookmark.fsPath === fsPath) {
                result.push(bookmark);
            }
        }
        return result;
    }

    public getBookmarkByPosition(fsPath: string, lineNumber: number): string | undefined {
        for (let [label, bookmark] of this.bookmarks) {
            if (bookmark.fsPath === fsPath && bookmark.line === lineNumber) {
                return label;
            }
        }
        return undefined;
    }

    public setIsActive(isActive: boolean) {
        this.isActive = isActive;
        this.main.groupChanged(this);
    }

    public setShape(shape: string, iconText: string) {
        if (this.shape === shape && this.iconText === iconText) {
            return;
        }

        this.shape = shape;
        this.iconText = iconText;
        this.main.decorationDropped(this.decoration);
        this.main.decorationDropped(this.inactiveDecoration);
        this.initDecorations();
    }

    public setColor(color: string) {
        if (this.color === color) {
            return;
        }

        this.color = DecorationFactory.normalizeColorFormat(color);
        this.inactiveColor = this.color.substring(0, 6) + Group.inactiveTransparency;
        this.main.decorationDropped(this.decoration);
        this.main.decorationDropped(this.inactiveDecoration);
        this.initDecorations();
    }

    public truncateBookmarks() {
        let affectedFiles = new Map<string, boolean>();
        for (let [label, bookmark] of this.bookmarks) {
            affectedFiles.set(bookmark.fsPath, true);
        }

        this.bookmarks.clear();
        this.generateNavigationCache();

        for (let [fsPath, flag] of affectedFiles) {
            this.main.fileChanged(fsPath);
        }
    }

    public getBookmarkCount(): number {
        return this.bookmarks.size;
    }

    public nextBookmark(fsPath: string, line: number): Bookmark | undefined {
        let firstCandidate = this.navigationCache.find((element, i) => {
            let fileComparisonResult = element.fsPath.localeCompare(fsPath);

            if (fileComparisonResult < 0) {
                return false;
            }
            if (fileComparisonResult > 0) {
                return true;
            }

            return line < element.line;
        });

        if (typeof firstCandidate === "undefined" && this.navigationCache.length > 0) {
            return this.navigationCache[0];
        }

        return firstCandidate;
    }

    public previousBookmark(fsPath: string, line: number): Bookmark | undefined {
        if (this.navigationCache.length === 0) {
            return;
        }

        let nextIndex = this.navigationCache.findIndex(element => {
            let fileComparisonResult = element.fsPath.localeCompare(fsPath);
            if (fileComparisonResult < 0) {
                return false;
            }
            if (fileComparisonResult > 0) {
                return true;
            }

            return line <= element.line;
        });

        if (nextIndex <= 0) {
            return this.navigationCache[this.navigationCache.length - 1];
        }

        return this.navigationCache[nextIndex - 1];
    }
}