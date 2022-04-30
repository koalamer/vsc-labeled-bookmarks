export abstract class WebViewContent {

    protected name: string = "abstract";
    protected params: Map<string, any> = new Map();

    public getName(): string {
        return this.name;
    };

    public setSingleParam(name: string, value: any): void {
        this.params.set(name, value);
    }

    public getContent(): string {
        return ``;
    }

}