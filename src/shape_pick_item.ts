import { QuickPickItem } from 'vscode';

export class ShapePickItem implements QuickPickItem {
    shape: string;
    iconText: string;
    label: string;
    description: string;
    detail: string;

    constructor(shape: string, iconText: string, label: string, description: string, detail: string) {
        this.shape = shape;
        this.iconText = iconText;
        this.label = label;
        this.description = description;
        this.detail = detail;
    }
}