import * as vscode from 'vscode';

import { BookmarkDataStorage } from "../interface/bookmark_data_storage";
import { Uri, workspace } from "vscode";
import { SerializableGroup } from "./serializable_group";
import { SerializableBookmark } from './serializable_bookmark';
import { TextDecoder } from "util";

export class BookmarkStorageInFile implements BookmarkDataStorage {
    private uri: Uri;

    private dataFormatVersion: number;
    private groups: Array<SerializableGroup>;
    private bookmarks: Array<SerializableBookmark>;
    private workspaceFolders: Array<string>;
    private timestamp: number;

    private readonly presentDataFormatVersion = 1;

    constructor(uri: Uri) {
        this.uri = uri;

        this.dataFormatVersion = this.presentDataFormatVersion;
        this.groups = new Array<SerializableGroup>();
        this.bookmarks = new Array<SerializableBookmark>();
        this.workspaceFolders = new Array<string>();
        this.timestamp = 0;
    }

    public async readStorage() {
        let fileContents: Uint8Array = await workspace.fs.readFile(this.uri);
        let json = new TextDecoder("utf-8").decode(fileContents);
        let savedData = JSON.parse(json);

        if (typeof savedData === "undefined") {
            Promise.reject(new Error("Could not read storage file " + this.uri.fsPath));
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

        if (this.dataFormatVersion !== this.presentDataFormatVersion) {
            Promise.reject(new Error("Unkown data format version in storage file"));
        }

        this.groups = savedData.groups ?? [];
        this.bookmarks = savedData.bookmarks ?? [];
        this.workspaceFolders = savedData.workspaceFolders ?? [];
        this.timestamp = savedData.timestamp ?? 0;
    }

    public getBookmarks(): Array<SerializableBookmark> {
        return this.bookmarks;
    }

    public getGroups(): Array<SerializableGroup> {
        return this.groups;
    }

    public getWorkspaceFolders(): Array<string> {
        return this.workspaceFolders;
    }

    public getTimestamp(): number {
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

    public getStorageType(): string {
        return "file";
    }

    public getStoragePath(): string {
        return this.uri.fsPath;
    }

    public setWorkspaceFolders(workspaceFolders: string[]): void {
        this.workspaceFolders = workspaceFolders;
    }

    public setTimestamp(timestamp: number): void {
        this.timestamp = timestamp;
    }

    public async persist(): Promise<void> {
        let json = JSON.stringify({
            "dataFormatVersion": this.dataFormatVersion,
            "timestamp": this.timestamp,
            "groups": this.groups,
            "bookmarks": this.bookmarks,
            "workspaceFolders": this.workspaceFolders,
        });

        let bytes = Uint8Array.from(json.split("").map(c => { return c.charCodeAt(0); }));
        await workspace.fs.writeFile(this.uri, bytes);
    }
}