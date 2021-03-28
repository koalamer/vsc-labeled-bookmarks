import * as vscode from 'vscode';
import { TextEditorDecorationType, Uri } from 'vscode';
import { Bookmark } from "./bookmark";

export class Group {
    static svgDir: Uri;

    static readonly normalTransparency: string = "ff";
    static readonly inactiveTransparency: string = "cc";

    label: string;
    color: string;
    inactiveColor: string;
    modifiedAt: Date;
    bookmarks: Map<string, Bookmark>;
    decoration?: TextEditorDecorationType;
    inactiveDecoration?: TextEditorDecorationType;

    private constructor(label: string, color: string, modifiedAt: Date) {
        this.label = label;
        this.color = color;
        this.ensureUsableColor();
        this.inactiveColor = this.color.substring(0, 6) + Group.inactiveTransparency;
        this.modifiedAt = modifiedAt;
        this.bookmarks = new Map<string, Bookmark>();
    }

    public static factory(label: string, color: string, modifiedAt: Date): Group {
        let result = new Group(label, color, modifiedAt);
        result.initDecorations();
        return result;
    }

    public getColor(): string {
        return this.color;
    }

    public async initDecorations() {
        let svgUri1 = Uri.joinPath(Group.svgDir, "bm_" + this.color + ".svg");
        this.decoration = vscode.window.createTextEditorDecorationType(
            {
                gutterIconPath: svgUri1,
                gutterIconSize: 'contain',
            }
        );

        let svgUri2 = Uri.joinPath(Group.svgDir, "bm_" + this.inactiveColor + ".svg");
        this.inactiveDecoration = vscode.window.createTextEditorDecorationType(
            {
                gutterIconPath: svgUri2,
                gutterIconSize: 'contain',
            }
        );

        vscode.workspace.fs.stat(svgUri1).then(stat => {
            if (stat.size < 1) {
                this.createSvg(svgUri1, this.color);
            }
        },
            () => {
                this.createSvg(svgUri1, this.color);
            });

        vscode.workspace.fs.stat(svgUri2).then(stat => {
            if (stat.size < 1) {
                this.createSvg(svgUri2, this.inactiveColor);
            }
        },
            () => {
                this.createSvg(svgUri2, this.inactiveColor);
            });
    }

    public toggleBookmark(uri: Uri, lineNumber: number) {
        let existingLabel = this.getLabelByPosition(uri, lineNumber);
        if (typeof existingLabel !== "undefined") {
            this.bookmarks.delete(existingLabel);
            return;
        }

        let newLabel = "line " + lineNumber + " of " + uri.fsPath;
        this.bookmarks.set(newLabel, new Bookmark(uri, uri.fsPath, lineNumber));
    }

    public getBookmarksOfUri(uri: Uri): Array<Bookmark> {
        let result: Array<Bookmark> = [];
        for (let [_, bookmark] of this.bookmarks) {
            if (bookmark.uri === uri) {
                result.push(bookmark);
            }
        }
        return result;
    }

    private getLabelByPosition(uri: Uri, lineNumber: number): string | undefined {
        for (let [label, bookmark] of this.bookmarks) {
            if (bookmark.uri === uri && bookmark.line === lineNumber) {
                return label;
            }
        }
        return undefined;
    }

    private ensureUsableColor() {
        if (this.color.match(/^[0-9a-f]+$/i) === null) {
            throw new Error("Illegal color definition: " + this.color);
        }

        this.color = this.color.toLowerCase();
        switch (this.color.length) {
            case 3:
                this.color = this.color.charAt(0) + "0" + this.color.charAt(1) + "0" + this.color.charAt(2) + "0" + Group.normalTransparency;
                break;
            case 8:
                this.color = this.color.substring(0, 6) + Group.normalTransparency;
                break;
            default:
                if (this.color.length < 8) {
                    this.color = this.color.padEnd(8, "f");
                } else {
                    this.color = this.color.substring(0, 8);
                }
        }
    }

    private async createSvg(svgUri: Uri, color: string) {
        let svgSource = new Uint8Array([0x3c, 0x73, 0x76, 0x67, 0x20, 0x78, 0x6d, 0x6c, 0x6e, 0x73, 0x3d, 0x22, 0x68,
            0x74, 0x74, 0x70, 0x3a, 0x2f, 0x2f, 0x77, 0x77, 0x77, 0x2e, 0x77, 0x33, 0x2e, 0x6f, 0x72, 0x67, 0x2f, 0x32,
            0x30, 0x30, 0x30, 0x2f, 0x73, 0x76, 0x67, 0x22, 0x20, 0x77, 0x69, 0x64, 0x74, 0x68, 0x3d, 0x22, 0x33, 0x32,
            0x22, 0x20, 0x68, 0x65, 0x69, 0x67, 0x68, 0x74, 0x3d, 0x22, 0x33, 0x32, 0x22, 0x3e, 0x3c, 0x70, 0x61, 0x74,
            0x68, 0x20, 0x64, 0x3d, 0x22, 0x4d, 0x37, 0x20, 0x33, 0x30, 0x20, 0x4c, 0x37, 0x20, 0x38, 0x20, 0x51, 0x37,
            0x20, 0x32, 0x20, 0x31, 0x33, 0x20, 0x32, 0x20, 0x4c, 0x31, 0x39, 0x20, 0x32, 0x20, 0x51, 0x32, 0x35, 0x20,
            0x32, 0x20, 0x32, 0x35, 0x20, 0x38, 0x20, 0x4c, 0x32, 0x35, 0x20, 0x33, 0x30, 0x20, 0x4c, 0x31, 0x36, 0x20,
            0x32, 0x33, 0x20, 0x5a, 0x22, 0x20, 0x66, 0x69, 0x6c, 0x6c, 0x3d, 0x22, 0x23, 0x66, 0x66, 0x66, 0x66, 0x66,
            0x66, 0x66, 0x66, 0x22, 0x20, 0x2f, 0x3e, 0x3c, 0x2f, 0x73, 0x76, 0x67, 0x3e]);
        let colorOffset = 134;

        for (let i = 0; i < 8; i++) {
            svgSource[i + colorOffset] = color.charCodeAt(i);
        }

        await vscode.workspace.fs.writeFile(svgUri, svgSource);
    }
}