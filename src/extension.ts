import { mainModule } from 'node:process';
import * as vscode from 'vscode';
import { ExtensionContext } from 'vscode';
import { Main } from './main';

let main: Main;

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
		main.readConfig();
	});
}

export function deactivate() {
	main.saveSettings();
}
