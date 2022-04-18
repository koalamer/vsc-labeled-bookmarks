export class WebviewState {
    private action: string;
    private targetStorageType: string;
    private targetStoragePath: string;
    private selectedGroups: string[];
    private folderAssignments: Map<string, string>;
    private fileMapping: Map<string, string>;

    public constructor() {
        this.action = "none";
        this.targetStorageType = "";
        this.targetStoragePath = "";
        this.selectedGroups = [];
        this.folderAssignments = new Map();
        this.fileMapping = new Map();
    }
}
