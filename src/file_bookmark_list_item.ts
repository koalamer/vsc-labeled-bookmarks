import { Bookmark } from "./bookmark";

export class FileBookmarkListItem {
    groupName: string;
    bookmarkLabel: string;
    bookmark: Bookmark;

    constructor(groupName: string, bookmarkLabel: string, bookmark: Bookmark) {
        this.groupName = groupName;
        this.bookmarkLabel = bookmarkLabel;
        this.bookmark = bookmark;
    }
}