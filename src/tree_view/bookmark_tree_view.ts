import * as vscode from 'vscode';
import { TreeView } from 'vscode';
import { Main } from '../main';
import { BookmarkTreeItem } from './bookmark_tree_item';
import { RateLimiter } from '../rate_limiter/rate_limiter';
import { ActiveGroupTreeDataProvider } from './active_group_tree_data_rovider';
import { InactiveGroupsTreeDataProvider } from './inactive_groups_tree_data_provider';
import { ByFileTreeDataProvider } from './by_file_tree_data_provider';

export class BookmarkTreeView {
    private main: Main | null = null;

    private treeViewByActiveGroup: TreeView<BookmarkTreeItem> | null = null;
    private treeViewByInactiveGroups: TreeView<BookmarkTreeItem> | null = null;
    private treeViewByFile: TreeView<BookmarkTreeItem> | null = null;

    private treeDataProviderByActiveGroup: ActiveGroupTreeDataProvider | null = null;
    private treeDataProviderByInactiveGroups: InactiveGroupsTreeDataProvider | null = null;
    private treeDataProviderByFile: ByFileTreeDataProvider | null = null;

    private proxyRefreshCallback = () => { };
    private refreshLimiter: RateLimiter = new RateLimiter(() => { }, 0, 1000);

    private isInitDone: boolean = false;

    public async init(main: Main) {
        this.main = main;

        this.treeDataProviderByActiveGroup = new ActiveGroupTreeDataProvider(this.main);
        this.treeDataProviderByInactiveGroups = new InactiveGroupsTreeDataProvider(this.main);
        this.treeDataProviderByFile = new ByFileTreeDataProvider(this.main);

        this.treeViewByActiveGroup = vscode.window.createTreeView('bookmarksByActiveGroup', {
            treeDataProvider: this.treeDataProviderByActiveGroup
        });

        this.treeViewByInactiveGroups = vscode.window.createTreeView('bookmarksByInactiveGroups', {
            treeDataProvider: this.treeDataProviderByInactiveGroups
        });

        this.treeViewByFile = vscode.window.createTreeView('bookmarksByFile', {
            treeDataProvider: this.treeDataProviderByFile
        });

        await this.treeDataProviderByActiveGroup.init();
        await this.treeDataProviderByInactiveGroups.init();
        await this.treeDataProviderByFile.init();

        this.refreshLimiter = new RateLimiter(
            this.actualRefresh.bind(this),
            50,
            800
        );
        this.proxyRefreshCallback = this.refreshLimiter.fire.bind(this.refreshLimiter);

        this.isInitDone = true;

        this.refreshCallback();
    }

    public refreshCallback() {
        this.proxyRefreshCallback();
    }

    public deleteItem(treeItem: BookmarkTreeItem) {
        if (!this.isInitDone) {
            return;
        }

        let bookmark = treeItem.getBaseBookmark();
        if (bookmark !== null) {
            this.main?.actionDeleteOneBookmark(bookmark);
            return;
        }

        let group = treeItem.getBaseGroup();
        if (group !== null) {
            this.main?.actionDeleteOneGroup(group);
            return;
        }

        let fsPath = treeItem.getBaseFSPath();
        if (fsPath !== null) {
            this.main?.deleteBookmarksOfFile(fsPath, treeItem.getFilterGroup());
        }
    }


    public activateItem(treeItem: BookmarkTreeItem) {
        if (!this.isInitDone) {
            return;
        }

        let group = treeItem.getBaseGroup();
        if (group === null) {
            return;
        }

        this.main?.setActiveGroup(group.name);
    }

    public editItem(treeItem: BookmarkTreeItem) {
        if (!this.isInitDone) {
            return;
        }

        let bookmark = treeItem.getBaseBookmark();
        if (bookmark !== null) {
            this.main?.relabelBookmark(bookmark);
            return;
        }

        let group = treeItem.getBaseGroup();
        if (group !== null) {
            this.main?.renameGroup(group);
            return;
        }
    }

    public async show() {
        try {
            if (!this.isInitDone
                || this.main === null
                || this.treeDataProviderByActiveGroup === null
                || this.treeViewByActiveGroup === null) {
                return;
            }

            if (!this.treeViewByActiveGroup.visible) {
                let anytarget = this.treeDataProviderByActiveGroup.getAnyTarget();
                if (anytarget !== null) {
                    this.treeViewByActiveGroup.reveal(anytarget);
                }
            }

            let textEditor = vscode.window.activeTextEditor;

            if (typeof textEditor === "undefined" && vscode.window.visibleTextEditors.length > 0) {
                textEditor = vscode.window.visibleTextEditors[0];
            }

            if (typeof textEditor === "undefined") {
                return;
            }

            let nearestBookmarkInFile = this.main.getNearestBookmark(textEditor, this.main.getActiveGroup());

            if (nearestBookmarkInFile === null) {
                return;
            }

            let targetBookmark = await this.treeDataProviderByActiveGroup.getTargetForBookmark(nearestBookmarkInFile);
            if (targetBookmark !== null) {
                this.treeViewByActiveGroup.reveal(targetBookmark);
            }
        } catch (e) {
            console.log(e);
            vscode.window.showErrorMessage("Bookmark tree view init error " + e);
        }
    }

    private actualRefresh() {
        this.treeDataProviderByActiveGroup?.refresh();
        this.treeDataProviderByInactiveGroups?.refresh();
        this.treeDataProviderByFile?.refresh();
    }
}