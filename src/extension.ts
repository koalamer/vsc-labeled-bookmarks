import { type } from 'node:os';
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

export function activate(context: ExtensionContext) {
	main = new Main(context);

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
		() => {
			treeDataProviderByGroup.refresh();
			treeDataProviderByFile.refresh();
		});
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
				if (groupTarget !== null) {
					treeViewByGroup.reveal(groupTarget);
				}

				let textEditor = vscode.window.activeTextEditor;

				if (typeof textEditor === "undefined") {
					return;
				}

				let nearestBookmark = main.getNearestBookmark(textEditor);

				if (nearestBookmark === null) {
					return;
				}

				let target = treeDataProviderByFile.getTargetForBookmark(nearestBookmark);
				if (target !== null) {
					treeViewByFile.reveal(target);
				}
			} catch (e) {
				console.log(e);
			}
		});
	context.subscriptions.push(disposable);

}

export function deactivate() {
	main.saveState();
}
