import { Bookmark } from "../bookmark";

export class SerializableBookmark {
    fsPath: string;
    lineNumber: number;
    characterNumber: number;
    label?: string;
    lineText: string;
    isLineNumberChanged: boolean;
    groupName: string;

    constructor(
        fsPath: string,
        lineNumber: number,
        characterNumber: number,
        label: string | undefined,
        lineText: string,
        groupName: string
    ) {
        this.fsPath = fsPath;
        this.lineNumber = lineNumber;
        this.characterNumber = characterNumber;
        this.label = label;
        this.lineText = lineText;
        this.isLineNumberChanged = false;
        this.groupName = groupName;
    }

    public static fromBookmark(bookmark: Bookmark): SerializableBookmark {
        return new SerializableBookmark(
            bookmark.fsPath,
            bookmark.lineNumber,
            bookmark.characterNumber,
            bookmark.label,
            bookmark.lineText,
            bookmark.group.name
        );
    }

    public static copyOne(sbm: SerializableBookmark): SerializableBookmark {
        return new SerializableBookmark(
            sbm.fsPath,
            sbm.lineNumber,
            sbm.characterNumber,
            sbm.label,
            sbm.lineText,
            sbm.groupName
        );
    }

    public static copyList(list: SerializableBookmark[]): SerializableBookmark[] {
        let newList = new Array<SerializableBookmark>();
        for (const sb of list) {
            let copy = SerializableBookmark.copyOne(sb);
            newList.push(copy);
        };
        return newList;
    }
}