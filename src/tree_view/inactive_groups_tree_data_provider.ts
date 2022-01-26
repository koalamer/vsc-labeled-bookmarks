import { Bookmark } from '../bookmark';
import { BookmarkTreeItem } from "./bookmark_tree_item";
import { Group } from "../group";
import { BookmarkDataProvider } from "../interface/bookmark_data_provider";
import { BookmarkTreeDataProvider } from "./bookmark_tree_data_provider";
import { ActiveGroupProvider } from '../interface/active_group_provider';

export class InactiveGroupsTreeDataProvider extends BookmarkTreeDataProvider {

    constructor(bookmarkDataProvider: BookmarkDataProvider, activeGroupProvider: ActiveGroupProvider) {
        super(bookmarkDataProvider, activeGroupProvider);
        this.collapseGroupNodes = true;
        this.collapseFileNodes = false;
    }

    protected setRootElements() {
        let activeGroup = this.activeGroupProvider.getActiveGroup();

        this.rootElements = this.bookmarkDataProvider.getGroups()
            .filter(g => { return g !== activeGroup; })
            .map(group => BookmarkTreeItem.fromGroup(group, this.collapseGroupNodes));
    }

    public async getTargetForGroup(group: Group): Promise<BookmarkTreeItem | null> {
        await this.handlePendingRefresh();

        let parent = this.rootElements.find(element => { return group === element.getBaseGroup(); });
        if (typeof parent === "undefined") {
            return null;
        }

        let children = this.childElements.get(parent);
        if (typeof children === "undefined") {
            return null;
        }

        if (children.length === 0) {
            return null;
        }

        return children[0];
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