import { Uri } from "vscode";
import { SerializableGroup } from "../storage/serializable_group";

export interface WebviewContentHelper {
    pathElementsToUrl(pathElements: string[]): string;
    uriToUrl(uri: Uri): string;
    getGroupListFormControls(groups: SerializableGroup[], prefix: string, selectMultiple: boolean): string;
    refreshView(): void;
    setHtmlContent(selector: string, html: string): void;
    setFormElement(elementName: string, value: string): void;
    submitForm(): void;
}