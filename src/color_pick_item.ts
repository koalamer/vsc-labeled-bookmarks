import { QuickPickItem } from 'vscode';

export class ColorPickItem implements QuickPickItem {
    color: string;
    label: string;
    description: string;
    detail: string;

    constructor(color: string, label: string, description: string, detail: string) {
        this.color = color;
        this.label = label;
        this.description = description;
        this.detail = detail;
    }
}