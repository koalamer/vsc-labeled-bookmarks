import { Bookmark } from "./bookmark";
import { Group } from "./group";

export class SerializableGroup {
    label: string;
    color: string;
    modifiedAt: string;
    bookmarkKeys: Array<string>;
    bookmarkValues: Array<Bookmark>;

    constructor(label: string, color: string, modifiedAt: string, bookmarkKeys: Array<string>, bookmarkValues: Array<Bookmark>) {
        this.label = label;
        this.color = color;
        this.modifiedAt = modifiedAt;
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
            group.modifiedAt.toISOString(),
            bookmarkKeys,
            bookmarkValues
        );
    }

    // public toGroup(): Group {
    //     let result = new Group(this.label, this.color, new Date(this.modifiedAt));
    //     for (let i in this.bookmarkKeys) {
    //         result.bookmarks.set(this.bookmarkKeys[i], this.bookmarkValues[i]);
    //     }
    //     return result;
    // }
}