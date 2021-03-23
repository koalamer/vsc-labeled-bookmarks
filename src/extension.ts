// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { InputBoxOptions } from 'vscode';

import { QuickPickItem } from 'vscode';

class PickItem implements QuickPickItem {
	label: string;
	description: string;
	detail: string;

	constructor(label: string, description: string, detail: string) {
		this.label = label;
		this.description = description;
		this.detail = detail;
	}
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vsc-labeled-bookmarks" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('vsc-labeled-bookmarks.helloWorld', async () => {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		// vscode.window.showInformationMessage('Hello World from vsc-labeled-bookmarks!');

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

		// show quick input
		// let input = vscode.window.showInputBox({ placeHolder: "pholder", prompt: "prompt\nmultiline" });

		// show location
		let editor = vscode.window.activeTextEditor;
		if (typeof editor !== 'undefined') {
			if (editor.selections.length === 0) {
				vscode.window.showInformationMessage('Nope!');
			} else {
				let selection = editor.selection;
				vscode.window.showInformationMessage('Selection: char ' + selection.start.character + ' line ' + selection.start.line + ', file ' + editor.document.fileName);
			}
		}

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

		context.subscriptions.push(disposable);
	});
}

// this method is called when your extension is deactivated
export function deactivate() {

}
