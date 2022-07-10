import { BookmarkDataStorage } from "./bookmark_data_storage";
import { StorageActionResult } from "../storage/storage_action_result";

export interface StorageManager {
    getActiveStorage(): BookmarkDataStorage;
    executeStorageAction(action: string, targetType: string, target: string, selectedGroups: string[], pathMappings: Map<string, string>): Promise<StorageActionResult>;
}