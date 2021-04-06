import { QuickPickItem } from 'vscode';

export class ShapePickItem implements QuickPickItem {
    shape: string;
    label: string;
    description: string;
    detail: string;

    constructor(shape: string, label: string, description: string, detail: string) {
        this.shape = shape;
        this.label = label;
        this.description = description;
        this.detail = detail;
    }
}