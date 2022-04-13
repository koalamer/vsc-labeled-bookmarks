import { SerializableBookmark } from "../storage/serializable_bookmark";
import { SerializableGroup } from "../storage/serializable_group";

export interface BookmarkDataStorage {
    getBookmarks(): Array<SerializableBookmark>;
    getGroups(): Array<SerializableGroup>;
    getWorkspaceFolders(): Array<string>;
    getTimestamp(): number;
    getStatusBarText(): string;
    getStatusBarTooltipText(): string;

    getStorageType(): string;
    getStoragePath(): string;

    setBookmarks(serializableBookmarks: Array<SerializableBookmark>): void;
    setGroups(serializableGroups: Array<SerializableGroup>): void;
    setWorkspaceFolders(workspaceFolders: Array<string>): void;
    setTimestamp(timestamp: number): void;
    readStorage(): Promise<void>;
    persist(): Promise<void>;
}