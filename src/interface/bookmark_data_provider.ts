import { Bookmark } from '../bookmark';
import { Group } from '../group';

export interface BookmarkDataProvider {
    getBookmarks(): Array<Bookmark>;
    getGroups(): Array<Group>;
    getTimestamp(): number;
}