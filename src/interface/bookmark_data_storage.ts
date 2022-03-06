import { SerializableBookmark } from "../storage/serializable_bookmark";
import { SerializableGroup } from "../storage/serializable_group";

export interface BookmarkDataStorage {
    getBookmarks(): Array<SerializableBookmark>;
    getGroups(): Array<SerializableGroup>;
    getTimestamp(): number;

    setBookmarks(serializableBookmarks: Array<SerializableBookmark>): void;
    setGroups(serializableGroups: Array<SerializableGroup>): void;
    setTimestamp(timestamp: number): void;
    persist(): void;
}