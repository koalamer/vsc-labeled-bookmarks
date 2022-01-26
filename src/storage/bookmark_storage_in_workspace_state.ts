import { BookmarkDataStorage } from "../interface/bookmark_data_storage";
import { Memento } from "vscode";
import { Bookmark } from "../bookmark";
import { Group } from "../group";

export class BookmarkStorageInWorkspaceState implements BookmarkDataStorage {

    private groups: Array<Group>;
    private bookmarks: Array<Bookmark>;
    private bookmarkTimestamp: number;

    private workspaceState: Memento;

    constructor(workspaceState: Memento) {
        this.groups = new Array<Group>();
        this.bookmarks = new Array<Bookmark>();
        this.bookmarkTimestamp = Date.now();

        this.workspaceState = workspaceState;
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