import * as vscode from 'vscode';
import { SerializableGroup } from "./serializable_group";
import { Group } from "./group";

export class SerializableGroupMap {
    keys: Array<string>;
    values: Array<SerializableGroup>;

    constructor(keys: Array<string>, values: Array<SerializableGroup>) {
        this.keys = keys;
        this.values = values;
    }

    public static fromGroupMap(groups: Map<string, Group>): SerializableGroupMap {
        let groupKeys: Array<string> = [];
        let groupValues: Array<SerializableGroup> = [];
        for (let [key, value] of groups) {
            groupKeys.push(key);
            groupValues.push(SerializableGroup.fromGroup(value));
        }
        return new SerializableGroupMap(groupKeys, groupValues);
    }

    // public toGroupMap(): Map<string, Group> {
    //     vscode.window.showInformationMessage("loop map deser 1");
    //     let result = new Map<string, Group>();
    //     vscode.window.showInformationMessage("loop map deser 2");
    //     for (let i in this.keys) {
    //         vscode.window.showInformationMessage("index " + i + " key " + this.keys[i]);
    //         result.set(this.keys[i], this.values[i].toGroup());
    //     }
    //     vscode.window.showInformationMessage("loop map done");
    //     return result;
    // }
}