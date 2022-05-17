import { Uri } from "vscode";
import { SerializableGroup } from "../storage/serializable_group";

export interface WebviewContentHelper {
    pathElementsToUrl(pathElements: string[]): string;
    uriToUrl(uri: Uri): string;
    getGroupListFormControls(groups: SerializableGroup[], prefix: string): string;
}