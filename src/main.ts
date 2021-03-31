import * as vscode from 'vscode';
import { Bookmark } from './bookmark';
import { Group } from "./group";
import { SerializableGroupMap } from './serializable_group_map';
import { ExtensionContext, Range, TextEditor, TextEditorDecorationType } from 'vscode';

export class Main {
    public ctx: ExtensionContext;
    public readonly savedGroupsKey = "vscLabeledBookmarks.groups";
    public readonly savedActiveGroupKey = "vscLabeledBookmarks.activeGroup";
    public readonly savedDisplayActiveGroupOnlyKey = "vscLabeledBookmarks.displayActiveGroupOnly";
    public readonly savedHideAllKey = "vscLabeledBookmarks.hideAll";

    public readonly groupSeparator = "@";
    public readonly maxGroupLabelLength = 40;

    public groups: Map<string, Group>;
    public activeGroupLabel: string;
    public readonly defaultGroupLabel: string;
    public fallbackColor: string;
    public readonly fallbackDecoration = vscode.window.createTextEditorDecorationType(
        {
            gutterIconPath: __dirname + "../resources/gutter_icon_bm.svg",
            gutterIconSize: 'contain',
        }
    );

    public colors: Array<string>;

    public displayActiveGroupOnly: boolean;
    public hideAll: boolean;

    private cache: Map<string, Map<TextEditorDecorationType, Array<Range>>>;

    constructor(ctx: ExtensionContext) {
        this.ctx = ctx;
        Group.svgDir = this.ctx.globalStorageUri;

        this.groups = new Map<string, Group>();
        this.defaultGroupLabel = "default";
        this.activeGroupLabel = this.defaultGroupLabel;
        this.fallbackColor = "ffee66ff";

        this.colors = [
            "#ffee66",
            "#ee66ff",
            "#66ffee",
            "#77ff66",
            "#ff6677",
            "#6677ff"
        ];

        let iconWarmupGroups: Array<Group> = [];
        iconWarmupGroups.push(new Group('warmup', this.fallbackColor, new Date()));
        for (let color of this.colors) {
            iconWarmupGroups.push(new Group('warmup', color, new Date()));
        }

        if (this.colors.length < 1) {
            this.colors.push(this.fallbackColor);
        }

        this.displayActiveGroupOnly = false;
        this.hideAll = false;

        this.cache = new Map<string, Map<TextEditorDecorationType, Array<Range>>>();

        this.restoreSettings();
        // this.displayActiveGroupOnly = false;
        // this.groups = new Map<string, Group>();
        this.activateGroup(this.activeGroupLabel);
        this.saveSettings();
    }

    public saveSettings() {
        let serializedGroupMap = SerializableGroupMap.fromGroupMap(this.groups);
        this.ctx.workspaceState.update(this.savedGroupsKey, serializedGroupMap);
        this.ctx.workspaceState.update(this.savedActiveGroupKey, this.activeGroupLabel);
        this.ctx.workspaceState.update(this.savedDisplayActiveGroupOnlyKey, this.displayActiveGroupOnly);
        this.ctx.workspaceState.update(this.savedHideAllKey, this.hideAll);
    }

    public updateDecorations(textEditor: TextEditor | undefined) {
        if (typeof textEditor === "undefined") {
            return;
        }

        let documentFsPath = textEditor.document.uri.fsPath;

        let decorationsLists: Map<TextEditorDecorationType, Range[]>;
        decorationsLists = this.getCachedDecorations(documentFsPath);
        for (let [decoration, ranges] of decorationsLists) {
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

                let group = this.groups.get(this.activeGroupLabel);
                if (typeof group === "undefined") {
                    return;
                }

                group.toggleBookmark(documentFsPath, lineNumber);
                this.cacheReset();
                this.updateDecorations(textEditor);
                this.saveSettings();
            });
        this.ctx.subscriptions.push(disposable);
    }

    public registerToggleLabeledBookmark() {
        let disposable = vscode.commands.registerTextEditorCommand(
            'vsc-labeled-bookmarks.toggleLabeledBookmark',
            (textEditor) => {
                if (textEditor.selections.length === 0) {
                    return;
                }

                let lineNumber = textEditor.selection.start.line;
                let documentFsPath = textEditor.document.uri.fsPath;

                let activeGroup = this.groups.get(this.activeGroupLabel);
                if (typeof activeGroup === "undefined") {
                    return;
                }

                let existingLabel = activeGroup.getLabelByPosition(documentFsPath, lineNumber);
                if (typeof existingLabel !== "undefined") {
                    activeGroup.deleteLabel(existingLabel);
                    this.cacheReset();
                    this.updateDecorations(textEditor);
                    this.saveSettings();
                    return;
                }

                vscode.window.showInputBox({
                    placeHolder: "label or label@group or @group",
                    prompt: "Enter label and/or group to be created"
                }).then(input => {
                    if (typeof input === "undefined") {
                        return;
                    }

                    input = input.trim();
                    if (input === "") {
                        return;
                    }

                    let label = "";
                    let groupLabel = "";

                    let separatorPos = input.indexOf(this.groupSeparator);
                    if (separatorPos >= 0) {
                        label = input.substring(0, separatorPos).trim();
                        groupLabel = input.substring(separatorPos + 1).trim();
                    } else {
                        label = input;
                    }

                    if (label === "" && groupLabel === "") {
                        return;
                    }

                    if (groupLabel.length > this.maxGroupLabelLength) {
                        vscode.window.showErrorMessage(
                            "Choose a maximum " +
                            this.maxGroupLabelLength +
                            " character long group name."
                        );
                        return;
                    }

                    if (groupLabel !== "") {
                        this.activateGroup(groupLabel);
                    }

                    if (label !== "") {
                        let activeGroup = this.groups.get(this.activeGroupLabel);
                        if (typeof activeGroup !== "undefined") {
                            activeGroup.addLabel(label, documentFsPath, lineNumber);
                        }
                    }

                    this.cacheReset();
                    this.updateDecorations(textEditor);
                    this.saveSettings();
                });
            });
        this.ctx.subscriptions.push(disposable);
    }

    private restoreSettings() {
        this.displayActiveGroupOnly =
            this.ctx.workspaceState.get(this.savedDisplayActiveGroupOnlyKey) ?? false;

        this.hideAll = this.ctx.workspaceState.get(this.savedHideAllKey) ?? false;

        this.activeGroupLabel = this.ctx.workspaceState.get(this.savedActiveGroupKey) ?? this.defaultGroupLabel;
        let serializedGroupMap: SerializableGroupMap | undefined = this.ctx.workspaceState.get(this.savedGroupsKey);

        this.groups = new Map<string, Group>();
        if (typeof serializedGroupMap !== "undefined") {
            try {
                this.groups = SerializableGroupMap.toGroupMap(serializedGroupMap);
            } catch (e) {
                vscode.window.showErrorMessage("Restoring bookmarks failed (" + e + ")");
            }
        }
    }

    private activateGroup(label: string) {
        this.ensureGroup(label);
        if (this.activeGroupLabel !== label) {
            this.cacheReset();
        }
        this.activeGroupLabel = label;

        vscode.window.showInformationMessage("group " + label + " activated");
        //todo update statusbar if there is one
    }

    private ensureGroup(label: string) {
        if (this.groups.has(label)) {
            return;
        }

        let group = new Group(label, this.getLeastUsedColor(), new Date());
        this.groups.set(label, group);
        vscode.window.showInformationMessage("group " + label + " created");
    }

    private getLeastUsedColor(): string {
        if (this.colors.length < 1) {
            return this.fallbackColor;
        }

        let usages = new Map<string, number>();

        for (let color of this.colors) {
            usages.set(Group.normalizeColorFormat(color), 0);
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

        vscode.window.showInformationMessage("color " + leastUsedColor);
        return leastUsedColor;
    }

    public setDisplayActiveGroupOnly(displayActiveGroupOnly: boolean) {
        if (this.displayActiveGroupOnly !== displayActiveGroupOnly) {
            this.cacheReset();
        }
        this.displayActiveGroupOnly = displayActiveGroupOnly;
    }

    private cacheReset() {
        this.cache = new Map<string, Map<TextEditorDecorationType, Array<Range>>>();
    }

    public getCachedDecorations(fsPath: string): Map<TextEditorDecorationType, Array<Range>> {
        if (this.hideAll) {
            return new Map<TextEditorDecorationType, Array<Range>>();
        }

        let cached = this.cache.get(fsPath);
        if (typeof cached !== "undefined") {
            return cached;
        }

        let result = new Map<TextEditorDecorationType, Array<Range>>();

        let linesTaken = new Map<Number, boolean>();
        let theActiveGroup = this.groups.get(this.activeGroupLabel);

        if (typeof theActiveGroup !== "undefined") {
            let bookmarks = theActiveGroup.getBookmarksOfFsPath(fsPath);
            for (let bookmark of bookmarks) {
                linesTaken.set(bookmark.line, true);
            }
        }

        for (let [label, group] of this.groups) {
            let decorationShown: TextEditorDecorationType;
            let decorationHidden: TextEditorDecorationType;

            if (label === this.activeGroupLabel) {
                decorationShown = group.decoration ?? this.fallbackDecoration;
                decorationHidden = group.inactiveDecoration ?? this.fallbackDecoration;
            } else {
                decorationShown = group.inactiveDecoration ?? this.fallbackDecoration;
                decorationHidden = group.decoration ?? this.fallbackDecoration;
            }

            result.set(decorationHidden, []);

            let ranges: Array<Range> = [];
            let bookmarks = group.getBookmarksOfFsPath(fsPath);
            for (let bookmark of bookmarks) {
                if (label !== this.activeGroupLabel && linesTaken.has(bookmark.line)) {
                    continue;
                }

                linesTaken.set(bookmark.line, true);
                ranges.push(new Range(bookmark.line, 0, bookmark.line, 0));
            }

            result.set(decorationShown, ranges);
        }

        this.cache.set(fsPath, result);
        return result;
    }
}