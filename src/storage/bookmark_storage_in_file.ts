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

    setBookmarks(bookmarks: Array<Bookmark>): void;
    setGroups(groups: Array<Group>): void;
    setActiveGroup(group: Group): void;

    persist(): void;
}