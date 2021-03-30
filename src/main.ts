import * as vscode from 'vscode';
import { Bookmark } from './bookmark';
import { Group } from "./group";
import { SerializableGroupMap } from './serializable_group_map';
import { ExtensionContext, Range, TextEditor, TextEditorDecorationType } from 'vscode';

export class Main {
    public ctx: ExtensionContext;
    public readonly savedGroupsKey = "vscLabeledBookmarks.groups";
    public readonly savedActiveGroupKey = "vscLabeledBookmarks.activeGroup";

    public groups: Map<string, Group>;
    public activeGroup: string;
    public readonly defaultGroupLabel: string;
    public fallbackColor: string;

    public colors: Array<string>;

    public displayMode: number = 2; // 0: hide bookmarks, 1: display active group only, 2:display all groups

    constructor(ctx: ExtensionContext) {
        this.ctx = ctx;
        Group.svgDir = this.ctx.globalStorageUri;

        this.groups = new Map<string, Group>();
        this.defaultGroupLabel = "default";
        this.activeGroup = this.defaultGroupLabel;
        this.fallbackColor = "ffee66";

        this.colors = [
            "#ffee66",
            "#ee66ff",
            "#66ffee",
            "#77ff66",
            "#ff6677",
            "#6677ff"
        ];

        if (this.colors.length < 1) {
            this.colors.push(this.fallbackColor);
        }

        this.restoreSettings();
    }

    public saveSettings() {
        let serializedGroupMap = SerializableGroupMap.fromGroupMap(this.groups);
        this.ctx.workspaceState.update(this.savedGroupsKey, serializedGroupMap);
        this.ctx.workspaceState.update(this.savedActiveGroupKey, this.activeGroup);
    }

    public updateDecorations(textEditor: TextEditor | undefined) {
        if (typeof textEditor === "undefined") {
            return;
        }

        let documentFsPath = textEditor.document.uri.fsPath;
        let decoration: TextEditorDecorationType | undefined;
        for (let [label, group] of this.groups) {
            if (label === this.activeGroup) {
                decoration = group.decoration;
            } else {
                decoration = group.inactiveDecoration;
            }

            if (typeof decoration === "undefined") {
                vscode.window.showErrorMessage("missing decoration in bookmark group '" + label + "'");
                continue;
            }

            let ranges: Array<Range> = [];
            for (let bookmark of group.getBookmarksOfFsPath(documentFsPath)) {
                ranges.push(new Range(bookmark.line, 0, bookmark.line, 0));
            }
            textEditor.setDecorations(decoration, ranges);
        }
    }

    public registerToggleBookmark() {
        let disposable = vscode.commands.registerTextEditorCommand(
            'vsc-labeled-bookmarks.toggleBookmark',
            (textEditor) => {
                if (textEditor.selections.length === 0) {
                    return;
                }

                let lineNumber = textEditor.selection.start.line;
                let documentFsPath = textEditor.document.uri.fsPath;

                let group = this.groups.get(this.activeGroup);
                if (typeof group === "undefined") {
                    return;
                }

                group.toggleBookmark(documentFsPath, lineNumber);

                this.saveSettings();
                this.updateDecorations(textEditor);
            });
        this.ctx.subscriptions.push(disposable);
    }

    private restoreSettings() {
        this.activeGroup = this.ctx.workspaceState.get(this.savedActiveGroupKey) ?? this.defaultGroupLabel;
        let serializedGroupMap: SerializableGroupMap | undefined = this.ctx.workspaceState.get(this.savedGroupsKey);

        this.groups = new Map<string, Group>();
        if (typeof serializedGroupMap !== "undefined") {
            try {
                this.groups = SerializableGroupMap.toGroupMap(serializedGroupMap);
            } catch (e) {
                vscode.window.showErrorMessage("Restoring bookmarks failed (" + e + ")");
            }
        }

        this.activateGroup(this.activeGroup);
    }

    private activateGroup(label: string) {
        this.ensureGroup(label);
        this.activeGroup = label;
        this.saveSettings();
        //todo update statusbar if there is one
    }

    private ensureGroup(label: string) {
        if (this.groups.has(label)) {
            return;
        }

        let group = new Group(label, this.getLeastUsedColor(), new Date());
        this.groups.set(label, group);
    }

    private getLeastUsedColor(): string {
        if (this.colors.length < 1) {
            return this.fallbackColor;
        }

        let usages = new Map<string, number>();

        for (let color of this.colors) {
            usages.set(color, 0);
        }

        for (let [_, group] of this.groups) {
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

}