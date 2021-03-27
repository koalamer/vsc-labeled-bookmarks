import { Uri } from 'vscode';
import { Bookmark } from "./bookmark";

export class File {
    uri: Uri;
    bookmarks: Array<Bookmark>;

    constructor(uri: Uri) {
        this.uri = uri;
        this.bookmarks = [];
    }
}