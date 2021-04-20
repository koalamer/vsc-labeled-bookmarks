import * as vscode from 'vscode';
import { Group } from "./group";
import { SerializableGroupMap } from './serializable_group_map';
import {
    ExtensionContext, FileDeleteEvent, FileRenameEvent, Position, Range,
    StatusBarItem,
    TextDocumentChangeEvent, TextEditor, TextEditorDecorationType
} from 'vscode';
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
    public readonly savedGroupsKey = "vscLabeledBookmarks.groups2";
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
    public activeGroup: Group;
    public fallbackColor: string;

    public colors: Map<string, string>;
    public unicodeMarkers: Map<string, string>;
    public readonly shapes: Map<string, string>;
    public defaultShape = "bookmark";

    public hideInactiveGroups: boolean;
    public hideAll: boolean;

    private fileDecorationCache: Map<string, Map<TextEditorDecorationType, Array<Range>>>;
    private fileBookmarkPositionCache: Map<string, Array<FileBookmarkListItem>>;

    private statusBarItem: StatusBarItem;

    private decorationDirtyFiles: Map<string, boolean>;
    private removedDecorations: Map<TextEditorDecorationType, boolean>;

    constructor(ctx: ExtensionContext) {
        this.ctx = ctx;
        Group.svgDir = this.ctx.globalStorageUri;
        DecorationFactory.svgDir = this.ctx.globalStorageUri;

        this.groups = new Map<string, Group>();
        this.defaultGroupName = "default";
        this.fallbackColor = "ffee66ff";
        this.activeGroup = new Group(this, this.defaultGroupName, this.fallbackColor, this.defaultShape, "", 0);

        this.colors = new Map<string, string>();
        this.unicodeMarkers = new Map<string, string>();
        this.shapes = new Map<string, string>([
            ["bookmark", "bookmark"],
            ["circle", "circle"],
            ["heart", "heart"],
            ["label", "label"],
            ["star", "star"]
        ]);

        this.decorationDirtyFiles = new Map<string, boolean>();
        this.removedDecorations = new Map<TextEditorDecorationType, boolean>();

        this.readConfig();

        if (this.colors.size < 1) {
            this.colors.set("yellow", DecorationFactory.normalizeColorFormat(this.fallbackColor));
        }

        this.hideInactiveGroups = false;
        this.hideAll = false;

        this.fileDecorationCache = new Map<string, Map<TextEditorDecorationType, Array<Range>>>();
        this.fileBookmarkPositionCache = new Map<string, Array<FileBookmarkListItem>>();

        this.restoreSettings();

        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);
        this.statusBarItem.command = 'vsc-labeled-bookmarks.selectGroup';
        this.statusBarItem.show();

        this.saveSettings();
    }

    public saveSettings() {
        let serializedGroupMap = SerializableGroupMap.fromGroupMap(this.groups);
        this.ctx.workspaceState.update(this.savedGroupsKey, serializedGroupMap);
        this.ctx.workspaceState.update(this.savedActiveGroupKey, this.activeGroup.name);
        this.ctx.workspaceState.update(this.savedHideInactiveGroupsKey, this.hideInactiveGroups);
        this.ctx.workspaceState.update(this.savedHideAllKey, this.hideAll);

        this.updateStatusBar();
    }

    public updateEditorDecorations(textEditor: TextEditor | undefined) {
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

    public onEditorDocumentChanged(event: TextDocumentChangeEvent) {
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
                    if (item.bookmark.lineNumber > shiftBelowLine) {
                        item.bookmark.lineNumber += shiftDownBy;
                        visualsChanged = true;
                    }
                }
                if (visualsChanged) {
                    this.addDecorationDirtyFile(fsPath);
                    this.saveSettings();
                }
                continue;
            }

            if (newLines < oldLines) {
                let deleteBelowLine = firstLine + newLines;
                let shiftBelowLine = firstLine + oldLines;
                let shiftUpBy = oldLines - newLines;

                let visualsChanged = false;
                for (let item of fileBookmarkList) {
                    if (item.bookmark.lineNumber > shiftBelowLine) {
                        item.bookmark.lineNumber -= shiftUpBy;
                        visualsChanged = true;
                        continue;
                    }
                    if (item.bookmark.lineNumber > deleteBelowLine) {
                        this.groups.get(item.groupName)?.deleteLabeledBookmark(item.bookmarkLabel);
                        this.fileBookmarkPositionCache.delete(fsPath);
                        visualsChanged = true;
                    }
                }

                if (visualsChanged) {
                    this.addDecorationDirtyFile(fsPath);
                    this.saveSettings();
                }

                continue;
            }
        }

        this.updateDecorations();
    }

    public editorActionToggleBookmark(textEditor: TextEditor) {
        if (textEditor.selections.length === 0) {
            return;
        }

        let documentFsPath = textEditor.document.uri.fsPath;
        for (let selection of textEditor.selections) {
            let lineNumber = selection.start.line;
            let characterNumber = selection.start.character;
            let lineText = textEditor.document.getText(
                new Range(new Position(lineNumber, 0), new Position(lineNumber + 1, 0))
            ).trim();
            this.activeGroup.toggleBookmark(
                documentFsPath,
                lineNumber,
                characterNumber,
                lineText
            );
        }

        this.updateDecorations();
        this.saveSettings();
    }

    public editorActionToggleLabeledBookmark(textEditor: TextEditor) {
        if (textEditor.selections.length === 0) {
            return;
        }

        let lineNumber = textEditor.selection.start.line;
        let documentFsPath = textEditor.document.uri.fsPath;

        let existingLabel = this.activeGroup.getBookmarkByPosition(documentFsPath, lineNumber);
        if (typeof existingLabel !== "undefined") {
            this.activeGroup.deleteLabeledBookmark(existingLabel);
            this.saveSettings();
            return;
        }

        let selectedText = textEditor.document.getText(textEditor.selection)
            .trim()
            .replace(/[\s\t\r\n]+/, " ")
            .replace("@", "(a)");
        vscode.window.showInputBox({
            placeHolder: "label or label@group or @group",
            prompt: "Enter label and/or group to be created",
            value: selectedText,
            valueSelection: [0, selectedText.length],
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
                let characterNumber = textEditor.selection.start.character;
                let lineText = textEditor.document.getText(
                    new Range(new Position(lineNumber, 0), new Position(lineNumber + 1, 0))
                ).trim();

                this.activeGroup.addLabeledBookmark(
                    documentFsPath,
                    lineNumber,
                    characterNumber,
                    lineText,
                    label
                );
            }

            this.updateDecorations();
            this.saveSettings();
        });
    }

    public editorActionnavigateToNextBookmark(textEditor: TextEditor) {
        if (textEditor.selections.length === 0) {
            return;
        }

        let documentFsPath = textEditor.document.uri.fsPath;
        let lineNumber = textEditor.selection.start.line;

        let nextBookmark = this.activeGroup.nextBookmark(documentFsPath, lineNumber);
        if (typeof nextBookmark === "undefined") {
            return;
        }

        this.jumpToBookmark(nextBookmark);
    }

    public editorActionNavigateToPreviousBookmark(textEditor: TextEditor) {
        if (textEditor.selections.length === 0) {
            return;
        }

        let documentFsPath = textEditor.document.uri.fsPath;
        let lineNumber = textEditor.selection.start.line;

        let previousBookmark = this.activeGroup.previousBookmark(documentFsPath, lineNumber);
        if (typeof previousBookmark === "undefined") {
            return;
        }

        this.jumpToBookmark(previousBookmark);
    }

    public actionNavigateToBookmark() {
        let pickItems = new Array<BookmarkPickItem>();

        for (let [label, bookmark] of this.activeGroup.bookmarks) {
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
        });
    }

    public actionNavigateToBookmarkOfAnyGroup() {
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
                placeHolder: "navigate to bookmark of any bookmark group"
            }
        ).then(selected => {
            if (typeof selected !== "undefined") {
                this.jumpToBookmark(selected.bookmark);
            }
        });
    }

    public actionSetGroupIconShape() {
        let iconText = this.activeGroup.iconText;

        let shapePickItems = new Array<ShapePickItem>();
        for (let [label, id] of this.shapes) {
            label = (this.activeGroup.shape === id ? "● " : "◌ ") + label;
            shapePickItems.push(new ShapePickItem(id, iconText, label, "vector", ""));
        }

        for (let [name, marker] of this.unicodeMarkers) {
            let label = (this.activeGroup.shape === "unicode" && this.activeGroup.iconText === marker ? "● " : "◌ ");
            label += marker + " " + name;
            shapePickItems.push(new ShapePickItem("unicode", marker, label, "unicode", ""));
        }

        vscode.window.showQuickPick(
            shapePickItems,
            {
                canPickMany: false,
                matchOnDescription: false,
                placeHolder: "select bookmark group icon shape"
            }
        ).then(selected => {
            if (typeof selected !== "undefined") {
                let shape = (selected as ShapePickItem).shape;
                let iconText = (selected as ShapePickItem).iconText;
                this.activeGroup.setShape(shape, iconText);
                this.saveSettings();
            }
        });
    }

    public actionSetGroupIconColor() {
        let colorPickItems = new Array<ColorPickItem>();
        for (let [name, color] of this.colors) {
            let label = (this.activeGroup.color === color ? "● " : "◌ ") + name;

            colorPickItems.push(new ColorPickItem(color, label, "", ""));
        }

        vscode.window.showQuickPick(
            colorPickItems,
            {
                canPickMany: false,
                matchOnDescription: false,
                placeHolder: "select bookmark group icon color"
            }
        ).then(selected => {
            if (typeof selected !== "undefined") {
                let color = (selected as ColorPickItem).color;
                this.activeGroup.setColor(color);
                this.saveSettings();
            }
        });
    }

    public actionSelectGroup() {
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
                this.updateDecorations();
                this.saveSettings();
            }
        });
    }

    public actionAddGroup() {
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
            this.updateDecorations();
            this.saveSettings();
        });
    }

    public actionDeleteGroup() {
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
                let activeGroupName = this.activeGroup.name;

                for (let selected of selecteds) {
                    let group = (selected as GroupPickItem).group;
                    group.truncateBookmarks();
                    this.groups.delete(group.name);
                }

                if (this.groups.size === 0) {
                    this.activateGroup(this.defaultGroupName);
                    this.updateDecorations();
                    this.saveSettings();
                    return;
                }

                if (!this.groups.has(activeGroupName)) {
                    for (let [name, group] of this.groups) {
                        this.activateGroup(name);
                        this.updateDecorations();
                        this.saveSettings();
                        return;
                    }
                }

                this.updateDecorations();
                this.saveSettings();
            }
        });
    }

    public actionDeleteBookmark() {
        let pickItems = new Array<BookmarkDeletePickItem>();
        for (let [index, bookmark] of this.activeGroup.bookmarks) {
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
                for (let selected of selecteds) {
                    let index = (selected as BookmarkDeletePickItem).index;
                    this.activeGroup.deleteLabeledBookmark(index);
                }
                this.updateDecorations();
                this.saveSettings();
            }
        });
    }

    public actionToggleHideAll() {
        this.setHideAll(!this.hideAll);
        this.updateDecorations();
        this.saveSettings();
    }

    public actionToggleHideInactiveGroups() {
        this.setHideInactiveGroups(!this.hideInactiveGroups);
        this.updateDecorations();
        this.saveSettings();
    }

    public actionClearFailedJumpFlags() {
        let clearedFlagCount = 0;
        for (let [name, group] of this.groups) {
            for (let [label, bookmark] of group.bookmarks) {
                if (bookmark.invalid) {
                    bookmark.invalid = false;
                    clearedFlagCount++;
                }
            }
        }

        vscode.window.showInformationMessage("Cleared broken bookmark flags: " + clearedFlagCount);
        this.saveSettings();
    }

    public addDecorationDirtyFile(fsPath: string) {
        this.decorationDirtyFiles.set(fsPath, true);
    }

    private handleDecorationDirtyFiles() {
        for (let [fsPath, b] of this.decorationDirtyFiles) {
            this.fileDecorationCache.delete(fsPath);
        }
    }

    private updateDecorations() {
        this.handleDecorationDirtyFiles();
        this.decorationDirtyFiles.clear();

        for (let editor of vscode.window.visibleTextEditors) {
            for (let [decoration, b] of this.removedDecorations) {
                editor.setDecorations(decoration, []);
            }
        }
        this.removedDecorations.clear();

        for (let editor of vscode.window.visibleTextEditors) {
            this.updateEditorDecorations(editor);
        }
    }

    public groupDecorationReady() {
        this.updateDecorations();
    }

    public decorationDropped(decoration: TextEditorDecorationType) {
        this.removedDecorations.set(decoration, true);
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

    public async onFilesRenamed(fileRenamedEvent: FileRenameEvent) {
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

        if (changedFiles.size > 0) {
            this.saveSettings();
        }

        for (let [changedFile, b] of changedFiles) {
            this.addDecorationDirtyFile(changedFile);
        }
    }

    public async onFilesDeleted(fileDeleteEvent: FileDeleteEvent) {
        for (let uri of fileDeleteEvent.files) {
            let deletedFsPath = uri.fsPath;


            let changesWereMade = false;
            for (let [name, group] of this.groups) {
                for (let [label, bookmark] of group.bookmarks) {
                    if (bookmark.fsPath === deletedFsPath) {
                        group.deleteLabeledBookmark(label);
                        changesWereMade = true;
                    }
                }
            }

            if (changesWereMade) {
                this.saveSettings();
            }
        }
    }

    private updateStatusBar() {
        this.statusBarItem.text = "$(bookmark) " + this.activeGroup.bookmarks.size + " in " + this.activeGroup.name;

        let hideStatus = "";
        if (this.hideAll) {
            hideStatus = ", all hidden";
        } else if (this.hideInactiveGroups) {
            hideStatus = ", inactive groups hidden";
        } else {
            hideStatus = ", all visible";
        }
        this.statusBarItem.tooltip = this.groups.size + " group(s)" + hideStatus;
    }

    private restoreSettings() {
        this.hideInactiveGroups =
            this.ctx.workspaceState.get(this.savedHideInactiveGroupsKey) ?? false;

        this.hideAll = this.ctx.workspaceState.get(this.savedHideAllKey) ?? false;

        let activeGroupName: string = this.ctx.workspaceState.get(this.savedActiveGroupKey) ?? this.defaultGroupName;
        let serializedGroupMap: SerializableGroupMap | undefined = this.ctx.workspaceState.get(this.savedGroupsKey);

        this.groups = new Map<string, Group>();
        if (typeof serializedGroupMap !== "undefined") {
            try {
                this.groups = SerializableGroupMap.toGroupMap(this, serializedGroupMap);
            } catch (e) {
                vscode.window.showErrorMessage("Restoring bookmarks failed (" + e + ")");
            }
        }

        this.activateGroup(activeGroupName);
    }

    private activateGroup(name: string) {
        this.activeGroup.setIsActive(false);

        let newActiveGroup = this.ensureGroup(name);
        this.activeGroup = newActiveGroup;
        newActiveGroup.setIsActive(true);

        this.fileDecorationCache.clear();
    }

    private ensureGroup(name: string): Group {
        let existingGroup = this.groups.get(name);
        if (typeof existingGroup !== "undefined") {
            return existingGroup;
        }

        let group = new Group(this, name, this.getLeastUsedColor(), this.defaultShape, name, 0);
        this.groups.set(name, group);
        return group;
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

        this.fileDecorationCache.clear();
    }

    private setHideAll(hideAll: boolean) {
        if (this.hideAll === hideAll) {
            return;
        }

        this.hideAll = hideAll;

        this.fileDecorationCache.clear();
    }


    private getCachedDecorations(fsPath: string): Map<TextEditorDecorationType, Array<Range>> {
        let cached = this.fileDecorationCache.get(fsPath);
        if (typeof cached !== "undefined") {
            return cached;
        }

        let result = new Map<TextEditorDecorationType, Array<Range>>();

        let linesTaken = new Map<Number, boolean>();

        let bookmarks = this.activeGroup.getBookmarksOfFsPath(fsPath);
        for (let bookmark of bookmarks) {
            linesTaken.set(bookmark.lineNumber, true);
        }

        for (let [name, group] of this.groups) {
            let decorationShown: TextEditorDecorationType;
            let decorationHidden: TextEditorDecorationType;

            if (!group.areAllDecorationsReady()) {
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
                if (group !== this.activeGroup && linesTaken.has(bookmark.lineNumber)) {
                    continue;
                }

                linesTaken.set(bookmark.lineNumber, true);
                ranges.push(new Range(bookmark.lineNumber, 0, bookmark.lineNumber, 0));
            }

            result.set(decorationShown, ranges);
        }

        this.fileDecorationCache.set(fsPath, result);
        return result;
    }

    private getCachedFileBookmarks(fsPath: string): Array<FileBookmarkListItem> {
        let cached = this.fileBookmarkPositionCache.get(fsPath);
        if (typeof cached !== "undefined") {
            return cached;
        }

        let result = new Array<FileBookmarkListItem>();

        for (let [name, group] of this.groups) {
            //group.getBookmarksOfFsPath[]
            for (let [label, bookmark] of group.bookmarks) {
                if (bookmark.fsPath === fsPath) {
                    result.push(new FileBookmarkListItem(name, label, bookmark));
                }
            }
        }

        this.fileBookmarkPositionCache.set(fsPath, result);
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
                            let range = textEditor.document.lineAt(bookmark.lineNumber).range;
                            textEditor.selection = new vscode.Selection(range.start, range.start);
                            textEditor.revealRange(range);
                        } catch (e) {
                            bookmark.invalid = true;
                            vscode.window.showWarningMessage("Failed to navigate to bookmark (3): " + e);
                            this.saveSettings();
                            return;
                        }
                        bookmark.invalid = false;
                    },
                    rejectReason => {
                        bookmark.invalid = true;
                        this.saveSettings();
                        vscode.window.showWarningMessage("Failed to navigate to bookmark (2): " + rejectReason.message);
                    }
                );
            },
            rejectReason => {
                bookmark.invalid = true;
                this.saveSettings();
                vscode.window.showWarningMessage("Failed to navigate to bookmark (1): " + rejectReason.message);
            }
        );
    }
}