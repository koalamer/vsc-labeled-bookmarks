import { Bookmark } from "./bookmark";

export class documentBookmarkList {
    public fsPath: string;
    public bookmarks: Array<Bookmark>;

    constructor(fsPath: string, bookmarks: Array<Bookmark>) {
        this.fsPath = fsPath;
        this.bookmarks = bookmarks;
    }
}