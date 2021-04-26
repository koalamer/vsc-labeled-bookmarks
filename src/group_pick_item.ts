import { QuickPickItem } from 'vscode';
import { Group } from "./group";

export class GroupPickItem implements QuickPickItem {
    group: Group;
    label: string;
    description?: string;
    detail?: string;
    picked: boolean;
    alwaysShow: boolean;

    constructor(group: Group, label: string, description?: string, detail?: string, picked: boolean = false, alwaysShow: boolean = false) {
        this.group = group;
        this.label = label;
        this.description = description;
        this.detail = detail;
        this.picked = picked;
        this.alwaysShow = alwaysShow;
    }

    public static fromGroup(group: Group, bookmarkCount: number): GroupPickItem {
        let label = group.name;
        label = (group.isActive ? "● " : "◌ ") + label;

        let description = " $(bookmark) " + bookmarkCount;
        let detail = "";
        return new GroupPickItem(group, label, description, detail);
    }
}