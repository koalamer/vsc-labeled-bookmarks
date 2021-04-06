import * as vscode from 'vscode';
import { TextEditorDecorationType, Uri } from 'vscode';
import { Bookmark } from "./bookmark";
import { DecorationFactory } from "./decoration_factory";
import { activate } from './extension';
import { Main } from './main';

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

    constructor(main: Main, name: string, color: string, shape: string, text: string) {
        this.main = main;
        this.name = name;
        this.color = DecorationFactory.normalizeColorFormat(color);
        this.shape = shape;
        this.iconText = text;
        this.inactiveColor = this.color.substring(0, 6) + Group.inactiveTransparency;
        this.isActive = false;
        this.bookmarks = new Map<string, Bookmark>();
        this.decoration = DecorationFactory.fallbackDecoration;
        this.inactiveDecoration = DecorationFactory.fallbackDecoration;
        this.initDecorations();
    }

    public getColor(): string {
        return this.color;
    }

    public initDecorations() {
        this.decoration = DecorationFactory.fallbackDecoration;
        this.inactiveDecoration = DecorationFactory.fallbackDecoration;

        DecorationFactory.create(this.shape, this.color, this.iconText).then(newDecoration => {
            this.decoration = newDecoration;
            this.main.groupChanged(this);
        });
        DecorationFactory.create(this.shape, this.inactiveColor, this.iconText).then(newInactiveDecoration => {
            this.inactiveDecoration = newInactiveDecoration;
            this.main.groupChanged(this);
        });
    }

    public toggleBookmark(fsPath: string, lineNumber: number) {
        let existingLabel = this.getBookmarkByPosition(fsPath, lineNumber);
        if (typeof existingLabel !== "undefined") {
            this.bookmarks.delete(existingLabel);
            this.main.fileChanged(fsPath);
            return;
        }

        let newLabel = "line " + lineNumber + " of " + vscode.workspace.asRelativePath(fsPath);
        this.bookmarks.set(newLabel, new Bookmark(fsPath, newLabel, lineNumber));
        this.main.groupChanged(this);
    }

    public addLabeledBookmark(label: string, fsPath: string, lineNumber: number) {
        this.bookmarks.set(label, new Bookmark(fsPath, label, lineNumber));
        this.main.fileChanged(fsPath);
    }

    public deleteLabeledBookmark(label: string) {
        let bookmark = this.bookmarks.get(label);
        this.bookmarks.delete(label);
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

    public setShape(shape: string) {
        if (this.shape === shape) {
            return;
        }

        this.shape = shape;
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

        for (let [fsPath, flag] of affectedFiles) {
            this.main.fileChanged(fsPath);
        }
    }

    public getBookmarkCount(): number {
        return this.bookmarks.size;
    }
}