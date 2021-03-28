import * as vscode from 'vscode';
import { ExtensionContext, Range, TextEditor, TextEditorDecorationType, Uri } from 'vscode';
import { Group } from "./group";

let ctx: ExtensionContext;
let savedGroupsKey = "vscLabeledBookmarks.groups";
let savedActiveGroupKey = "vscLabeledBookmarks.activeGroup";

let groups: Map<string, Group>;
let activeGroup: string;
let defaultGroupLabel: string;
let fallbackColor: string;

let colors: Array<string>;

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
	ctx = context;
	groups = new Map<string, Group>();
	defaultGroupLabel = "default";
	activeGroup = defaultGroupLabel;
	fallbackColor = "ff6666";

	colors = [
		"ffee66",
		"ee66ff",
		"66ffee",
		"77ff66",
		"ff6677",
		"6677ff"
	];

	if (colors.length < 1) {
		colors.push(fallbackColor);
	}

	let svgDir = Uri.joinPath(ctx.globalStorageUri, "svg");
	vscode.workspace.fs.createDirectory(svgDir).then(() => {
		Group.svgDir = svgDir;

		// groups = ctx.workspaceState.get(savedGroupsKey) ?? new Map<string, Group>();
		groups = new Map<string, Group>();
		activeGroup = ctx.workspaceState.get(savedActiveGroupKey) ?? defaultGroupLabel;
		activateGroup(activeGroup);

		// vscode.window.showInformationMessage("initializing group decorations");
		// for (let [_, group] of groups) {
		// 	group.initDecorations();
		// 	vscode.window.showInformationMessage("one done");
		// }

		vscode.window.showInformationMessage("active group: " + activeGroup + " of " + groups.size);
		vscode.window.showInformationMessage("would save: " + JSON.stringify(groups));

		let disposable = vscode.commands.registerTextEditorCommand('vsc-labeled-bookmarks.toggleBookmark', (textEditor) => {
			if (textEditor.selections.length === 0) {
				return;
			}

			let lineNumber = textEditor.selection.start.line;
			let documentUri = textEditor.document.uri;

			let group = groups.get(activeGroup);
			if (typeof group === "undefined") {
				return;
			}

			vscode.window.showInformationMessage("toggleBookmark " + lineNumber + " " + documentUri.fsPath);
			group.toggleBookmark(documentUri, lineNumber);

			vscode.window.showInformationMessage("start updateDecorations");
			updateDecorations(textEditor);
			vscode.window.showInformationMessage("end updateDecorations");

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

			// status bar item
			// let statusBarWorkspaceLabel = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);
			// statusBarWorkspaceLabel.text = '$(bookmark) group: temp';
			// statusBarWorkspaceLabel.tooltip = 'tooltip';
			// statusBarWorkspaceLabel.show();
			// statusBarWorkspaceLabel.text = '$(bookmark) group: another';

			ctx.subscriptions.push(disposable);
		});
	});
}

// this method is called when your extension is deactivated
export function deactivate() {
	saveSettings();
}

function saveSettings() {
	ctx.workspaceState.update(savedGroupsKey, JSON.stringify(groups));
	ctx.workspaceState.update(savedActiveGroupKey, activeGroup);
}

function ensureGroup(label: string) {
	try {
		if (groups.has(label)) {
			vscode.window.showInformationMessage("group exists");
			return;
		}

		vscode.window.showInformationMessage("group being created");
		let group = Group.factory(label, getLeastUsedColor(), new Date());
		groups.set(label, group);
	} catch (e) {
		vscode.window.showInformationMessage("error ensuring group " + label + " (" + JSON.stringify(groups) + "): " + e);
	}
}

function activateGroup(label: string) {
	vscode.window.showInformationMessage("ensure group " + label);
	ensureGroup(label);
	vscode.window.showInformationMessage("setting " + label + " as the active group");
	activeGroup = label;
	vscode.window.showInformationMessage("saving settings");
	saveSettings();
	//todo update statusbar
}

function getLeastUsedColor(): string {
	if (colors.length < 1) {
		return fallbackColor;
	}

	let usages = new Map<string, number>();

	for (let color of colors) {
		usages.set(color, 0);
	}

	for (let [_, group] of groups) {
		let groupColor = group.getColor();
		if (usages.has(groupColor)) {
			usages.set(groupColor, (usages.get(groupColor) ?? 0) + 1);
		}
	}

	let minUsage = Number.MAX_SAFE_INTEGER;
	let leastUsedColor = "";

	for (let [key, value] of usages) {
		if (minUsage > value) {
			minUsage = value;
			leastUsedColor = key;
		}
	}

	return leastUsedColor;
}

function updateDecorations(textEditor: TextEditor) {
	let documentUri = textEditor.document.uri;
	let decoration: TextEditorDecorationType | undefined;
	for (let [label, group] of groups) {
		if (label === activeGroup) {
			decoration = group.decoration;
		} else {
			decoration = group.inactiveDecoration;
		}

		if (typeof decoration === "undefined") {
			vscode.window.showInformationMessage("missing decoration in " + label);
			continue;
		}

		let ranges: Array<Range> = [];
		for (let bookmark of group.getBookmarksOfUri(documentUri)) {
			ranges.push(new Range(bookmark.line, 0, bookmark.line, 0));
		}
		textEditor.setDecorations(decoration, ranges);
		vscode.window.showInformationMessage("using " + ranges.length + " bookmarks of " + group.bookmarks.size);
	}

}