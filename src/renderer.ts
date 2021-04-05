import { ExtensionContext } from "vscode";

export class Renderer {
    private ctx: ExtensionContext;

    constructor(ctx: ExtensionContext) {
        this.ctx = ctx;
    }
}