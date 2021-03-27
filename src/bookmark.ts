export class Bookmark {
    line: number;
    label: string;

    constructor(label: string, line: number) {
        this.label = label;
        this.line = line;
    }
}