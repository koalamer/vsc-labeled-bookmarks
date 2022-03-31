import { SerializableBookmark } from "../storage/serializable_bookmark";
import { SerializableGroup } from "../storage/serializable_group";

export interface BookmarkDataStorage {
    getBookmarks(): Array<SerializableBookmark>;
    getGroups(): Array<SerializableGroup>;
    getWorkspaceFolders(): Array<String>;
    getTimestamp(): number;
    getStatusBarText(): String;
    getStatusBarTooltipText(): String;

    setBookmarks(serializableBookmarks: Array<SerializableBookmark>): void;
    setGroups(serializableGroups: Array<SerializableGroup>): void;
    setWorkspaceFolders(workspaceFolders: Array<String>): void;
    setTimestamp(timestamp: number): void;
    persist(): void;
}