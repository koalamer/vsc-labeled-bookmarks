import { Bookmark } from '../bookmark';
import { Group } from '../group';
import { TextEditor } from 'vscode';

export interface BookmarManager {
    actionDeleteOneBookmark(bookmark: Bookmark): void;
    actionDeleteOneGroup(group: Group): void;
    deleteBookmarksOfFile(fsPath: string, group: Group | null): void;
    getNearestActiveBookmarkInFile(textEditor: TextEditor, group: Group | null): Bookmark | null;
    relabelBookmark(bookmark: Bookmark): void;
    renameGroup(group: Group): void;
    setActiveGroup(groupName: string): void;
}