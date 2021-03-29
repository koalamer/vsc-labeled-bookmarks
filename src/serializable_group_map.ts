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

    public static toGroupMap(sgm: SerializableGroupMap): Map<string, Group> {
        vscode.window.showInformationMessage("loop map deser 1");
        let result = new Map<string, Group>();
        vscode.window.showInformationMessage("loop map deser 2");
        for (let i in sgm.keys) {
            vscode.window.showInformationMessage("index " + i + " key " + sgm.keys[i]);
            result.set(sgm.keys[i], SerializableGroup.toGroup(sgm.values[i]));
        }
        vscode.window.showInformationMessage("loop map done");
        return result;
    }
}