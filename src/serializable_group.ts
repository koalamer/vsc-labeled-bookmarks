import { Bookmark } from "./bookmark";
import { Group } from "./group";
import { Main } from "./main";

export class SerializableGroup {
    name: string;
    color: string;
    shape: string;
    iconText: string;
    bookmarkKeys: Array<string>;
    bookmarkValues: Array<Bookmark>;

    constructor(name: string, color: string, shape: string, iconText: string, bookmarkKeys: Array<string>, bookmarkValues: Array<Bookmark>) {
        this.name = name;
        this.color = color;
        this.shape = shape;
        this.iconText = iconText;
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
            group.name,
            group.color,
            group.shape,
            group.iconText,
            bookmarkKeys,
            bookmarkValues
        );
    }

    public static toGroup(main: Main, sg: SerializableGroup): Group {
        let result = new Group(main, sg.name, sg.color, sg.shape, sg.iconText);
        for (let i in sg.bookmarkKeys) {
            result.bookmarks.set(sg.bookmarkKeys[i], sg.bookmarkValues[i]);
        }
        return result;
    }
}