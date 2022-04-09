import * as vscode from 'vscode';

import { BookmarkDataStorage } from "../interface/bookmark_data_storage";
import { Uri, workspace } from "vscode";
import { SerializableGroup } from "./serializable_group";
import { SerializableBookmark } from './serializable_bookmark';
import { TextDecoder } from "util";
import { FileType, FileStat } from 'vscode';

export class BookmarkStorageInFile implements BookmarkDataStorage {
    private uri: Uri;

    private dataFormatVersion: number;
    private groups: Array<SerializableGroup>;
    private bookmarks: Array<SerializableBookmark>;
    private workspaceFolders: Array<string>;
    private timestamp: number;

    private isInitialized: boolean = false;

    constructor(uri: Uri) {
        this.uri = uri;

        this.dataFormatVersion = 1;
        this.groups = new Array<SerializableGroup>();
        this.bookmarks = new Array<SerializableBookmark>();
        this.workspaceFolders = new Array<string>();
        this.timestamp = 0;

        this.isInitialized = false;
    }

    public async init() {
        let stat: FileStat;
        try {
            stat = await workspace.fs.stat(this.uri);
        } catch (e) {
            this.persist();
            stat = await workspace.fs.stat(this.uri);
        }

        if (stat.type & (FileType.File | FileType.SymbolicLink)) {
            await this.readFile();
            Promise.resolve();
        } else if (stat.type | FileType.Directory) {
            Promise.reject(new Error("Directory specified as storage path '" + this.uri.toString() + "'"));
        } else {
            this.persist();
        }
    }

    private async readFile() {
        let fileContents: Uint8Array = await workspace.fs.readFile(this.uri);
        let json = new TextDecoder("utf-8").decode(fileContents);
        let savedData = JSON.parse(json);

        if (typeof savedData === "undefined") {
            Promise.reject(new Error("Could not read storage file"));
        }

        if (
            !savedData.hasOwnProperty('dataFormatVersion')
            || !savedData.hasOwnProperty('groups')
            || !savedData.hasOwnProperty('bookmarks')
            || !savedData.hasOwnProperty('workspaceFolders')
            || !savedData.hasOwnProperty('timestamp')
        ) {
            Promise.reject(new Error("Expected fields missing from storage file"));
        }

        this.dataFormatVersion = savedData.dataFormatVersion ?? 0;

        if (this.dataFormatVersion !== 1) {
            Promise.reject(new Error("Unkown data format version in storage file"));
        }

        this.groups = savedData.groups ?? [];
        this.bookmarks = savedData.bookmarks ?? [];
        this.workspaceFolders = savedData.workspaceFolders ?? [];
        this.timestamp = savedData.timestamp ?? 0;

        this.isInitialized = true;
    }

    public getBookmarks(): Array<SerializableBookmark> {
        this.failIfUninitialized();
        return this.bookmarks;
    }

    public getGroups(): Array<SerializableGroup> {
        this.failIfUninitialized();
        return this.groups;
    }

    public getWorkspaceFolders(): Array<string> {
        this.failIfUninitialized();
        return this.workspaceFolders;
    }

    public getTimestamp(): number {
        this.failIfUninitialized();
        return this.timestamp;
    }

    public getStatusBarText(): string {
        return " (in file)";
    }

    public getStatusBarTooltipText(): string {
        return "Bookmark storage file: " + this.uri.fsPath;
    }

    public setBookmarks(serializableBookmarks: Array<SerializableBookmark>): void {
        this.bookmarks = serializableBookmarks;
    }

    public setGroups(serializableGroups: Array<SerializableGroup>): void {
        this.groups = serializableGroups;
    }

    public setWorkspaceFolders(workspaceFolders: string[]): void {
        this.workspaceFolders = workspaceFolders;
    }

    public setTimestamp(timestamp: number): void {
        this.timestamp = timestamp;
    }

    public persist(): void {
        let json = JSON.stringify({
            "dataFormatVersion": this.dataFormatVersion,
            "timestamp": this.timestamp,
            "groups": this.groups,
            "bookmarks": this.bookmarks,
            "workspaceFolders": this.workspaceFolders,
        });

        let bytes = Uint8Array.from(json.split("").map(c => { return c.charCodeAt(0); }));
        workspace.fs.writeFile(this.uri, bytes).then(
            () => {
                // vscode.window.showInformationMessage("File written " + this.uri.toString());
            },
            (reason) => {
                vscode.window.showErrorMessage("Failed persisting into storage file: " + reason);
            }
        );
    }

    private failIfUninitialized() {
        if (!this.isInitialized) {
            throw new Error("File storage for '" + this.uri.toString() + "' is uninitialized");
        }
    }
}