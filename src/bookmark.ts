import { Uri } from 'vscode';

export class Bookmark {
    uri: Uri;
    line: number;
    label: string;

    constructor(uri: Uri, label: string, line: number) {
        this.uri = uri;
        this.label = label;
        this.line = line;
    }
}