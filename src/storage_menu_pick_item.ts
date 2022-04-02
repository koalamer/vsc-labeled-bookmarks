import { QuickPickItem, QuickPickItemKind } from 'vscode';

export class StorageMenuPickItem implements QuickPickItem {
    action: string;
    alwaysShow: boolean;
    description: string;
    detail: string;
    kind: QuickPickItemKind;
    label: string;
    picked: boolean;

    constructor(action: string, label: string, description: string, detail: string) {
        this.action = action;
        this.alwaysShow = true;
        this.description = description;
        this.detail = detail;
        this.kind = QuickPickItemKind.Default;
        this.label = label;
        this.picked = false;
    }
}