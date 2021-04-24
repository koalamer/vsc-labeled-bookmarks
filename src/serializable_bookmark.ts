import { Bookmark } from "./bookmark";

export class SerializableBookmark {
    fsPath: string;
    lineNumber: number;
    characterNumber: number;
    label?: string;
    originalLineText: string;
    currentLineText: string;
    isLineNumberChanged: boolean;
    groupName: string;

    constructor(
        fsPath: string,
        lineNumber: number,
        characterNumber: number,
        label: string | undefined,
        originalLineText: string,
        currentLineText: string,
        groupName: string
    ) {
        this.fsPath = fsPath;
        this.lineNumber = lineNumber;
        this.characterNumber = characterNumber;
        this.label = label;
        this.originalLineText = originalLineText;
        this.currentLineText = currentLineText;
        this.isLineNumberChanged = false;
        this.groupName = groupName;
    }

    public static fromBookmark(bookmark: Bookmark): SerializableBookmark {
        return new SerializableBookmark(
            bookmark.fsPath,
            bookmark.lineNumber,
            bookmark.characterNumber,
            bookmark.label,
            bookmark.originalLineText,
            bookmark.currentLineText,
            bookmark.group.name
        );
    }
}