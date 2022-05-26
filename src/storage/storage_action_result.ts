export class StorageActionResult {
    public success: boolean;
    public timestamp: number;
    public infos: string[];
    public warnings: string[];
    public errors: string[];

    public constructor(
        success: boolean,
        infos: string[],
        warnings: string[],
        errors: string[]
    ) {
        this.success = success;
        this.timestamp = Date.now();
        this.infos = infos;
        this.warnings = warnings;
        this.errors = errors;
    }

    public static simpleSuccess() {
        return new StorageActionResult(
            true,
            [],
            [],
            []
        );
    }

    public static simpleError(errorMessage: string): StorageActionResult {
        return new StorageActionResult(
            false,
            [],
            [],
            [errorMessage]
        );
    }
}