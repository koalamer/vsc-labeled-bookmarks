export class Bookmark {
    fsPath: string;
    line: number;
    label: string;

    constructor(fsPath: string, label: string, line: number) {
        this.fsPath = fsPath;
        this.label = label;
        this.line = line;
    }
}