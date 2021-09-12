import { TextEditorDecorationType, Uri } from 'vscode';
import { DecorationFactory } from "./decoration_factory";
import { SerializableGroup } from "./serializable_group";

export class Group {
    static readonly inactiveTransparency: string = "33";

    public name: string;
    public color: string;
    public shape: string;
    public iconText: string;
    public isActive: boolean;
    public isVisible: boolean;
    public decoration: TextEditorDecorationType;
    public decorationSvg: Uri;

    private decorationFactory: DecorationFactory;
    private inactiveColor: string;
    private isInitialized: boolean;
    private inactiveDecoration: TextEditorDecorationType;
    private inactiveDecorationSvg: Uri;
    private groupDecorationUpdatedHandler: (group: Group) => void;
    private groupDecorationSwitchedHandler: (group: Group) => void;
    private decorationRemovedHandler: (decoration: TextEditorDecorationType) => void;

    constructor(
        name: string,
        color: string,
        shape: string,
        iconText: string,
        decorationFactory: DecorationFactory
    ) {
        this.decorationFactory = decorationFactory;
        this.name = name;
        this.color = this.decorationFactory.normalizeColorFormat(color);
        this.shape = shape;
        this.iconText = iconText;
        this.inactiveColor = this.color.substring(0, 6) + Group.inactiveTransparency;
        this.isActive = false;
        this.isVisible = false;
        this.isInitialized = false;
        this.decoration = this.decorationFactory.placeholderDecoration;
        this.decorationSvg = this.decorationFactory.placeholderDecorationUri;
        this.inactiveDecoration = this.decorationFactory.placeholderDecoration;
        this.inactiveDecorationSvg = this.decorationFactory.placeholderDecorationUri;
        this.groupDecorationUpdatedHandler = (group: Group) => { return; };
        this.groupDecorationSwitchedHandler = (group: Group) => { return; };
        this.decorationRemovedHandler = (decoration: TextEditorDecorationType) => { return; };
    }

    public static fromSerializableGroup(sg: SerializableGroup, decorationFactory: DecorationFactory): Group {
        return new Group(sg.name, sg.color, sg.shape, sg.iconText, decorationFactory);
    }

    public static sortByName(a: Group, b: Group): number {
        return a.name.localeCompare(b.name);
    }

    public onGroupDecorationUpdated(fn: (group: Group) => void) {
        this.groupDecorationUpdatedHandler = fn;
    }

    public onGroupDecorationSwitched(fn: (group: Group) => void) {
        this.groupDecorationSwitchedHandler = fn;
    }

    public onDecorationRemoved(fn: (decoration: TextEditorDecorationType) => void) {
        this.decorationRemovedHandler = fn;
    }

    public async initDecorations() {
        [this.decoration, this.decorationSvg] = await this.decorationFactory.create(
            this.shape,
            this.color,
            this.iconText
        );
        [this.inactiveDecoration, this.inactiveDecorationSvg] = await this.decorationFactory.create(
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
        this.groupDecorationSwitchedHandler(this);
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
        this.groupDecorationSwitchedHandler(this);
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

        this.color = this.decorationFactory.normalizeColorFormat(color);
        this.inactiveColor = this.color.substring(0, 6) + Group.inactiveTransparency;

        this.initDecorations();
    }

    public redoDecorations() {
        this.removeDecorations();
        this.initDecorations();
    }

    public removeDecorations() {
        this.isInitialized = false;

        this.decorationRemovedHandler(this.decoration);
        this.decorationRemovedHandler(this.inactiveDecoration);
    }
}