import { TextEditorDecorationType, Uri } from 'vscode';
import { DecorationFactory } from "./decoration_factory";
import { SerializableGroup } from "./serializable_group";

export class Group {
    static readonly inactiveTransparency: string = "33";

    name: string;
    color: string;
    shape: string;
    iconText: string;
    inactiveColor: string;
    isActive: boolean;
    isVisible: boolean;
    isInitialized: boolean;
    decoration: TextEditorDecorationType;
    inactiveDecoration: TextEditorDecorationType;
    groupDecorationUpdatedHandler: (group: Group) => void;
    decorationRemovedHandler: (decoration: TextEditorDecorationType) => void;

    constructor(
        name: string,
        color: string,
        shape: string,
        iconText: string
    ) {
        this.name = name;
        this.color = DecorationFactory.normalizeColorFormat(color);
        this.shape = shape;
        this.iconText = iconText;
        this.inactiveColor = this.color.substring(0, 6) + Group.inactiveTransparency;
        this.isActive = false;
        this.isVisible = false;
        this.isInitialized = false;
        this.decoration = DecorationFactory.placeholderDecoration;
        this.inactiveDecoration = DecorationFactory.placeholderDecoration;
        this.groupDecorationUpdatedHandler = (group: Group) => { return; };
        this.decorationRemovedHandler = (decoration: TextEditorDecorationType) => { return; };
    }

    public static fromSerializableGroup(sg: SerializableGroup): Group {
        return new Group(sg.name, sg.color, sg.shape, sg.iconText);
    }

    public static sortByName(a: Group, b: Group): number {
        return a.name.localeCompare(b.name);
    }

    public onGroupDecorationUpdated(fn: (group: Group) => void) {
        this.groupDecorationUpdatedHandler = fn;
    }

    public onDecorationRemoved(fn: (decoration: TextEditorDecorationType) => void) {
        this.decorationRemovedHandler = fn;
    }

    public async initDecorations() {
        this.decoration = await DecorationFactory.create(
            this.shape,
            this.color,
            this.iconText
        );
        this.inactiveDecoration = await DecorationFactory.create(
            this.shape,
            this.inactiveColor,
            this.iconText
        );
        this.isInitialized = true;
        this.groupDecorationUpdatedHandler(this);
    }

    public getColor(): string {
        return this.color;
    }

    public getActiveDecoration(): TextEditorDecorationType | null {
        if (!this.isVisible || !this.isInitialized) {
            return null;
        }

        if (this.isActive) {
            return this.decoration;
        }

        return this.inactiveDecoration;
    }

    public setIsActive(isActive: boolean) {
        if (this.isActive === isActive) {
            return;
        }

        let activeDecoration = this.getActiveDecoration();
        if (activeDecoration !== null) {
            this.decorationRemovedHandler(activeDecoration);
        }

        this.isActive = isActive;
        this.groupDecorationUpdatedHandler(this);
    }

    public setIsVisible(isVisible: boolean) {
        if (this.isVisible === isVisible) {
            return;
        }

        let activeDecoration = this.getActiveDecoration();
        if (activeDecoration !== null) {
            this.decorationRemovedHandler(activeDecoration);
        }

        this.isVisible = isVisible;
        this.groupDecorationUpdatedHandler(this);
    }

    public setShapeAndIconText(shape: string, iconText: string) {
        if (this.shape === shape && this.iconText === iconText) {
            return;
        }

        this.removeDecorations();

        this.shape = shape;
        this.iconText = iconText;

        this.initDecorations();
    }

    public setColor(color: string) {
        if (this.color === color) {
            return;
        }

        this.removeDecorations();

        this.color = DecorationFactory.normalizeColorFormat(color);
        this.inactiveColor = this.color.substring(0, 6) + Group.inactiveTransparency;

        this.initDecorations();
    }

    public removeDecorations() {
        this.isInitialized = false;

        this.decorationRemovedHandler(this.decoration);
        this.decorationRemovedHandler(this.inactiveDecoration);
    }
}