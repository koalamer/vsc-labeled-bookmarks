import { QuickPickItem, QuickPickItemKind } from 'vscode';

export class ShapePickItem implements QuickPickItem {
    shape: string;
    iconText: string;
    label: string;
    description: string;
    detail: string;
    kind: QuickPickItemKind;

    constructor(shape: string, iconText: string, label: string, description: string, detail: string) {
        this.shape = shape;
        this.iconText = iconText;
        this.label = label;
        this.description = description;
        this.detail = detail;
        this.kind = QuickPickItemKind.Default;
    }
}