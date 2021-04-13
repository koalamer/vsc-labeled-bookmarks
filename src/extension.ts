import * as vscode from 'vscode';
import { ExtensionContext } from 'vscode';
import { Main } from './main';

let main: Main;

export function activate(context: ExtensionContext) {
	main = new Main(context);

	main.registerToggleBookmark();
	main.registerToggleLabeledBookmark();
	main.registerNavigateToNextBookmark();
	main.registerNavigateToPreviousBookmark();
	main.registerNavigateToBookmark();
	main.registerNavigateToBookmarkOfAnyGroup();
	main.registerSelectGroup();
	main.registerAddGroup();
	main.registerDeleteGroup();
	main.registerSetGroupIconShape();
	main.registerSetGroupIconColor();
	main.registerDeleteBookmark();
	main.registerToggleHideAll();
	main.registerToggleHideInactiveGroups();

	vscode.window.onDidChangeActiveTextEditor(textEditor => {
		main.updateDecorations(textEditor);
	});

	vscode.workspace.onDidChangeTextDocument(textDocumentChangeEvent => {
		main.updateDecorationsOnDocumentChange(textDocumentChangeEvent);
	});

	vscode.workspace.onDidRenameFiles(fileRenameEvent => {
		main.filesRenamed(fileRenameEvent);
	});

	vscode.workspace.onDidDeleteFiles(fileDeleteEvent => {
		main.filesDeleted(fileDeleteEvent);
	});

	vscode.workspace.onDidChangeConfiguration(() => {
		main.readConfig();
	});

	main.updateDecorations(vscode.window.activeTextEditor);
}

export function deactivate() {
	main.saveSettings();
}
