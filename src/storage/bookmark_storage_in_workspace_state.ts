import { BookmarkDataStorage } from "../interface/bookmark_data_storage";
import { Memento } from "vscode";

export class BookmarkStorageInWorkspaceState implements BookmarkDataStorage {
    private workspaceState: Memento;

    constructor(workspaceState: Memento) {
        this.workspaceState = workspaceState;
    }

    getBookmarks(): Array<Bookmark>;
    getGroups(): Array<Group>;
    getActiveGroup(): Group;

    setBookmarks(bookmarks: Array<Bookmark>): void;
    setGroups(groups: Array<Group>): void;
    setActiveGroup(group: Group): void;

    persist(): void;
}