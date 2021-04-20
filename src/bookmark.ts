export class Bookmark {
    fsPath: string;
    lineNumber: number;
    characterNumber: number;
    label?: string;
    originalLineText: string;
    currentLineText: string;
    invalid: boolean;
    dirty: boolean;

    constructor(
        fsPath: string,
        lineNumber: number,
        characterNumber: number,
        label: string | undefined,
        originalLineText: string,
        currentLineText: string,
        failedJump: boolean
    ) {
        this.fsPath = fsPath;
        this.lineNumber = lineNumber;
        this.characterNumber = characterNumber;
        this.label = label;
        this.originalLineText = originalLineText;
        this.currentLineText = currentLineText;
        this.invalid = failedJump;
        this.dirty = false;
    }

    public static sortByLocation(a: Bookmark, b: Bookmark): number {
        return a.fsPath.localeCompare(b.fsPath)
            || (a.lineNumber - b.lineNumber)
            || (a.characterNumber - b.characterNumber);
    }

    public setNotDirty() {
        this.dirty = false;
    }

    public setLineNumber(lineNumber: number) {
        if (lineNumber === this.lineNumber) {
            return;
        }

        this.lineNumber = lineNumber;
        this.dirty = true;
    }
}