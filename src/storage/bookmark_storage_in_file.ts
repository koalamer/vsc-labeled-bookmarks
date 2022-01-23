import { BookmarkDataStorage } from "../interface/bookmark_data_storage";
import { Uri } from "vscode";

export class BookmarkStorageInFile implements BookmarkDataStorage {
    private uri: Uri;

    constructor(uri: Uri) {
        this.uri = uri;
    }

    getBookmarks(): Array<Bookmark>;
    getGroups(): Array<Group>;
    getActiveGroup(): Group;
    getTimestamp(): number;

    setBookmarks(bookmarks: Array<Bookmark>): void;
    setGroups(groups: Array<Group>): void;
    setActiveGroup(group: Group): void;
    setTimestamp(timestamp: number): void;

    persist(): void;
}