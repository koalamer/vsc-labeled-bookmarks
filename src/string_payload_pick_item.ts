import { QuickPickItem, QuickPickItemKind } from 'vscode';

export class StringPayloadPickItem implements QuickPickItem {
    payload: string;
    alwaysShow: boolean;
    description: string;
    detail: string;
    kind: QuickPickItemKind;
    label: string;
    picked: boolean;

    constructor(payload: string, label: string, description: string) {
        this.payload = payload;
        this.alwaysShow = true;
        this.description = description;
        this.detail = "";
        this.kind = QuickPickItemKind.Default;
        this.label = label;
        this.picked = false;
    }

    static newSeparator(label: string): StringPayloadPickItem {
        let separator = new StringPayloadPickItem("", label, "");
        separator.kind = QuickPickItemKind.Separator;
        return separator;
    }

}