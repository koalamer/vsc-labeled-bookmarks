import * as vscode from 'vscode';

import { BookmarkDataStorage } from "../interface/bookmark_data_storage";
import { Uri, workspace } from "vscode";
import { SerializableGroup } from "./serializable_group";
import { SerializableBookmark } from './serializable_bookmark';
import { TextDecoder } from "util";
import { FileType, FileStat } from 'vscode';

export class BookmarkStorageInFile implements BookmarkDataStorage {
    private uri: Uri;

    private groups: Array<SerializableGroup>;
    private bookmarks: Array<SerializableBookmark>;
    private timestamp: number;
    private readyCallback: (bms: BookmarkDataStorage) => void;

    private isInitialized: boolean = false;

    constructor(uri: Uri, readyCallback: ((bms: BookmarkDataStorage) => void)) {
        this.uri = uri;

        this.groups = new Array<SerializableGroup>();
        this.bookmarks = new Array<SerializableBookmark>();
        this.timestamp = 0;

        this.readyCallback = readyCallback;
        this.ensureFile().then(this.readFile);
    }

    private async ensureFile(): Promise<void> {
        let stat: FileStat;

        vscode.workspace.fs.stat(this.uri).then(
            (fileStat) => {
                if (fileStat.type === FileType.Directory) {
                    vscode.window.showErrorMessage("Cannot use '" + this.uri.fsPath + "' directory as a file");
                    throw new Error();
                }
            },
            (reason) => {
                vscode.window.showErrorMessage("Failed to stat '" + this.uri.fsPath + "': " + reason);

            }
        );
    }

    private async readFile() {
        let fileContents: Uint8Array = await workspace.fs.readFile(this.uri);
        let json = new TextDecoder("utf-8").decode(fileContents);
        let savedData = JSON.parse(json);
        vscode.window.showErrorMessage(savedData);
        this.groups = savedData.groups ?? [];
        this.bookmarks = savedData.bookmarks ?? [];
        this.timestamp = savedData.timestamp ?? 0;
        this.isInitialized = true;
        this.readyCallback(this);
    }

    public getBookmarks(): Array<SerializableBookmark> {
        this.failIfUninitialized();
        return this.bookmarks;
    }

    public getGroups(): Array<SerializableGroup> {
        this.failIfUninitialized();
        return this.groups;
    }

    public getTimestamp(): number {
        this.failIfUninitialized();
        return this.timestamp;
    }

    public setBookmarks(serializableBookmarks: Array<SerializableBookmark>): void {
        this.bookmarks = serializableBookmarks;
    }

    public setGroups(serializableGroups: Array<SerializableGroup>): void {
        this.groups = serializableGroups;
    }

    public setTimestamp(timestamp: number): void {
        this.timestamp = timestamp;
    }

    public persist(): void {
        let json = JSON.stringify({
            "timestamp": this.timestamp,
            "groups": this.groups,
            "bookmarks": this.bookmarks,
        });

        let bytes = Uint8Array.from(json.split("").map(c => { return c.charCodeAt(0); }));
        workspace.fs.writeFile(this.uri, bytes);
    }

    private failIfUninitialized() {
        if (!this.isInitialized) {
            throw new Error("File storage is uninitialized");
        }
    }
}