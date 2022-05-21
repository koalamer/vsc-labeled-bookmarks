import { BookmarkDataStorage } from "./bookmark_data_storage";

export interface StorageManager {
    getActiveStorage(): BookmarkDataStorage;
    executeStorageAction(action: string, targetType: string, target: string, selectedGroups: string[]): Promise<void>;
}