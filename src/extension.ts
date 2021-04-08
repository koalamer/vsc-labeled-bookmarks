import * as vscode from 'vscode';
import { ExtensionContext } from 'vscode';
import { Main } from './main';

let main: Main;

export function activate(context: ExtensionContext) {
	main = new Main(context);

	main.registerToggleBookmark();
	main.registerToggleLabeledBookmark();
	main.registerNavigateToBookmark();
	main.registerSelectGroup();
	main.registerAddGroup();
	main.registerDeleteGroup();
	main.registerSetGroupIconShape();
	main.registerSetGroupIconColor();

	vscode.window.onDidChangeActiveTextEditor(textEditor => {
		main.updateDecorations(textEditor);
	});

	main.updateDecorations(vscode.window.activeTextEditor);
}

export function deactivate() {
	main.saveSettings();
}

// snippets

// status bar item
// let statusBarWorkspaceLabel = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);
// statusBarWorkspaceLabel.text = '$(bookmark) group: temp';
// statusBarWorkspaceLabel.tooltip = 'tooltip';
// statusBarWorkspaceLabel.show();
// statusBarWorkspaceLabel.text = '$(bookmark) group: another';