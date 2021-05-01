import { DecorationFactory } from "./decoration_factory";
import { TextEditorDecorationType } from "vscode";
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
    decoration: TextEditorDecorationType | null;
    isActive: boolean;
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
        this.decoration = null;
        this.isActive = false;
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
        if (this.isActive) {
            return this.decoration || this.group.getActiveDecoration();
        }

        return this.group.getActiveDecoration();
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

        let previousDecoration = this.decoration;

        this.decoration = await DecorationFactory.create(
            this.group.shape,
            this.group.color,
            this.group.iconText,
            this.label
        );

        if(previousDecoration !== null){
            this.decorationRemovedHandler(previousDecoration);
        }
        this.bookmarkDecorationUpdatedHandler(this);
    }

    public setIsActive() {
        let isActive = this.group.isActive;
        if (this.isActive === isActive) {
            return;
        }

        if (this.decoration === null) {
            this.isActive = isActive;
            return;
        }

        let previousDecoration = this.getDecoration();
        this.isActive = isActive;

        if (previousDecoration !== null && previousDecoration !== this.getDecoration()) {
            this.decorationRemovedHandler(previousDecoration);
        }
        this.bookmarkDecorationUpdatedHandler(this);
    }
}