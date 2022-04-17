export class FolderMappingStats {
    public perfectlyMatching: number;
    public offFolderExisting: number;
    public offFolderMissing: number;

    public constructor() {
        this.perfectlyMatching = 0;
        this.offFolderExisting = 0;
        this.offFolderMissing = 0;
    }
};
