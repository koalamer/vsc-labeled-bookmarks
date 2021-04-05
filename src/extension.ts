import * as vscode from 'vscode';
import { ExtensionContext } from 'vscode';
import { Main } from './main';

let main: Main;

export function activate(context: ExtensionContext) {
	main = new Main(context);

	main.registerToggleBookmark();
	main.registerToggleLabeledBookmark();
	main.registerSelectGroup();

	vscode.window.onDidChangeActiveTextEditor(textEditor => {
		main.updateDecorations(textEditor);
	});

	main.updateDecorations(vscode.window.activeTextEditor);
}

export function deactivate() {
	main.saveSettings();
}

// snippets

// class PickItem implements QuickPickItem {
//	import { QuickPickItem } from 'vscode';
// 	label: string;
// 	description: string;
// 	detail: string;
// 	constructor(label: string, description: string, detail: string) {
// 		this.label = label;
// 		this.description = description;
// 		this.detail = detail;
// 	}
// }

// show quick pick
// let selected = vscode.window.showQuickPick([
// 	"alma - korte/zebra.php 123",
// 	"korte - zebra/alma.php 4",
// 	"zebra - alma/korte.php 2",
// 	"a1 - somefile 1"
// ], {
// 	canPickMany: true
// });

// let a = new PickItem('lab', 'desc', 'det');

// let selected = vscode.window.showQuickPick([
// 	a
// ], {
// 	canPickMany: true
// });

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