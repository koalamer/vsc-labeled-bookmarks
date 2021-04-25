import { Bookmark } from "./bookmark";

export class BookmarkList {
    public owner: string;
    public bookmarks: Array<Bookmark>;

    constructor(owner: string, bookmarks: Array<Bookmark>) {
        this.owner = owner;
        this.bookmarks = bookmarks;
    }
}