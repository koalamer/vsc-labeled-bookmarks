import * as vscode from 'vscode';
import { BookmarkDataStorage } from "../interface/bookmark_data_storage";
import { SerializableBookmark } from "./serializable_bookmark";
import { SerializableGroup } from "./serializable_group";

export class BookmarkStorageDummy implements BookmarkDataStorage {

    public getBookmarks(): Array<SerializableBookmark> {
        this.showError();
        return new Array<SerializableBookmark>();
    }

    public getGroups(): Array<SerializableGroup> {
        this.showError();
        let dummyGroup = new SerializableGroup("uninitialized", "#888888FF", "bookmark", "?");
        return [dummyGroup];
    }

    public getTimestamp(): number {
        this.showError();
        return 0;
    }

    public setBookmarks(serializableBookmarks: Array<SerializableBookmark>): void {
        this.showError();
    }

    public setGroups(serializableGroups: Array<SerializableGroup>): void {
        this.showError();
    }

    public setTimestamp(timestamp: number): void {
        this.showError();
    }

    public persist(): void {
        this.showError();
    };

    private showError() {
        vscode.window.showErrorMessage('Labeled bookmark storage is uninitialized. Bookmarks will not persisted.');
    }
}