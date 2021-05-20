import * as vscode from 'vscode';
import { ExtensionContext, TreeView } from 'vscode';
import { Bookmark } from './bookmark';
import { BookmarkTreeDataProvider } from './bookmark_tree_data_provider';
import { BookmarkTreeItem } from './bookmark_tree_item';
import { Main } from './main';

let main: Main;
let treeViewByGroup: TreeView<BookmarkTreeItem>;
let treeViewByFile: TreeView<BookmarkTreeItem>;
let treeDataProviderByGroup: BookmarkTreeDataProvider;
let treeDataProviderByFile: BookmarkTreeDataProvider;

let treeViewRefreshLimiter: NodeJS.Timeout | null = null;
let treeViewRefreshCallback = () => {
	if (treeViewRefreshLimiter !== null) {
		return;
	}

	treeViewRefreshLimiter = setTimeout(
		() => {
			treeViewRefreshLimiter = null;
			treeDataProviderByGroup.refresh();
			treeDataProviderByFile.refresh();
		},
		300
	);
};

export function activate(context: ExtensionContext) {
	main = new Main(context, treeViewRefreshCallback);

	let disposable: vscode.Disposable;

	disposable = vscode.commands.registerTextEditorCommand(
		'vsc-labeled-bookmarks.toggleBookmark',
		(textEditor) => main.editorActionToggleBookmark(textEditor)
	);
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerTextEditorCommand(
		'vsc-labeled-bookmarks.toggleLabeledBookmark',
		(textEditor) => main.editorActionToggleLabeledBookmark(textEditor)
	);
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerTextEditorCommand(
		'vsc-labeled-bookmarks.navigateToNextBookmark',
		(textEditor) => main.editorActionnavigateToNextBookmark(textEditor));
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerTextEditorCommand(
		'vsc-labeled-bookmarks.navigateToPreviousBookmark',
		(textEditor) => main.editorActionNavigateToPreviousBookmark(textEditor));
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand(
		'vsc-labeled-bookmarks.navigateToBookmark',
		() => main.actionNavigateToBookmark());
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand(
		'vsc-labeled-bookmarks.navigateToBookmarkOfAnyGroup',
		() => main.actionNavigateToBookmarkOfAnyGroup());
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand(
		'vsc-labeled-bookmarks.selectGroup',
		() => main.actionSelectGroup());
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand(
		'vsc-labeled-bookmarks.addGroup',
		() => main.actionAddGroup());
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand(
		'vsc-labeled-bookmarks.deleteGroup',
		() => main.actionDeleteGroup());
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand(
		'vsc-labeled-bookmarks.setGroupIconShape',
		() => main.actionSetGroupIconShape());
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand(
		'vsc-labeled-bookmarks.setGroupIconColor',
		() => main.actionSetGroupIconColor());
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand(
		'vsc-labeled-bookmarks.deleteBookmark',
		() => main.actionDeleteBookmark());
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand(
		'vsc-labeled-bookmarks.toggleHideAll',
		() => main.actionToggleHideAll());
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand(
		'vsc-labeled-bookmarks.toggleHideInactiveGroups',
		() => main.actionToggleHideInactiveGroups());
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand(
		'vsc-labeled-bookmarks.clearFailedJumpFlags',
		() => main.actionClearFailedJumpFlags());
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerTextEditorCommand(
		'vsc-labeled-bookmarks.expandSelectionToNextBookmark',
		(textEditor) => main.actionExpandSelectionToNextBookmark(textEditor));
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerTextEditorCommand(
		'vsc-labeled-bookmarks.expandSelectionToPreviousBookmark',
		(textEditor) => main.actionExpandSelectionToPreviousBookmark(textEditor));
	context.subscriptions.push(disposable);

	vscode.window.onDidChangeActiveTextEditor(textEditor => {
		main.updateEditorDecorations(textEditor);
	});

	vscode.workspace.onDidChangeTextDocument(textDocumentChangeEvent => {
		main.onEditorDocumentChanged(textDocumentChangeEvent);
	});

	vscode.workspace.onDidRenameFiles(fileRenameEvent => {
		main.onFilesRenamed(fileRenameEvent);
	});

	vscode.workspace.onDidDeleteFiles(fileDeleteEvent => {
		main.onFilesDeleted(fileDeleteEvent);
	});

	vscode.workspace.onDidChangeConfiguration(() => {
		main.readSettings();
	});

	treeDataProviderByGroup = main.getTreeDataProviderByGroup();
	treeDataProviderByFile = main.getTreeDataProviderByFile();

	treeViewByGroup = vscode.window.createTreeView('bookmarksByGroup', {
		treeDataProvider: treeDataProviderByGroup
	});

	treeViewByFile = vscode.window.createTreeView('bookmarksByFile', {
		treeDataProvider: treeDataProviderByFile
	});

	disposable = vscode.commands.registerCommand(
		'vsc-labeled-bookmarks.refreshTreeView',
		treeViewRefreshCallback
	);
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand(
		'vsc-labeled-bookmarks.jumpToBookmark',
		(bookmark: Bookmark, preview: boolean) => main.jumpToBookmark(bookmark, preview));
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand(
		'vsc-labeled-bookmarks.showTreeView',
		() => {
			try {
				let groupTarget = treeDataProviderByGroup.getTargetForGroup(main.getActiveGroup());
				if (groupTarget === null) {
					return;
				}

				let textEditor = vscode.window.activeTextEditor;

				if (typeof textEditor === "undefined") {
					treeViewByGroup.reveal(groupTarget);
					return;
				}

				let nearestBookmark = main.getNearestBookmark(textEditor);

				if (nearestBookmark === null) {
					treeViewByGroup.reveal(groupTarget);
					return;
				}

				let target1 = treeDataProviderByFile.getTargetForBookmark(nearestBookmark);
				if (target1 !== null) {
					treeViewByFile.reveal(target1);
				}

				let target2 = treeDataProviderByGroup.getTargetForBookmark(nearestBookmark);
				if (target2 !== null) {
					treeViewByGroup.reveal(target2);
				}
			} catch (e) {
				console.log(e);
			}
		});
	context.subscriptions.push(disposable);

	treeDataProviderByGroup.init();
	treeDataProviderByFile.init();

	treeViewRefreshCallback();
}

export function deactivate() {
	main.saveState();
}
