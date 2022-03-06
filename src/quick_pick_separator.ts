import { QuickPickItem, QuickPickItemKind } from 'vscode';

export class QuickPickSeparator implements QuickPickItem {
    label: string;
    kind: QuickPickItemKind;

    constructor(label: string) {
        this.label = label;
        this.kind = QuickPickItemKind.Separator;
    }
}