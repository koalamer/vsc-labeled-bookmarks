import * as vscode from 'vscode';
import { TextEditorDecorationType, Uri } from 'vscode';
import { Bookmark } from "./bookmark";
import { DecorationFactory } from "./decoration_factory";
import { Renderer } from './renderer';

export class Group {
    static svgDir: Uri;

    static readonly inactiveTransparency: string = "44";

    public static readonly fallbackDecoration = vscode.window.createTextEditorDecorationType(
        {
            gutterIconPath: __dirname + "../resources/gutter_icon_bm.svg",
            gutterIconSize: 'contain',
        }
    );

    renderer: Renderer;
    name: string;
    color: string;
    shape: string;
    iconText: string;
    inactiveColor: string;
    isActive: boolean;
    bookmarks: Map<string, Bookmark>;
    decoration: TextEditorDecorationType;
    inactiveDecoration: TextEditorDecorationType;

    constructor(renderer: Renderer, name: string, color: string, shape: string, text: string) {
        this.renderer = renderer;
        this.name = name;
        this.color = DecorationFactory.normalizeColorFormat(color);
        this.shape = shape;
        this.iconText = text;
        this.inactiveColor = this.color.substring(0, 6) + Group.inactiveTransparency;
        this.isActive = false;
        this.bookmarks = new Map<string, Bookmark>();
        this.decoration = Group.fallbackDecoration;
        this.inactiveDecoration = Group.fallbackDecoration;
        this.initDecorations();
    }

    public getColor(): string {
        return this.color;
    }

    public initDecorations() {
        DecorationFactory.create(this.shape, this.color, this.iconText).then(newDecoration => {
            this.decoration = newDecoration;
        });
        DecorationFactory.create(this.shape, this.inactiveColor, this.iconText).then(newInactiveDecoration => {
            this.inactiveDecoration = newInactiveDecoration;
        });
    }

    public toggleBookmark(fsPath: string, lineNumber: number) {
        let existingLabel = this.getBookmarkByPosition(fsPath, lineNumber);
        if (typeof existingLabel !== "undefined") {
            this.bookmarks.delete(existingLabel);
            return;
        }

        let newLabel = "line " + lineNumber + " of " + fsPath;
        this.bookmarks.set(newLabel, new Bookmark(fsPath, newLabel, lineNumber));
    }

    public addLabeledBookmark(label: string, fsPath: string, lineNumber: number) {
        this.bookmarks.set(label, new Bookmark(fsPath, label, lineNumber));
    }

    public deleteLabeledBookmark(label: string) {
        this.bookmarks.delete(label);
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
    }
}