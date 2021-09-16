import * as vscode from 'vscode';
import { TreeView } from 'vscode';
import { Main } from './main';
import { BookmarkTreeDataProvider } from './bookmark_tree_data_provider';
import { BookmarkTreeItem } from './bookmark_tree_item';
import { RateLimiter } from './rate_limiter/rate_limiter';

export class BookmarkTreeView {
    private main: Main | null = null;

    private treeViewByGroup: TreeView<BookmarkTreeItem> | null = null;
    private treeViewByFile: TreeView<BookmarkTreeItem> | null = null;
    private treeDataProviderByGroup: BookmarkTreeDataProvider | null = null;
    private treeDataProviderByFile: BookmarkTreeDataProvider | null = null;

    private proxyRefreshCallback = () => { };
    private refreshLimiter: RateLimiter = new RateLimiter(() => { }, 0, 1000);

    public async init(main: Main) {
        this.main = main;

        this.treeDataProviderByGroup = this.main.getTreeDataProviderByGroup();
        this.treeDataProviderByFile = this.main.getTreeDataProviderByFile();

        this.treeViewByGroup = vscode.window.createTreeView('bookmarksByGroup', {
            treeDataProvider: this.treeDataProviderByGroup
        });

        this.treeViewByFile = vscode.window.createTreeView('bookmarksByFile', {
            treeDataProvider: this.treeDataProviderByFile
        });

        await this.treeDataProviderByGroup.init();
        await this.treeDataProviderByFile.init();

        this.refreshLimiter = new RateLimiter(
            this.actualRefresh.bind(this),
            50,
            800
        );
        this.proxyRefreshCallback = this.refreshLimiter.fire.bind(this.refreshLimiter);

        this.refreshCallback();
    }

    public refreshCallback() {
        this.proxyRefreshCallback();
    }

    public deleteItem(treeItem: BookmarkTreeItem) {
        if (
            this.main === null
            || this.treeDataProviderByFile === null
            || this.treeDataProviderByGroup === null
        ) {
            return;
        }

        let bookmark = treeItem.getBaseBookmark();
        if (bookmark !== null) {
            this.main?.actionDeleteOneBookmark(bookmark);
            return;
        }

        let group = treeItem.getBaseGroup();
        if (group !== null) {
            this.main.actionDeleteOneGroup(group);
            return;
        }

        let fsPath = treeItem.getBaseFSPath();
        if (fsPath !== null) {
            let dataProvider = (treeItem.getFilterGroup() !== null)
                ? this.treeDataProviderByGroup
                : this.treeDataProviderByFile;

            dataProvider.getChildren(treeItem).then(
                children => {
                    children.forEach(treeItem => {
                        let bookmark = treeItem.getBaseBookmark();
                        if (bookmark === null) {
                            return;
                        }
                        if (this.main === null) {
                            return;
                        }
                        this.main.actionDeleteOneBookmark(bookmark);
                    });
                }
            );
        }
    }


    public activateItem(treeItem: BookmarkTreeItem) {
        if (
            this.main === null
            || this.treeDataProviderByFile === null
            || this.treeDataProviderByGroup === null
        ) {
            return;
        }

        let group = treeItem.getBaseGroup();
        if (group === null) {
            return;
        }

        this.main.setActiveGroup(group.name);
    }

    public editItem(treeItem: BookmarkTreeItem) {
        if (
            this.main === null
            || this.treeDataProviderByFile === null
            || this.treeDataProviderByGroup === null
        ) {
            return;
        }

        let bookmark = treeItem.getBaseBookmark();
        if (bookmark !== null) {
            this.main?.relabelBookmark(bookmark);
            return;
        }

        let group = treeItem.getBaseGroup();
        if (group !== null) {
            this.main.renameGroup(group);
            return;
        }
    }

    public async show() {
        try {
            if (
                this.main === null
                || this.treeDataProviderByFile === null
                || this.treeDataProviderByGroup === null
                || this.treeViewByFile === null
                || this.treeViewByGroup === null
            ) {
                vscode.window.showErrorMessage("Bookmark tree view init error 1");
                return;
            }

            if (!this.treeViewByFile.visible) {
                let anytarget = this.treeDataProviderByFile.getAnyTarget();
                if (anytarget !== null) {
                    this.treeViewByFile.reveal(anytarget);
                }
            }

            if (!this.treeViewByGroup.visible) {
                let anytarget = this.treeDataProviderByGroup.getAnyTarget();
                if (anytarget !== null) {
                    this.treeViewByGroup.reveal(anytarget);
                }
            }

            let groupTarget = await this.treeDataProviderByGroup.getTargetForGroup(this.main.getActiveGroup());
            if (groupTarget === null) {
                return;
            }

            let textEditor = vscode.window.activeTextEditor;

            if (typeof textEditor === "undefined" && vscode.window.visibleTextEditors.length > 0) {
                textEditor = vscode.window.visibleTextEditors[0];
            }

            if (typeof textEditor === "undefined") {
                this.treeViewByGroup.reveal(groupTarget);
                return;
            }

            let nearestBookmark = this.main.getNearestBookmark(textEditor);

            if (nearestBookmark === null) {
                this.treeViewByGroup.reveal(groupTarget);
                return;
            }

            let target1 = await this.treeDataProviderByFile.getTargetForBookmark(nearestBookmark);
            if (target1 !== null) {
                this.treeViewByFile.reveal(target1);
            }

            let target2 = await this.treeDataProviderByGroup.getTargetForBookmark(nearestBookmark);
            if (target2 !== null) {
                this.treeViewByGroup.reveal(target2);
            }
        } catch (e) {
            console.log(e);
            vscode.window.showErrorMessage("Bookmark tree view init error " + e);
        }

    }

    private actualRefresh() {
        if (this.treeDataProviderByGroup !== null) {
            this.treeDataProviderByGroup.refresh();
        }
        if (this.treeDataProviderByFile !== null) {
            this.treeDataProviderByFile.refresh();
        }
    }
}