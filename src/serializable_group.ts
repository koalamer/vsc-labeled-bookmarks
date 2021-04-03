import { Bookmark } from "./bookmark";
import { Group } from "./group";

export class SerializableGroup {
    label: string;
    color: string;
    shape: string;
    bookmarkKeys: Array<string>;
    bookmarkValues: Array<Bookmark>;

    constructor(label: string, color: string, shape: string, bookmarkKeys: Array<string>, bookmarkValues: Array<Bookmark>) {
        this.label = label;
        this.color = color;
        this.shape = shape;
        this.bookmarkKeys = bookmarkKeys;
        this.bookmarkValues = bookmarkValues;
    }

    public static fromGroup(group: Group): SerializableGroup {
        let bookmarkKeys: Array<string> = [];
        let bookmarkValues: Array<Bookmark> = [];
        for (let [key, value] of group.bookmarks) {
            bookmarkKeys.push(key);
            bookmarkValues.push(value);
        }
        return new SerializableGroup(
            group.label,
            group.color,
            group.shape,
            bookmarkKeys,
            bookmarkValues
        );
    }

    public static toGroup(sg: SerializableGroup): Group {
        let result = new Group(sg.label, sg.color, sg.shape);
        for (let i in sg.bookmarkKeys) {
            result.bookmarks.set(sg.bookmarkKeys[i], sg.bookmarkValues[i]);
        }
        return result;
    }
}