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

    public getWorkspaceFolders(): Array<string> {
        this.showError();
        return new Array<string>();
    }

    public getTimestamp(): number {
        this.showError();
        return 0;
    }

    public getStatusBarText(): string {
        return " (not persisted)";
    }

    public getStatusBarTooltipText(): string {
        return "\nBookmarks are not persisted and will be lost";
    }

    public getStorageType(): string {
        return "dummy";
    }

    public getStoragePath(): string {
        return "";
    }

    public setBookmarks(serializableBookmarks: Array<SerializableBookmark>): void {
        this.showError();
    }

    public setGroups(serializableGroups: Array<SerializableGroup>): void {
        this.showError();
    }

    public setWorkspaceFolders(workspaceFolders: Array<string>): void {
        this.showError();
    }

    public setTimestamp(timestamp: number): void {
        this.showError();
    }

    public async readStorage(): Promise<void> { }

    public async persist(): Promise<void> {
        this.showError();
    };

    private showError() {
        vscode.window.showErrorMessage('Labeled bookmark storage is uninitialized. Bookmarks will not persisted. Use `ctrl+alt+b ctrl+s` to switch to an actual storage location.');
    }
}