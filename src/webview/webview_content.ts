export abstract class WebViewContent {

    protected name: string = "abstract";
    protected params: Map<string, any> = new Map();

    public getName(): string {
        return this.name;
    };

    public processMessage(operation: string, name: string, value: any): void {
        switch (operation) {
            case "set":
                this.params.set(name, value);
                break;
        }
    }

    public getContent(): Promise<string> {
        return Promise.resolve(``);
    }

}