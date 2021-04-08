import * as vscode from 'vscode';
import { Group } from "./group";
import { SerializableGroupMap } from './serializable_group_map';
import { ExtensionContext, Range, TextEditor, TextEditorDecorationType } from 'vscode';
import { DecorationFactory } from './decoration_factory';
import { GroupPickItem } from './group_pick_item';
import { BookmarkPickItem } from './bookmark_pick_item';
import { BookmarkDeletePickItem } from './bookmark_delete_pick_item';
import { ShapePickItem } from './shape_pick_item';
import { ColorPickItem } from './color_pick_item';

export class Main {
    public ctx: ExtensionContext;
    public readonly savedGroupsKey = "vscLabeledBookmarks.groups";
    public readonly savedActiveGroupKey = "vscLabeledBookmarks.activeGroup";
    public readonly savedDisplayActiveGroupOnlyKey = "vscLabeledBookmarks.displayActiveGroupOnly";
    public readonly savedHideAllKey = "vscLabeledBookmarks.hideAll";

    public readonly groupSeparator = "@";
    public readonly maxGroupNameLength = 40;

    public groups: Map<string, Group>;
    public activeGroupName: string;
    public readonly defaultGroupName: string;
    public fallbackColor: string;

    public colors: Map<string, string>;
    public readonly shapes: Map<string, string>;
    public unicodeMarkers: Map<string, string>;
    public defaultShape = "bookmark";

    public displayActiveGroupOnly: boolean;
    public hideAll: boolean;

    private cache: Map<string, Map<TextEditorDecorationType, Array<Range>>>;

    constructor(ctx: ExtensionContext) {
        this.ctx = ctx;
        Group.svgDir = this.ctx.globalStorageUri;
        DecorationFactory.svgDir = this.ctx.globalStorageUri;

        this.groups = new Map<string, Group>();
        this.defaultGroupName = "default";
        this.activeGroupName = this.defaultGroupName;
        this.fallbackColor = "ffee66ff";

        this.colors = new Map<string, string>([
            ["yellow", "#ffee66"],
            ["purple", "#ee66ff"],
            ["teal", "#66ffee"],
            ["green", "#77ff66"],
            ["red", "#ff6677"],
            ["blue", "#6677ff"]
        ]);

        this.shapes = new Map<string, string>([
            ["bookmark", "bookmark"],
            ["circle", "circle"],
            ["heart", "heart"],
            ["label", "label"],
            ["star", "star"]
        ]);

        this.unicodeMarkers = new Map<string, string>([
            ["poop", "💩"],
            ["neutral face", "😐"],
            ["skull", "💀"],
            ["thumbs up", "👍"],
            ["thumbs down", "👎"],
            ["snail", "🐌"],
            ["bug", "🐞"],
            ["biohazard", "☣"],
            ["mac command", "⌘"],
            ["yin yang", "☯"]
        ]);

        for (let [name, color] of this.colors) {
            this.colors.set(name, DecorationFactory.normalizeColorFormat(color));
        }

        if (this.colors.size < 1) {
            this.colors.set("yellow", this.fallbackColor);
        }

        this.displayActiveGroupOnly = false;
        this.hideAll = false;

        this.cache = new Map<string, Map<TextEditorDecorationType, Array<Range>>>();

        this.restoreSettings();
        this.activateGroup(this.activeGroupName);
        this.saveSettings();
    }

    public saveSettings() {
        let serializedGroupMap = SerializableGroupMap.fromGroupMap(this.groups);
        this.ctx.workspaceState.update(this.savedGroupsKey, serializedGroupMap);
        this.ctx.workspaceState.update(this.savedActiveGroupKey, this.activeGroupName);
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
                let group = this.groups.get(this.activeGroupName);
                if (typeof group === "undefined") {
                    return;
                }

                if (textEditor.selections.length === 0) {
                    return;
                }

                let documentFsPath = textEditor.document.uri.fsPath;
                for (let selection of textEditor.selections) {
                    let lineNumber = selection.start.line;
                    group.toggleBookmark(documentFsPath, lineNumber);
                }

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

                let activeGroup = this.groups.get(this.activeGroupName);
                if (typeof activeGroup === "undefined") {
                    return;
                }

                let existingLabel = activeGroup.getBookmarkByPosition(documentFsPath, lineNumber);
                if (typeof existingLabel !== "undefined") {
                    activeGroup.deleteLabeledBookmark(existingLabel);
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
                    let groupName = "";

                    let separatorPos = input.indexOf(this.groupSeparator);
                    if (separatorPos >= 0) {
                        label = input.substring(0, separatorPos).trim();
                        groupName = input.substring(separatorPos + 1).trim();
                    } else {
                        label = input;
                    }

                    if (label === "" && groupName === "") {
                        return;
                    }

                    if (groupName.length > this.maxGroupNameLength) {
                        vscode.window.showErrorMessage(
                            "Choose a maximum " +
                            this.maxGroupNameLength +
                            " character long group name."
                        );
                        return;
                    }

                    if (groupName !== "") {
                        this.activateGroup(groupName);
                    }

                    if (label !== "") {
                        let activeGroup = this.groups.get(this.activeGroupName);
                        if (typeof activeGroup !== "undefined") {
                            activeGroup.addLabeledBookmark(label, documentFsPath, lineNumber);
                        }
                    }

                    this.saveSettings();
                });
            });
        this.ctx.subscriptions.push(disposable);
    }

    public registerNavigateToBookmark() {
        let disposable = vscode.commands.registerTextEditorCommand(
            'vsc-labeled-bookmarks.navigateToBookmark',
            () => {
                let pickItems = new Array<BookmarkPickItem>();
                let activeGroup = this.groups.get(this.activeGroupName);

                if (typeof activeGroup === "undefined") {
                    return;
                }

                for (let [label, bookmark] of activeGroup.bookmarks) {
                    pickItems.push(BookmarkPickItem.fromBookmark(bookmark));
                }

                vscode.window.showQuickPick(
                    pickItems,
                    {
                        canPickMany: false,
                        matchOnDescription: true,
                        placeHolder: "navigate to bookmark"
                    }
                ).then(selected => {
                    if (typeof selected !== "undefined") {
                        vscode.workspace.openTextDocument(selected.bookmark.fsPath).then(document => {
                            vscode.window.showTextDocument(document, { preview: false }).then(textEditor => {
                                let range = textEditor.document.lineAt(selected.bookmark.line).range;
                                textEditor.selection = new vscode.Selection(range.start, range.start);
                                textEditor.revealRange(range);
                            });
                        });
                    }
                    this.saveSettings();
                });
            });
        this.ctx.subscriptions.push(disposable);
    }

    public registerSetGroupIconShape() {
        let disposable = vscode.commands.registerTextEditorCommand(
            'vsc-labeled-bookmarks.setGroupIconShape',
            () => {
                let activeGroup = this.groups.get(this.activeGroupName);

                if (typeof activeGroup === "undefined") {
                    return;
                }
                let iconText = activeGroup.iconText;

                let shapePickItems = new Array<ShapePickItem>();
                for (let [label, id] of this.shapes) {
                    label = (activeGroup.shape === id ? "● " : "◌ ") + label;
                    shapePickItems.push(new ShapePickItem(id, iconText, label, "built in", ""));
                }

                for (let [name, marker] of this.unicodeMarkers) {
                    let label = (activeGroup.shape === "unicode" && activeGroup.iconText === marker ? "● " : "◌ ");
                    label += marker + " " + name;
                    shapePickItems.push(new ShapePickItem("unicode", marker, label, "unicode", ""));
                }

                vscode.window.showQuickPick(
                    shapePickItems,
                    {
                        canPickMany: false,
                        matchOnDescription: false,
                        placeHolder: "select group icon shape"
                    }
                ).then(selected => {
                    if (typeof selected !== "undefined") {
                        let activeGroup = this.groups.get(this.activeGroupName);

                        if (typeof activeGroup === "undefined") {
                            return;
                        }

                        let shape = (selected as ShapePickItem).shape;
                        let iconText = (selected as ShapePickItem).iconText;
                        activeGroup.setShape(shape, iconText);
                        this.saveSettings();
                    }
                });
            });
        this.ctx.subscriptions.push(disposable);
    }

    public registerSetGroupIconColor() {
        let disposable = vscode.commands.registerTextEditorCommand(
            'vsc-labeled-bookmarks.setGroupIconColor',
            () => {
                let activeGroup = this.groups.get(this.activeGroupName);

                if (typeof activeGroup === "undefined") {
                    return;
                }

                let colorPickItems = new Array<ColorPickItem>();
                for (let [name, color] of this.colors) {
                    let label = (activeGroup.color === color ? "● " : "◌ ") + name;

                    colorPickItems.push(new ColorPickItem(color, label, "", ""));
                }

                vscode.window.showQuickPick(
                    colorPickItems,
                    {
                        canPickMany: false,
                        matchOnDescription: false,
                        placeHolder: "select group icon color"
                    }
                ).then(selected => {
                    if (typeof selected !== "undefined") {
                        let activeGroup = this.groups.get(this.activeGroupName);

                        if (typeof activeGroup === "undefined") {
                            return;
                        }
                        let color = (selected as ColorPickItem).color;
                        activeGroup.setColor(color);
                        this.saveSettings();
                    }
                });
            });
        this.ctx.subscriptions.push(disposable);
    }

    public registerSelectGroup() {
        let disposable = vscode.commands.registerTextEditorCommand(
            'vsc-labeled-bookmarks.selectGroup',
            () => {
                let pickItems = new Array<GroupPickItem>();
                for (let [name, group] of this.groups) {
                    pickItems.push(GroupPickItem.fromGroup(group));
                }

                vscode.window.showQuickPick(
                    pickItems,
                    {
                        canPickMany: false,
                        matchOnDescription: false,
                        placeHolder: "select bookmark group"
                    }
                ).then(selected => {
                    if (typeof selected !== "undefined") {
                        this.activateGroup((selected as GroupPickItem).group.name);
                        this.saveSettings();
                    }
                });
            });
        this.ctx.subscriptions.push(disposable);
    }

    public registerAddGroup() {
        let disposable = vscode.commands.registerTextEditorCommand(
            'vsc-labeled-bookmarks.addGroup',
            () => {

                vscode.window.showInputBox({
                    placeHolder: "group name",
                    prompt: "Enter group name to create or switch to"
                }).then(groupName => {
                    if (typeof groupName === "undefined") {
                        return;
                    }

                    groupName = groupName.trim();
                    if (groupName === "") {
                        return;
                    }

                    if (groupName.length > this.maxGroupNameLength) {
                        vscode.window.showErrorMessage(
                            "Choose a maximum " +
                            this.maxGroupNameLength +
                            " character long group name."
                        );
                        return;
                    }

                    this.activateGroup(groupName);
                    this.saveSettings();
                });
            });
        this.ctx.subscriptions.push(disposable);
    }

    public registerDeleteGroup() {
        let disposable = vscode.commands.registerTextEditorCommand(
            'vsc-labeled-bookmarks.deleteGroup',
            () => {
                let pickItems = new Array<GroupPickItem>();
                for (let [name, group] of this.groups) {
                    pickItems.push(GroupPickItem.fromGroup(group));
                }

                vscode.window.showQuickPick(
                    pickItems,
                    {
                        canPickMany: true,
                        matchOnDescription: false,
                        placeHolder: "select bookmark groups to be deleted"
                    }
                ).then(selecteds => {
                    if (typeof selecteds !== "undefined") {
                        for (let selected of selecteds) {
                            let group = (selected as GroupPickItem).group;
                            group.truncateBookmarks();
                            this.groups.delete(group.name);
                        }

                        if (!this.groups.has(this.activeGroupName)) {
                            for (let [name, group] of this.groups) {
                                this.activateGroup(name);
                                this.saveSettings();
                                return;
                            }
                        }

                        this.activateGroup(this.defaultGroupName);
                        this.saveSettings();
                    }
                });
            });
        this.ctx.subscriptions.push(disposable);
    }

    public registerDeleteBookmark() {
        let disposable = vscode.commands.registerTextEditorCommand(
            'vsc-labeled-bookmarks.deleteBookmark',
            () => {
                let activeGroup = this.groups.get(this.activeGroupName);
                if (typeof activeGroup === "undefined") {
                    return;
                }

                let pickItems = new Array<BookmarkDeletePickItem>();
                for (let [index, bookmark] of activeGroup.bookmarks) {
                    pickItems.push(BookmarkDeletePickItem.fromGroupEntry(index, bookmark));
                }

                vscode.window.showQuickPick(
                    pickItems,
                    {
                        canPickMany: true,
                        matchOnDescription: false,
                        placeHolder: "select bookmarks to be deleted"
                    }
                ).then(selecteds => {
                    if (typeof selecteds !== "undefined") {
                        let activeGroup = this.groups.get(this.activeGroupName);
                        if (typeof activeGroup === "undefined") {
                            return;
                        }

                        for (let selected of selecteds) {
                            let index = (selected as BookmarkDeletePickItem).index;
                            activeGroup.deleteLabeledBookmark(index);
                        }
                        this.saveSettings();
                    }
                });
            });
        this.ctx.subscriptions.push(disposable);
    }

    public fileChanged(fsPath: string) {
        this.cache.delete(fsPath);

        for (let editor of vscode.window.visibleTextEditors) {
            if (editor.document.uri.fsPath === fsPath) {
                this.updateDecorations(editor);
            }
        }
    }

    public groupChanged(group: Group) {
        for (let [label, bookmark] of group.bookmarks) {
            this.cache.delete(bookmark.fsPath);
        }

        for (let editor of vscode.window.visibleTextEditors) {
            this.updateDecorations(editor);
        }
    }

    public decorationDropped(decoration: TextEditorDecorationType) {
        for (let editor of vscode.window.visibleTextEditors) {
            editor.setDecorations(decoration, []);
        }
    }

    private restoreSettings() {
        this.displayActiveGroupOnly =
            this.ctx.workspaceState.get(this.savedDisplayActiveGroupOnlyKey) ?? false;

        this.hideAll = this.ctx.workspaceState.get(this.savedHideAllKey) ?? false;

        this.activeGroupName = this.ctx.workspaceState.get(this.savedActiveGroupKey) ?? this.defaultGroupName;
        let serializedGroupMap: SerializableGroupMap | undefined = this.ctx.workspaceState.get(this.savedGroupsKey);

        this.groups = new Map<string, Group>();
        if (typeof serializedGroupMap !== "undefined") {
            try {
                this.groups = SerializableGroupMap.toGroupMap(this, serializedGroupMap);
            } catch (e) {
                vscode.window.showErrorMessage("Restoring bookmarks failed (" + e + ")");
            }
        }
    }

    private activateGroup(name: string) {
        let activeGroup = this.groups.get(this.activeGroupName);
        if (typeof activeGroup !== "undefined") {
            activeGroup.setIsActive(false);
        }

        this.ensureGroup(name);
        let newActiveGroup = this.groups.get(name);
        if (typeof newActiveGroup !== "undefined") {
            newActiveGroup.setIsActive(true);
        }
        this.activeGroupName = name;

        this.cacheReset();
    }

    private ensureGroup(name: string) {
        if (this.groups.has(name)) {
            return;
        }

        let group = new Group(this, name, this.getLeastUsedColor(), this.defaultShape, name);
        this.groups.set(name, group);
    }

    private getLeastUsedColor(): string {
        if (this.colors.size < 1) {
            return this.fallbackColor;
        }

        let usages = new Map<string, number>();

        for (let [index, color] of this.colors) {
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

    private setDisplayActiveGroupOnly(displayActiveGroupOnly: boolean) {
        if (this.displayActiveGroupOnly !== displayActiveGroupOnly) {
            this.cacheReset();
        }
        this.displayActiveGroupOnly = displayActiveGroupOnly;
    }

    private cacheReset() {
        this.cache = new Map<string, Map<TextEditorDecorationType, Array<Range>>>();
    }

    private getCachedDecorations(fsPath: string): Map<TextEditorDecorationType, Array<Range>> {
        if (this.hideAll) {
            return new Map<TextEditorDecorationType, Array<Range>>();
        }

        let cached = this.cache.get(fsPath);
        if (typeof cached !== "undefined") {
            return cached;
        }

        let result = new Map<TextEditorDecorationType, Array<Range>>();

        let linesTaken = new Map<Number, boolean>();
        let theActiveGroup = this.groups.get(this.activeGroupName);

        if (typeof theActiveGroup !== "undefined") {
            let bookmarks = theActiveGroup.getBookmarksOfFsPath(fsPath);
            for (let bookmark of bookmarks) {
                linesTaken.set(bookmark.line, true);
            }
        }

        for (let [name, group] of this.groups) {
            let decorationShown: TextEditorDecorationType;
            let decorationHidden: TextEditorDecorationType;

            if (
                group.decoration === DecorationFactory.fallbackDecoration
                || group.inactiveDecoration === DecorationFactory.fallbackDecoration
            ) {
                continue;
            }

            if (group.isActive) {
                decorationShown = group.decoration;
                decorationHidden = group.inactiveDecoration;
            } else {
                decorationShown = group.inactiveDecoration;
                decorationHidden = group.decoration;
            }

            result.set(decorationHidden, []);

            let ranges: Array<Range> = [];
            let bookmarks = group.getBookmarksOfFsPath(fsPath);
            for (let bookmark of bookmarks) {
                if (name !== this.activeGroupName && linesTaken.has(bookmark.line)) {
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