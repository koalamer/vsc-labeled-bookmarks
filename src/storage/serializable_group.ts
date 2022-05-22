import { Group } from "../group";
import { SerializableBookmark } from "./serializable_bookmark";

export class SerializableGroup {
    name: string;
    color: string;
    shape: string;
    iconText: string;

    constructor(
        name: string,
        color: string,
        shape: string,
        iconText: string,
    ) {
        this.name = name;
        this.color = color;
        this.shape = shape;
        this.iconText = iconText;
    }

    public static fromGroup(group: Group): SerializableGroup {
        return new SerializableGroup(
            group.name,
            group.color,
            group.shape,
            group.iconText
        );
    }

    public static copyOne(g: SerializableGroup): SerializableGroup {
        return new SerializableGroup(
            g.name,
            g.color,
            g.shape,
            g.iconText
        );
    }

    public static copyList(list: SerializableGroup[]): SerializableGroup[] {
        let newList = new Array<SerializableGroup>();
        for (let sg of list) {
            let copy = SerializableGroup.copyOne(sg);
            newList.push(copy);
        };
        return newList;
    }
}