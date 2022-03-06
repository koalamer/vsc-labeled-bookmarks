import * as vscode from 'vscode';

import { BookmarkDataStorage } from "../interface/bookmark_data_storage";
import { Memento } from "vscode";
import { SerializableGroup } from "./serializable_group";
import { SerializableBookmark } from './serializable_bookmark';

export class BookmarkStorageInWorkspaceState implements BookmarkDataStorage {

    public readonly savedBookmarksKey = "vscLabeledBookmarks.bookmarks";
    public readonly savedGroupsKey = "vscLabeledBookmarks.groups";
    public readonly savedBookmarkTimestampKey = "vscodeLabeledBookmarks.bookmarkTimestamp";

    private keyPostfix = "";

    private groups: Array<SerializableGroup>;
    private bookmarks: Array<SerializableBookmark>;
    private timestamp: number;

    private workspaceState: Memento;

    constructor(workspaceState: Memento, keyPostfix: string) {
        this.groups = new Array<SerializableGroup>();
        this.bookmarks = new Array<SerializableBookmark>();
        this.timestamp = 0;

        this.workspaceState = workspaceState;
        if (keyPostfix !== "") {
            this.keyPostfix = "_";
        }
        this.keyPostfix += keyPostfix;

        this.readStorage();
    }

    private readStorage() {
        let bookmarkTimestamp: number | undefined = this.workspaceState.get(this.savedBookmarkTimestampKey + this.keyPostfix);
        if (typeof bookmarkTimestamp !== "undefined") {
            this.timestamp = bookmarkTimestamp;
        } else {
            this.timestamp = 0;
        }

        let serializedGroups: Array<SerializableGroup> | undefined = this.workspaceState.get(this.savedGroupsKey + this.keyPostfix);
        this.groups = new Array<SerializableGroup>();
        if (typeof serializedGroups !== "undefined") {
            this.groups = serializedGroups;
        } else {
            vscode.window.showErrorMessage("Restoring bookmark groups failed");
        }

        let serializedBookmarks: Array<SerializableBookmark> | undefined
            = this.workspaceState.get(this.savedBookmarksKey + this.keyPostfix);
        this.bookmarks = new Array<SerializableBookmark>();
        if (typeof serializedBookmarks !== "undefined") {
            this.bookmarks = serializedBookmarks;
        } else {
            vscode.window.showErrorMessage("Restoring bookmarks failed");
        }
    }

    public getBookmarks(): Array<SerializableBookmark> {
        return this.bookmarks;
    }

    public getGroups(): Array<SerializableGroup> {
        return this.groups;
    }

    public getTimestamp(): number {
        return this.timestamp;
    };

    public setBookmarks(serializableBookmarks: Array<SerializableBookmark>): void {
        this.bookmarks = serializableBookmarks;
    };

    public setGroups(serializableGroups: Array<SerializableGroup>): void {
        this.groups = serializableGroups;
    }

    public setTimestamp(timestamp: number): void {
        this.timestamp = timestamp;
    }

    public persist(): void {
        this.workspaceState.update(this.savedBookmarkTimestampKey + this.keyPostfix, this.timestamp);

        let serializedGroups = this.groups;
        this.workspaceState.update(this.savedGroupsKey + this.keyPostfix, serializedGroups);

        let serializedBookmarks = this.bookmarks;
        this.workspaceState.update(this.savedBookmarksKey + this.keyPostfix, serializedBookmarks);
    }
}
