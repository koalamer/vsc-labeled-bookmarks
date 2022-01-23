import { BookmarkDataProvider } from "./bookmark_data_provider";
import { BookmarkDataPersister } from "./bookmark_data_persister";

export interface BookmarkDataStorage extends BookmarkDataProvider, BookmarkDataPersister {
}