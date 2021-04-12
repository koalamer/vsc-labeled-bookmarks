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
    unnamedCounter: number;

    constructor(
        name: string,
        color: string,
        shape: string,
        iconText: string,
        bookmarkKeys: Array<string>,
        bookmarkValues: Array<Bookmark>,
        unnamedCounter: number
    ) {
        this.name = name;
        this.color = color;
        this.shape = shape;
        this.iconText = iconText;
        this.bookmarkKeys = bookmarkKeys;
        this.bookmarkValues = bookmarkValues;
        this.unnamedCounter = unnamedCounter;
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
            bookmarkValues,
            group.unnamedCounter
        );
    }

}