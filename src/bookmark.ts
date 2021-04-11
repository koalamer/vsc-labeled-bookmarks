export class Bookmark {
    fsPath: string;
    line: number;
    label: string;

    constructor(fsPath: string, label: string, line: number) {
        this.fsPath = fsPath;
        this.label = label;
        this.line = line;
    }

    public static sortByLocation(a: Bookmark, b: Bookmark): number {
        return a.fsPath.localeCompare(b.fsPath) || (a.line - b.line);
    }
}