import { QuickPickItem } from 'vscode';

class PickItem implements QuickPickItem {
    label: string;
    description: string;
    detail: string;

    constructor(label: string, description: string, detail: string) {
        this.label = label;
        this.description = description;
        this.detail = detail;
    }
}