export class Bookmark {
    fsPath: string;
    line: number;
    label: string;
    failedJump: boolean;

    constructor(fsPath: string, label: string, line: number, failedJump: boolean) {
        this.fsPath = fsPath;
        this.label = label;
        this.line = line;
        this.failedJump = failedJump;
    }

    public static sortByLocation(a: Bookmark, b: Bookmark): number {
        return a.fsPath.localeCompare(b.fsPath) || (a.line - b.line);
    }
}