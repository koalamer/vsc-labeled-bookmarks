import * as vscode from 'vscode';
import { Position, Range, TextEditorDecorationType, Uri } from 'vscode';
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
    unnamedCounter: number;
    decoration: TextEditorDecorationType;
    inactiveDecoration: TextEditorDecorationType;
    navigationCache: Array<Bookmark>;

    constructor(main: Main, name: string, color: string, shape: string, text: string, unnamedCounter: number) {
        this.main = main;
        this.name = name;
        this.color = DecorationFactory.normalizeColorFormat(color);
        this.shape = shape;
        this.iconText = text;
        this.inactiveColor = this.color.substring(0, 6) + Group.inactiveTransparency;
        this.isActive = false;
        this.bookmarks = new Map<string, Bookmark>();
        this.unnamedCounter = unnamedCounter ?? 0;
        this.decoration = DecorationFactory.placeholderDecoration;
        this.inactiveDecoration = DecorationFactory.placeholderDecoration;
        this.initDecorations();
        this.navigationCache = new Array<Bookmark>();
        this.generateNavigationCache();
    }

    public static fromSerializableGroup(main: Main, sg: SerializableGroup): Group {
        let result = new Group(main, sg.name, sg.color, sg.shape, sg.iconText, sg.unnamedCounter);
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
            this.oneDecorationIsReady();
        });
        DecorationFactory.create(this.shape, this.inactiveColor, this.iconText).then(newInactiveDecoration => {
            this.inactiveDecoration = newInactiveDecoration;
            this.oneDecorationIsReady();
        });
    }

    private oneDecorationIsReady() {
        if (this.areAllDecorationsReady()) {
            this.reportFilesAsChanged();
            this.main.groupDecorationReady();
        }
    }

    public areAllDecorationsReady(): boolean {
        return this.decoration !== DecorationFactory.placeholderDecoration
            && this.inactiveDecoration !== DecorationFactory.placeholderDecoration;
    }

    public generateNavigationCache() {
        this.navigationCache = Array.from(this.bookmarks.values());
        this.navigationCache.sort(Bookmark.sortByLocation);
    }

    public toggleBookmark(fsPath: string, lineNumber: number, characterNumber: number, lineText: string) {
        let existingLabel = this.getBookmarkByPosition(fsPath, lineNumber);
        if (typeof existingLabel !== "undefined") {
            this.bookmarks.delete(existingLabel);
            this.generateNavigationCache();
            this.main.addDecorationDirtyFile(fsPath);
            return;
        }

        this.unnamedCounter++;
        let newLabel = "unnamed " + (this.unnamedCounter) + " ";
        this.bookmarks.set(newLabel, new Bookmark(
            fsPath,
            lineNumber,
            characterNumber,
            undefined,
            lineText,
            lineText,
            false)
        );
        this.generateNavigationCache();
        this.reportFilesAsChanged();
    }

    public addLabeledBookmark(
        fsPath: string,
        lineNumber: number,
        characterNumber: number,
        lineText: string,
        label: string
    ) {
        let oldBookmarkFsPath = this.bookmarks.get(label)?.fsPath;
        this.bookmarks.set(label, new Bookmark(
            fsPath,
            lineNumber,
            characterNumber,
            label,
            lineText,
            lineText,
            false)
        );
        this.generateNavigationCache();
        this.main.addDecorationDirtyFile(fsPath);
        if (typeof oldBookmarkFsPath !== "undefined" && oldBookmarkFsPath !== fsPath) {
            this.main.addDecorationDirtyFile(oldBookmarkFsPath);
        }
    }

    public deleteLabeledBookmark(label: string) {
        let bookmark = this.bookmarks.get(label);
        this.bookmarks.delete(label);
        this.generateNavigationCache();
        if (typeof bookmark !== "undefined") {
            this.main.addDecorationDirtyFile(bookmark.fsPath);
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
            if (bookmark.fsPath === fsPath && bookmark.lineNumber === lineNumber) {
                return label;
            }
        }
        return undefined;
    }

    public setIsActive(isActive: boolean) {
        this.isActive = isActive;
        this.reportFilesAsChanged();
    }

    public setShape(shape: string, iconText: string) {
        if (this.shape === shape && this.iconText === iconText) {
            return;
        }

        this.main.decorationDropped(this.decoration);
        this.main.decorationDropped(this.inactiveDecoration);

        this.shape = shape;
        this.iconText = iconText;
        this.initDecorations();
    }

    public setColor(color: string) {
        if (this.color === color) {
            return;
        }

        this.main.decorationDropped(this.decoration);
        this.main.decorationDropped(this.inactiveDecoration);

        this.color = DecorationFactory.normalizeColorFormat(color);
        this.inactiveColor = this.color.substring(0, 6) + Group.inactiveTransparency;
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
            this.main.addDecorationDirtyFile(fsPath);
        }
    }

    public getBookmarkCount(): number {
        return this.bookmarks.size;
    }

    public nextBookmark(fsPath: string, line: number): Bookmark | undefined {
        let brokenBookmarkCount = 0;
        let firstCandidate = this.navigationCache.find((element, i) => {
            if (element.invalid) {
                brokenBookmarkCount++;
                return false;
            }

            let fileComparisonResult = element.fsPath.localeCompare(fsPath);

            if (fileComparisonResult < 0) {
                return false;
            }
            if (fileComparisonResult > 0) {
                return true;
            }

            return line < element.lineNumber;
        });

        if (typeof firstCandidate === "undefined" && this.navigationCache.length > 0) {
            if (this.navigationCache.length > brokenBookmarkCount) {
                for (let bookmark of this.navigationCache) {
                    if (!bookmark.invalid) {
                        return bookmark;
                    }
                }
            }
            vscode.window.showWarningMessage("All bookmarks are broken, time for some cleanup");
        }

        return firstCandidate;
    }

    public previousBookmark(fsPath: string, line: number): Bookmark | undefined {
        if (this.navigationCache.length === 0) {
            return;
        }

        let brokenBookmarkCount = 0;
        let firstCandidate: Bookmark | undefined;

        for (let i = this.navigationCache.length - 1; i >= 0; i--) {
            let element = this.navigationCache[i];

            if (element.invalid) {
                brokenBookmarkCount++;
                continue;
            }

            let fileComparisonResult = element.fsPath.localeCompare(fsPath);
            if (fileComparisonResult > 0) {
                continue;
            }

            if (fileComparisonResult < 0) {
                firstCandidate = element;
                break;
            }

            if (element.lineNumber < line) {
                firstCandidate = element;
                break;
            }
        }

        if (typeof firstCandidate === "undefined" && this.navigationCache.length > 0) {
            if (this.navigationCache.length > brokenBookmarkCount) {
                for (let i = this.navigationCache.length - 1; i >= 0; i--) {
                    if (!this.navigationCache[i].invalid) {
                        return this.navigationCache[i];
                    }
                }
            }
            vscode.window.showWarningMessage("All bookmarks are broken, time for some cleanup");
        }

        return firstCandidate;
    }

    private reportFilesAsChanged() {
        for (let [index, bookmark] of this.bookmarks) {
            this.main.addDecorationDirtyFile(bookmark.fsPath);
        }
    }

}