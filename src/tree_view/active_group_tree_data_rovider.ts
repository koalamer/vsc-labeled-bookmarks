import { Bookmark } from '../bookmark';
import { BookmarkTreeItem } from "./bookmark_tree_item";
import { Group } from "../group";
import { BookmarkDataProvider } from "../interface/bookmark_data_provider";
import { BookmarkTreeDataProvider } from "./bookmark_tree_data_provider";

export class ActiveGroupTreeDataProvider extends BookmarkTreeDataProvider {

    constructor(bookmarkDataProvider: BookmarkDataProvider) {
        super(bookmarkDataProvider);
        this.collapseGroupNodes = false;
        this.collapseFileNodes = false;
    }

    protected setRootElements() {
        let activeGroup = this.bookmarkDataProvider.getActiveGroup();

        this.rootElements = this.bookmarkDataProvider.getGroups()
            .filter(g => { return g === activeGroup; })
            .map(group => BookmarkTreeItem.fromGroup(group, this.collapseGroupNodes));
    }

    public getAnyTarget(): BookmarkTreeItem | null {
        if (this.rootElements.length > 0) {
            return this.rootElements[0];
        }

        return null;
    }

    public async getTargetForBookmark(bookmark: Bookmark): Promise<BookmarkTreeItem> {
        await this.handlePendingRefresh();

        for (let [parent, children] of this.childElements) {
            let target = children.find(child => child.getBaseBookmark() === bookmark);
            if (typeof target !== "undefined") {
                return target;
            }
        }

        return BookmarkTreeItem.fromNone();
    }
}