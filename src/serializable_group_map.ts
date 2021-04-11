import { SerializableGroup } from "./serializable_group";
import { Group } from "./group";
import { Main } from "./main";

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

    public static toGroupMap(main: Main, sgm: SerializableGroupMap): Map<string, Group> {
        let result = new Map<string, Group>();
        for (let i in sgm.keys) {
            let group = Group.fromSerializableGroup(main, sgm.values[i]);
            result.set(sgm.keys[i], group);
        }
        return result;
    }
}