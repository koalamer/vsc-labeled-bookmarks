import * as vscode from 'vscode';
import { ExtensionContext, Uri } from 'vscode';

import { Group } from "./group";

let groups: Array<Group>;
let currentGroup: number;

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

export function activate(context: ExtensionContext) {
	let svgDir = Uri.joinPath(context.globalStorageUri, "svg");
	await vscode.workspace.fs.createDirectory(svgDir);
	Group.svgDir = svgDir;

	groups = [];
	currentGroup = 0;

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('vsc-labeled-bookmarks.toggleBookmark', () => {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		// vscode.window.showInformationMessage('Hello World from vsc-labeled-bookmarks!');

		// make a relative filename
		// vscode.window.showInformationMessage(path.join(__dirname, '..', 'resources', 'light', 'asd.svg'));

		// set a decoration on some line
		// let deco = vscode.window.createTextEditorDecorationType(
		// 	{
		// 		gutterIconPath: path.join(__dirname, '..', 'resources', 'bmffff66.svg'),
		// 		gutterIconSize: 'contain',
		// 	}
		// );
		// let range1 = new vscode.Range(1, 0, 1, 0);
		// let range2 = new vscode.Range(2, 0, 3, 0);
		// let editor = vscode.window.activeTextEditor;
		// editor?.setDecorations(deco, [range1, range2]);
		// Available values are 'auto', 'contain', 'cover' and any percentage

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
		// let editor = vscode.window.activeTextEditor;
		// if (typeof editor !== 'undefined') {
		// 	if (editor.selections.length === 0) {
		// 		vscode.window.showInformationMessage('Nope!');
		// 	} else {
		// 		let selection = editor.selection;
		// 		vscode.window.showInformationMessage('Selection: char ' + selection.start.character + ' line ' + selection.start.line + ', file ' + editor.document.fileName);
		// 	}
		// }

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

		// stat non existing / not existing file
		// import { fstat } from 'node:fs';
		// try {
		// 	let stat = await vscode.workspace.fs.stat(Uri.file(path.join(__dirname, '..', 'resources', 'bmffff66.svg')));
		// 	vscode.window.showInformationMessage("Stat 1 size: " + stat.size + " mtime: " + stat.mtime + " type: " + stat.type);
		// 	let stat2 = await vscode.workspace.fs.stat(Uri.file(path.join(__dirname, '..', 'resources', 'bm.svg')));
		// 	vscode.window.showInformationMessage("Stat 2 size: " + stat2.size + " mtime: " + stat2.mtime + " type: " + stat2.type);
		// } catch (e) {
		// 	vscode.window.showInformationMessage("stat exception");
		// }

		// writing an svg
		// let svgDir = Uri.joinPath(context.globalStorageUri, "svg");
		// try {
		// 	await vscode.workspace.fs.createDirectory(svgDir);
		// 	vscode.window.showInformationMessage(svgDir.path + " created");
		// } catch (e) {
		// 	vscode.window.showInformationMessage("dir " + svgDir.path + " exception");
		// }

		// let svgSource = new Uint8Array([0x3c, 0x73, 0x76, 0x67, 0x20, 0x78, 0x6d, 0x6c, 0x6e, 0x73, 0x3d, 0x22, 0x68, 0x74, 0x74, 0x70, 0x3a, 0x2f, 0x2f, 0x77, 0x77, 0x77, 0x2e, 0x77, 0x33, 0x2e, 0x6f, 0x72, 0x67, 0x2f, 0x32, 0x30, 0x30, 0x30, 0x2f, 0x73, 0x76, 0x67, 0x22, 0x20, 0x77, 0x69, 0x64, 0x74, 0x68, 0x3d, 0x22, 0x33, 0x32, 0x22, 0x20, 0x68, 0x65, 0x69, 0x67, 0x68, 0x74, 0x3d, 0x22, 0x33, 0x32, 0x22, 0x3e, 0x3c, 0x70, 0x61, 0x74, 0x68, 0x20, 0x64, 0x3d, 0x22, 0x4d, 0x37, 0x20, 0x33, 0x30, 0x20, 0x4c, 0x37, 0x20, 0x38, 0x20, 0x51, 0x37, 0x20, 0x32, 0x20, 0x31, 0x33, 0x20, 0x32, 0x20, 0x4c, 0x31, 0x39, 0x20, 0x32, 0x20, 0x51, 0x32, 0x35, 0x20, 0x32, 0x20, 0x32, 0x35, 0x20, 0x38, 0x20, 0x4c, 0x32, 0x35, 0x20, 0x33, 0x30, 0x20, 0x4c, 0x31, 0x36, 0x20, 0x32, 0x33, 0x20, 0x5a, 0x22, 0x20, 0x66, 0x69, 0x6c, 0x6c, 0x3d, 0x22, 0x23, 0x66, 0x66, 0x66, 0x66, 0x36, 0x36, 0x36, 0x36, 0x22, 0x20, 0x2f, 0x3e, 0x3c, 0x2f, 0x73, 0x76, 0x67, 0x3e]);
		// //replace color part (and alpha)
		// for (let i = 134; i < 142; i++) {
		// 	svgSource[i] = 0x62;
		// }
		// let svgUri = Uri.joinPath(svgDir, "test.svg");
		// try {
		// 	await vscode.workspace.fs.writeFile(svgUri, svgSource);
		// 	vscode.window.showInformationMessage(svgUri.path + " written");
		// } catch (e) {
		// 	vscode.window.showInformationMessage("dir " + svgDir.path + " exception");
		// }
		// try {
		// 	let stat = await vscode.workspace.fs.stat(svgUri);
		// 	vscode.window.showInformationMessage("Stat size: " + stat.size + " mtime: " + stat.mtime + " type: " + stat.type);
		// } catch (e) {
		// 	vscode.window.showInformationMessage("stat exception");
		// }

		// // use the new icon for gutter decoration
		// let deco = vscode.window.createTextEditorDecorationType(
		// 	{
		// 		gutterIconPath: svgUri,
		// 		gutterIconSize: 'contain',
		// 	}
		// );
		// let range1 = new vscode.Range(1, 0, 1, 0);
		// let range2 = new vscode.Range(2, 0, 3, 0);
		// let editor = vscode.window.activeTextEditor;
		// editor?.setDecorations(deco, [range1, range2]);

		let statusBarWorkspaceLabel = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);
		statusBarWorkspaceLabel.text = '$(bookmark) group: temp';
		statusBarWorkspaceLabel.tooltip = 'tooltip';
		statusBarWorkspaceLabel.show();

		statusBarWorkspaceLabel.text = '$(bookmark) group: another';

		context.subscriptions.push(disposable);
	});
}

// this method is called when your extension is deactivated
export function deactivate() {

}
