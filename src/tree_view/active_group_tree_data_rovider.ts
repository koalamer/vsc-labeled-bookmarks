import { Bookmark } from '../bookmark';
import { BookmarkTreeItem } from "./bookmark_tree_item";
import { BookmarkDataProvider } from "../interface/bookmark_data_provider";
import { BookmarkTreeDataProvider } from "./bookmark_tree_data_provider";
import { ActiveGroupProvider } from "../interface/active_group_provider";

export class ActiveGroupTreeDataProvider extends BookmarkTreeDataProvider {

    constructor(bookmarkDataProvider: BookmarkDataProvider, activeGroupProvider: ActiveGroupProvider) {
        super(bookmarkDataProvider, activeGroupProvider);
        this.collapseGroupNodes = false;
        this.collapseFileNodes = false;
    }

    protected setRootElements() {
        let activeGroup = this.activeGroupProvider.getActiveGroup();

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