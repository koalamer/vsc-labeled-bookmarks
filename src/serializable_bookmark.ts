import { Bookmark } from "./bookmark";

export class SerializableBookmark {
    fsPath: string;
    lineNumber: number;
    characterNumber: number;
    label?: string;
    currentLineText: string;
    isLineNumberChanged: boolean;
    groupName: string;

    constructor(
        fsPath: string,
        lineNumber: number,
        characterNumber: number,
        label: string | undefined,
        currentLineText: string,
        groupName: string
    ) {
        this.fsPath = fsPath;
        this.lineNumber = lineNumber;
        this.characterNumber = characterNumber;
        this.label = label;
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
            bookmark.currentLineText,
            bookmark.group.name
        );
    }
}