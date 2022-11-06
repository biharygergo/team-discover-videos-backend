import { resolve } from "path";

export const PATH_TO_ASSETS = resolve("src", "data", "assets");

export interface AssetCatalogItem {
  id: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  imageUrl?: string;
  type: "video" | "audio" | "image";
}
