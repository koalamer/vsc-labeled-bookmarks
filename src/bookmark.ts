import { DecorationFactory } from "./decoration_factory";
import { TextEditorDecorationType, Uri } from "vscode";
import { SerializableBookmark } from "./serializable_bookmark";
import { Group } from "./group";

export class Bookmark {
    fsPath: string;
    lineNumber: number;
    characterNumber: number;
    label?: string;
    lineText: string;
    failedJump: boolean;
    isLineNumberChanged: boolean;
    group: Group;
    ownDecoration: TextEditorDecorationType | null;
    currentDecoration: TextEditorDecorationType | null;
    bookmarkDecorationUpdatedHandler: (bookmark: Bookmark) => void;
    decorationRemovedHandler: (decoration: TextEditorDecorationType) => void;

    constructor(
        fsPath: string,
        lineNumber: number,
        characterNumber: number,
        label: string | undefined,
        lineText: string,
        group: Group
    ) {
        this.fsPath = fsPath;
        this.lineNumber = lineNumber;
        this.characterNumber = characterNumber;
        this.label = label;
        this.lineText = lineText;
        this.failedJump = false;
        this.isLineNumberChanged = false;
        this.group = group;
        this.ownDecoration = null;
        this.currentDecoration = null;
        this.bookmarkDecorationUpdatedHandler = (bookmark: Bookmark) => { return; };
        this.decorationRemovedHandler = (decoration: TextEditorDecorationType) => { return; };
    }

    public static fromSerializableBookMark(
        serialized: SerializableBookmark,
        groupGetter: (groupName: string) => Group
    ): Bookmark {
        return new Bookmark(
            serialized.fsPath,
            serialized.lineNumber,
            serialized.characterNumber,
            serialized.label,
            serialized.lineText,
            groupGetter(serialized.groupName)
        );
    }

    public static sortByLocation(a: Bookmark, b: Bookmark): number {
        return a.fsPath.localeCompare(b.fsPath)
            || (a.lineNumber - b.lineNumber)
            || (a.characterNumber - b.characterNumber);
    }

    public resetIsLineNumberChangedFlag() {
        this.isLineNumberChanged = false;
    }

    public setLineAndCharacterNumbers(lineNumber: number, characterNumber: number) {
        this.characterNumber = characterNumber;

        if (lineNumber === this.lineNumber) {
            return;
        }

        this.lineNumber = lineNumber;
        this.isLineNumberChanged = true;
    }

    public getDecoration(): TextEditorDecorationType | null {
        if (this.group.isActive && this.group.isVisible) {
            return this.ownDecoration || this.group.getActiveDecoration();
        } else {
            return this.group.getActiveDecoration();
        }
    }

    public onBookmarkDecorationUpdated(fn: (bookmark: Bookmark) => void) {
        this.bookmarkDecorationUpdatedHandler = fn;
    }

    public onDecorationRemoved(fn: (decoration: TextEditorDecorationType) => void) {
        this.decorationRemovedHandler = fn;
    }

    public async initDecoration() {
        if (typeof this.label === "undefined") {
            return;
        }

        let previousDecoration = this.ownDecoration;
        let tempSvg: Uri;

        [this.ownDecoration, tempSvg] = await DecorationFactory.create(
            this.group.shape,
            this.group.color,
            this.group.iconText,
            this.label
        );

        if (previousDecoration !== null) {
            this.decorationRemovedHandler(previousDecoration);
        }

        this.decorationRemovedHandler(this.group.decoration);
        this.decorationRemovedHandler(this.group.inactiveDecoration);

        this.currentDecoration = this.getDecoration();
        this.bookmarkDecorationUpdatedHandler(this);
    }

    public switchDecoration() {
        let newDecoration = this.getDecoration();
        if (this.currentDecoration !== null && this.currentDecoration !== newDecoration) {
            this.decorationRemovedHandler(this.currentDecoration);
        }
        this.currentDecoration = newDecoration;
        this.bookmarkDecorationUpdatedHandler(this);
    }
}