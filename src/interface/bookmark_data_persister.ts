import { Bookmark } from '../bookmark';
import { Group } from '../group';

export interface BookmarkDataPersister {
    setBookmarks(bookmarks: Array<Bookmark>): void;
    setGroups(groups: Array<Group>): void;
    setActiveGroup(group: Group): void;
    setTimestamp(timestamp: number): void;
    persist(): void;
}