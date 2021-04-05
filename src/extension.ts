import * as vscode from 'vscode';
import { ExtensionContext } from 'vscode';
import { Main } from './main';

let main: Main;

export function activate(context: ExtensionContext) {
	main = new Main(context);

	main.registerToggleBookmark();
	main.registerToggleLabeledBookmark();
	main.registerSelectGroup();
	main.registerDeleteGroup();

	vscode.window.onDidChangeActiveTextEditor(textEditor => {
		main.updateDecorations(textEditor);
	});

	main.updateDecorations(vscode.window.activeTextEditor);
}

export function deactivate() {
	main.saveSettings();
}

// snippets

// open a file
// let doc = await vscode.workspace.openTextDocument('C:/Users/Balu/vimfiles/syntax/go.vim'); // calls back into the provider
// await vscode.window.showTextDocument(doc, { preview: false });

// go to line
// let editor2 = vscode.window.activeTextEditor;
// if (typeof editor2 !== 'undefined') {
// 	let range = editor2.document.lineAt(4).range;
// 	editor2.selection = new vscode.Selection(range.start, range.start);
// 	editor2.revealRange(range);
// }

// status bar item
// let statusBarWorkspaceLabel = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);
// statusBarWorkspaceLabel.text = '$(bookmark) group: temp';
// statusBarWorkspaceLabel.tooltip = 'tooltip';
// statusBarWorkspaceLabel.show();
// statusBarWorkspaceLabel.text = '$(bookmark) group: another';