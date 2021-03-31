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

    public groups: Map<string, Group>;
    public activeGroupLabel: string;
    public readonly defaultGroupLabel: string;
    public fallbackColor: string;

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
        this.fallbackColor = "ffee66";

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

        this.displayActiveGroupOnly = true;
        this.hideAll = false;

        this.cache = new Map<string, Map<TextEditorDecorationType, Array<Range>>>();

        this.restoreSettings();

        this.activateGroup(this.activeGroupLabel);
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
                this.cacheResetForFile(documentFsPath);
                this.updateDecorations(textEditor);
                this.saveSettings();
            });
        this.ctx.subscriptions.push(disposable);
    }

    private restoreSettings() {
        this.displayActiveGroupOnly =
            this.ctx.workspaceState.get(this.savedDisplayActiveGroupOnlyKey) ?? this.displayActiveGroupOnly;

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
        this.activeGroupLabel = label;
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

    public setDisplayActiveGroupOnly(displayActiveGroupOnly: boolean) {
        if (this.displayActiveGroupOnly !== displayActiveGroupOnly) {
            this.cacheReset();
        }
        this.displayActiveGroupOnly = displayActiveGroupOnly;
    }

    private cacheReset() {
        this.cache = new Map<string, Map<TextEditorDecorationType, Array<Range>>>();
    }

    private cacheResetForFile(fsPath: string) {
        this.cache.delete(fsPath);
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
            if (bookmarks.length > 0) {
                let ranges: Array<Range> = [];
                for (let bookmark of bookmarks) {
                    linesTaken.set(bookmark.line, true);
                    ranges.push(new Range(bookmark.line, 0, bookmark.line, 0));
                }

                let decoration = theActiveGroup.decoration;
                if (typeof decoration !== "undefined") {
                    result.set(decoration, ranges);
                }
            }
        }

        if (!this.displayActiveGroupOnly) {
            for (let [label, group] of this.groups) {
                if (label === this.activeGroupLabel) {
                    continue;
                }

                let bookmarks = group.getBookmarksOfFsPath(fsPath);
                if (bookmarks.length === 0) {
                    continue;
                }

                let ranges: Array<Range> = [];
                for (let bookmark of bookmarks) {
                    if (linesTaken.has(bookmark.line)) {
                        continue;
                    }

                    linesTaken.set(bookmark.line, true);
                    ranges.push(new Range(bookmark.line, 0, bookmark.line, 0));
                }

                if (ranges.length === 0) {
                    continue;
                }

                let decoration = group.inactiveDecoration;
                if (typeof decoration !== "undefined") {
                    result.set(decoration, ranges);
                }
            }
        }

        this.cache.set(fsPath, result);
        return result;
    }
}