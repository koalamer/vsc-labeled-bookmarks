import { TextEditorDecorationType } from "vscode";
import { SerializableBookmark } from "./serializable_bookmark";
import { Group } from "./group";

export class Bookmark {
    fsPath: string;
    lineNumber: number;
    characterNumber: number;
    label?: string;
    originalLineText: string;
    currentLineText: string;
    failedJump: boolean;
    isLineNumberChanged: boolean;
    group: Group;

    constructor(
        fsPath: string,
        lineNumber: number,
        characterNumber: number,
        label: string | undefined,
        originalLineText: string,
        currentLineText: string,
        group: Group
    ) {
        this.fsPath = fsPath;
        this.lineNumber = lineNumber;
        this.characterNumber = characterNumber;
        this.label = label;
        this.originalLineText = originalLineText;
        this.currentLineText = currentLineText;
        this.failedJump = false;
        this.isLineNumberChanged = false;
        this.group = group;
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
            serialized.originalLineText,
            serialized.currentLineText,
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
        return this.group.getActiveDecoration();
    }
}