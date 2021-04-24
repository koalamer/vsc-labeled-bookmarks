import { Group } from "./group";

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
}