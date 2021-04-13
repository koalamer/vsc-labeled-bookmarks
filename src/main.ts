import * as vscode from 'vscode';
import { Group } from "./group";
import { SerializableGroupMap } from './serializable_group_map';
import { ExtensionContext, FileRenameEvent, Range, TextDocumentChangeEvent, TextEditor, TextEditorDecorationType } from 'vscode';
import { DecorationFactory } from './decoration_factory';
import { GroupPickItem } from './group_pick_item';
import { BookmarkPickItem } from './bookmark_pick_item';
import { BookmarkDeletePickItem } from './bookmark_delete_pick_item';
import { ShapePickItem } from './shape_pick_item';
import { ColorPickItem } from './color_pick_item';
import { FileBookmarkListItem } from './file_bookmark_list_item';
import { Bookmark } from "./bookmark";

export class Main {
    public ctx: ExtensionContext;
    public readonly savedGroupsKey = "vscLabeledBookmarks.groups";
    public readonly savedActiveGroupKey = "vscLabeledBookmarks.activeGroup";
    public readonly savedHideInactiveGroupsKey = "vscLabeledBookmarks.hideInactiveGroups";
    public readonly savedHideAllKey = "vscLabeledBookmarks.hideAll";

    public readonly configRoot = "labeledBookmarks";
    public readonly configKeyColors = "colors";
    public readonly configKeyUnicodeMarkers = "unicodeMarkers";
    public readonly configKeyDefaultShape = "defaultShape";

    public readonly groupSeparator = "@";
    public readonly maxGroupNameLength = 40;

    public readonly defaultGroupName: string;

    public groups: Map<string, Group>;
    public activeGroupName: string;
    public fallbackColor: string;

    public colors: Map<string, string>;
    public unicodeMarkers: Map<string, string>;
    public readonly shapes: Map<string, string>;
    public defaultShape = "bookmark";

    public hideInactiveGroups: boolean;
    public hideAll: boolean;

    private decorationCache: Map<string, Map<TextEditorDecorationType, Array<Range>>>;
    private fileBookmarkCache: Map<string, Array<FileBookmarkListItem>>;

    constructor(ctx: ExtensionContext) {
        this.ctx = ctx;
        Group.svgDir = this.ctx.globalStorageUri;
        DecorationFactory.svgDir = this.ctx.globalStorageUri;

        this.groups = new Map<string, Group>();
        this.defaultGroupName = "default";
        this.activeGroupName = this.defaultGroupName;
        this.fallbackColor = "ffee66ff";

        this.colors = new Map<string, string>();
        this.unicodeMarkers = new Map<string, string>();
        this.shapes = new Map<string, string>([
            ["bookmark", "bookmark"],
            ["circle", "circle"],
            ["heart", "heart"],
            ["label", "label"],
            ["star", "star"]
        ]);

        this.readConfig();


        if (this.colors.size < 1) {
            this.colors.set("yellow", DecorationFactory.normalizeColorFormat(this.fallbackColor));
        }

        this.hideInactiveGroups = false;
        this.hideAll = false;

        this.decorationCache = new Map<string, Map<TextEditorDecorationType, Array<Range>>>();
        this.fileBookmarkCache = new Map<string, Array<FileBookmarkListItem>>();

        this.restoreSettings();
        this.activateGroup(this.activeGroupName);
        this.saveSettings();
    }

    public saveSettings() {
        let serializedGroupMap = SerializableGroupMap.fromGroupMap(this.groups);
        this.ctx.workspaceState.update(this.savedGroupsKey, serializedGroupMap);
        this.ctx.workspaceState.update(this.savedActiveGroupKey, this.activeGroupName);
        this.ctx.workspaceState.update(this.savedHideInactiveGroupsKey, this.hideInactiveGroups);
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

    public updateDecorationsOnDocumentChange(event: TextDocumentChangeEvent) {
        let fsPath = event.document.uri.fsPath;

        let fileBookmarkList = this.getCachedFileBookmarks(fsPath);
        if (fileBookmarkList.length === 0) {
            return;
        }

        for (let change of event.contentChanges) {
            let newLines = this.getNlCount(change.text);
            let oldLines = change.range.end.line - change.range.start.line;

            if (newLines === oldLines) {
                continue;
            }

            let firstLine = change.range.start.line;

            if (newLines > oldLines) {
                let shiftBelowLine = firstLine + oldLines;
                let shiftDownBy = newLines - oldLines;

                let visualsChanged = false;
                for (let item of fileBookmarkList) {
                    if (item.bookmark.line > shiftBelowLine) {
                        item.bookmark.line += shiftDownBy;
                        visualsChanged = true;
                    }
                }
                if (visualsChanged) {
                    this.fileChanged(fsPath, false);
                    this.saveSettings();
                }
                continue;
            }

            if (newLines < oldLines) {
                let deleteBelowLine = firstLine + newLines;
                let shiftBelowLine = firstLine + oldLines;
                let shiftUpBy = oldLines - newLines;

                let visualsChanged = false;
                let clearFileBookmarkCache = false;
                for (let item of fileBookmarkList) {
                    if (item.bookmark.line > shiftBelowLine) {
                        item.bookmark.line -= shiftUpBy;
                        visualsChanged = true;
                        continue;
                    }
                    if (item.bookmark.line > deleteBelowLine) {
                        this.groups.get(item.groupName)?.deleteLabeledBookmark(item.bookmarkLabel);
                        visualsChanged = true;
                        clearFileBookmarkCache = true;
                    }
                }

                if (visualsChanged) {
                    this.fileChanged(fsPath, clearFileBookmarkCache);
                    this.saveSettings();
                }

                continue;
            }
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

    public registerNavigateToNextBookmark() {
        let disposable = vscode.commands.registerTextEditorCommand(
            'vsc-labeled-bookmarks.navigateToNextBookmark',
            (textEditor) => {
                if (textEditor.selections.length === 0) {
                    return;
                }

                let documentFsPath = textEditor.document.uri.fsPath;
                let lineNumber = textEditor.selection.start.line;

                let activeGroup = this.groups.get(this.activeGroupName);
                if (typeof activeGroup === "undefined") {
                    return;
                }

                let nextBookmark = activeGroup.nextBookmark(documentFsPath, lineNumber);
                if (typeof nextBookmark === "undefined") {
                    return;
                }

                this.jumpToBookmark(nextBookmark);
            });
        this.ctx.subscriptions.push(disposable);
    }

    public registerNavigateToPreviousBookmark() {
        let disposable = vscode.commands.registerTextEditorCommand(
            'vsc-labeled-bookmarks.navigateToPreviousBookmark',
            (textEditor) => {
                if (textEditor.selections.length === 0) {
                    return;
                }

                let documentFsPath = textEditor.document.uri.fsPath;
                let lineNumber = textEditor.selection.start.line;

                let activeGroup = this.groups.get(this.activeGroupName);
                if (typeof activeGroup === "undefined") {
                    return;
                }

                let previousBookmark = activeGroup.previousBookmark(documentFsPath, lineNumber);
                if (typeof previousBookmark === "undefined") {
                    return;
                }

                this.jumpToBookmark(previousBookmark);
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
                pickItems.sort(BookmarkPickItem.sort);

                vscode.window.showQuickPick(
                    pickItems,
                    {
                        canPickMany: false,
                        matchOnDescription: true,
                        placeHolder: "navigate to bookmark"
                    }
                ).then(selected => {
                    if (typeof selected !== "undefined") {
                        this.jumpToBookmark(selected.bookmark);
                    }
                    this.saveSettings();
                });
            });
        this.ctx.subscriptions.push(disposable);
    }

    public registerNavigateToBookmarkOfAnyGroup() {
        let disposable = vscode.commands.registerTextEditorCommand(
            'vsc-labeled-bookmarks.navigateToBookmarkOfAnyGroup',
            () => {
                let pickItems = new Array<BookmarkPickItem>();

                for (let [name, group] of this.groups) {
                    for (let [label, bookmark] of group.bookmarks) {
                        pickItems.push(BookmarkPickItem.fromBookmark(bookmark, name));
                    }
                }
                pickItems.sort(BookmarkPickItem.sort);

                vscode.window.showQuickPick(
                    pickItems,
                    {
                        canPickMany: false,
                        matchOnDescription: true,
                        placeHolder: "navigate to bookmark"
                    }
                ).then(selected => {
                    if (typeof selected !== "undefined") {
                        this.jumpToBookmark(selected.bookmark);
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
                    shapePickItems.push(new ShapePickItem(id, iconText, label, "vector", ""));
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
                pickItems.sort(GroupPickItem.sort);

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
                pickItems.sort(GroupPickItem.sort);

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

                        if (this.groups.size === 0) {
                            this.activateGroup(this.defaultGroupName);
                            this.saveSettings();
                            return;
                        }

                        if (!this.groups.has(this.activeGroupName)) {
                            for (let [name, group] of this.groups) {
                                this.activateGroup(name);
                                this.saveSettings();
                                return;
                            }
                        }

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
                pickItems.sort(BookmarkDeletePickItem.sort);

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

    public registerToggleHideAll() {
        let disposable = vscode.commands.registerTextEditorCommand(
            'vsc-labeled-bookmarks.toggleHideAll',
            () => {
                this.setHideAll(!this.hideAll);
                this.saveSettings();
            });
        this.ctx.subscriptions.push(disposable);
    }

    public registerToggleHideInactiveGroups() {
        let disposable = vscode.commands.registerTextEditorCommand(
            'vsc-labeled-bookmarks.toggleHideInactiveGroups',
            () => {
                this.setHideInactiveGroups(!this.hideInactiveGroups);
                this.saveSettings();
            });
        this.ctx.subscriptions.push(disposable);
    }

    public fileChanged(fsPath: string, clearFileBookmarkCache: boolean = true) {
        this.decorationCache.delete(fsPath);
        if (clearFileBookmarkCache) {
            this.fileBookmarkCache.delete(fsPath);
        }

        for (let editor of vscode.window.visibleTextEditors) {
            if (editor.document.uri.fsPath === fsPath) {
                this.updateDecorations(editor);
            }
        }
    }

    public groupChanged(group: Group) {
        for (let [label, bookmark] of group.bookmarks) {
            this.decorationCache.delete(bookmark.fsPath);
            this.fileBookmarkCache.delete(bookmark.fsPath);
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

    public readConfig() {
        let defaultDefaultShape = "bookmark";

        let config = vscode.workspace.getConfiguration(this.configRoot);

        if (config.has(this.configKeyColors)) {
            try {
                let configColors = (config.get(this.configKeyColors) as Array<Array<string>>);
                this.colors = new Map<string, string>();
                for (let [index, value] of configColors) {
                    this.colors.set(index, DecorationFactory.normalizeColorFormat(value));
                }
            } catch (e) {
                vscode.window.showWarningMessage("Error reading bookmark color setting");
            }
        }

        if (config.has(this.configKeyUnicodeMarkers)) {
            try {
                let configMarkers = (config.get(this.configKeyUnicodeMarkers) as Array<Array<string>>);
                this.unicodeMarkers = new Map<string, string>();
                for (let [index, value] of configMarkers) {
                    this.unicodeMarkers.set(index, value);
                }
            } catch (e) {
                vscode.window.showWarningMessage("Error reading bookmark unicode marker setting");
            }
        }

        if (config.has(this.configKeyDefaultShape)) {
            let configDefaultShape = (config.get(this.configKeyDefaultShape) as string) ?? "";
            if (this.shapes.has(configDefaultShape)) {
                this.defaultShape = configDefaultShape;
            } else {
                vscode.window.showWarningMessage("Error reading bookmark default shape setting, using default");
                this.defaultShape = defaultDefaultShape;
            }
        } else {
            this.defaultShape = defaultDefaultShape;
        }
    }

    public async filesRenamed(fileRenamedEvent: FileRenameEvent) {
        let changedFiles = new Map<string, boolean>();

        for (let rename of fileRenamedEvent.files) {
            let stat = await vscode.workspace.fs.stat(rename.newUri);
            let oldFsPath = rename.oldUri.fsPath;
            let newFsPath = rename.newUri.fsPath;

            if ((stat.type & vscode.FileType.Directory) > 0) {
                for (let [name, group] of this.groups) {
                    for (let [label, bookmark] of group.bookmarks) {
                        if (bookmark.fsPath.startsWith(oldFsPath)) {
                            let originalBookmarkFsPath = bookmark.fsPath;
                            bookmark.fsPath = newFsPath + bookmark.fsPath.substring(oldFsPath.length);
                            changedFiles.set(originalBookmarkFsPath, true);
                            changedFiles.set(bookmark.fsPath, true);
                        }
                    }
                }
            } else {
                for (let [name, group] of this.groups) {
                    for (let [label, bookmark] of group.bookmarks) {
                        if (bookmark.fsPath === oldFsPath) {
                            bookmark.fsPath = newFsPath;
                            changedFiles.set(oldFsPath, true);
                            changedFiles.set(newFsPath, true);
                        }
                    }
                }
            }
        }

        for (let [changedFile, b] of changedFiles) {
            this.fileChanged(changedFile);
        }
    }

    private restoreSettings() {
        this.hideInactiveGroups =
            this.ctx.workspaceState.get(this.savedHideInactiveGroupsKey) ?? false;

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

        let group = new Group(this, name, this.getLeastUsedColor(), this.defaultShape, name, 0);
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

    private setHideInactiveGroups(hideInactiveGroups: boolean) {
        if (this.hideInactiveGroups === hideInactiveGroups) {
            return;
        }

        this.hideInactiveGroups = hideInactiveGroups;
        this.cacheReset();

        for (let editor of vscode.window.visibleTextEditors) {
            this.updateDecorations(editor);
        }
    }

    private setHideAll(hideAll: boolean) {
        if (this.hideAll === hideAll) {
            return;
        }

        this.hideAll = hideAll;
        this.cacheReset();

        for (let editor of vscode.window.visibleTextEditors) {
            this.updateDecorations(editor);
        }
    }


    private cacheReset() {
        this.decorationCache = new Map<string, Map<TextEditorDecorationType, Array<Range>>>();
    }

    private getCachedDecorations(fsPath: string): Map<TextEditorDecorationType, Array<Range>> {
        let cached = this.decorationCache.get(fsPath);
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

            if (!group.isDecorationReady()) {
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

            if (this.hideAll || (this.hideInactiveGroups && !group.isActive)) {
                result.set(decorationShown, []);
                continue;
            }

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

        this.decorationCache.set(fsPath, result);
        return result;
    }

    private getCachedFileBookmarks(fsPath: string): Array<FileBookmarkListItem> {
        let cached = this.fileBookmarkCache.get(fsPath);
        if (typeof cached !== "undefined") {
            return cached;
        }

        let result = new Array<FileBookmarkListItem>();

        for (let [name, group] of this.groups) {
            for (let [label, bookmark] of group.bookmarks) {
                if (bookmark.fsPath === fsPath) {
                    result.push(new FileBookmarkListItem(name, label, bookmark));
                }
            }
        }

        this.fileBookmarkCache.set(fsPath, result);
        return result;
    }

    private getNlCount(text: string) {
        let nlCount: number = 0;
        for (let c of text) {
            nlCount += (c === "\n") ? 1 : 0;
        }
        return nlCount;
    }

    private jumpToBookmark(bookmark: Bookmark) {
        vscode.workspace.openTextDocument(bookmark.fsPath).then(
            document => {
                vscode.window.showTextDocument(document, { preview: false }).then(
                    textEditor => {
                        try {
                            let range = textEditor.document.lineAt(bookmark.line).range;
                            textEditor.selection = new vscode.Selection(range.start, range.start);
                            textEditor.revealRange(range);
                        } catch (e) {
                            bookmark.failedJump = true;
                            vscode.window.showWarningMessage("Failed to navigate to bookmark (3): " + e);
                            return;
                        }
                        bookmark.failedJump = false;
                    },
                    rejectReason => {
                        bookmark.failedJump = true;
                        vscode.window.showWarningMessage("Failed to navigate to bookmark (2): " + rejectReason.message);
                    }
                );
            },
            rejectReason => {
                bookmark.failedJump = true;
                vscode.window.showWarningMessage("Failed to navigate to bookmark (1): " + rejectReason.message);
            }
        );
    }
}