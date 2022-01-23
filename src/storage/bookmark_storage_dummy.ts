import * as vscode from 'vscode';
import { BookmarkDataStorage } from "../interface/bookmark_data_storage";
import { Bookmark } from "../bookmark";
import { Group } from "../group";
import { DecorationFactory } from '../decoration_factory';

export class BookmarkStorageDummy implements BookmarkDataStorage {
    private decorationFactory: DecorationFactory;

    constructor(decorationFactory: DecorationFactory) {
        this.decorationFactory = decorationFactory;
    }

    public getBookmarks(): Array<Bookmark> {
        this.showError();
        return new Array<Bookmark>();
    }

    public getGroups(): Array<Group> {
        this.showError();
        return new Array<Group>();
    }

    public getActiveGroup(): Group {
        this.showError();
        return new Group("uninitialized", "", "", "", this.decorationFactory);
    }

    public setBookmarks(bookmarks: Array<Bookmark>): void {
        this.showError();
    }

    public setGroups(groups: Array<Group>): void {
        this.showError();
    }

    public setActiveGroup(group: Group): void {
        this.showError();
    }

    public persist(): void {
        this.showError();
    };

    private showError() {
        vscode.window.showErrorMessage('Labeled bookmark storage is uninitialized.');
    }
}