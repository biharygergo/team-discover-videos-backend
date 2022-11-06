import { join, resolve } from "path";
import * as chokidar from "chokidar";
import { readdirSync } from "fs";

const PATH_TO_QUEUE = resolve("src", "data", "queue", "Output");

type VideoStatus = "rendering" | "done";

interface VideoStoreItem {
  latestFile: string;
  previousFiles: string[];
  status: VideoStatus;
}

export class VideoStore {
  store: {
    [projectId: string]: VideoStoreItem;
  } = {};

  constructor() {
    const files = readdirSync(PATH_TO_QUEUE);
    files.forEach((path) => {
      let [projectId, versionIdWithExtension] = path
        .split("/")
        .pop()!
        .split("@");
      
      if (projectId.includes('.')) {
        projectId = projectId.split('.')[0];
      }

      console.log(projectId)
      this.addNewVideo(projectId, join(PATH_TO_QUEUE, path));
    });
  }

  getItem(projectId: string) {
    if (!this.store[projectId]) {
      this.store[projectId] = {
        latestFile: "",
        previousFiles: [],
        status: "done",
      };
    }
    return this.store[projectId];
  }

  setVideoStatus(projectId: string, status: VideoStatus) {
    const item = this.getItem(projectId);
    item.status = status;
  }

  addNewVideo(projectId: string, path: string) {
    const item = this.getItem(projectId);
    item.latestFile = path;
    item.previousFiles = [...item.previousFiles, path];
  }
}

export const InMemoryVideoStore = new VideoStore();

export function initializeQueue() {
  const watcher = chokidar.watch(PATH_TO_QUEUE, {
    ignored: /(^|[\/\\])\../,
    ignoreInitial: true,
  });

  watcher.on("add", (path) => {
    const [projectId, versionIdWithExtension] = path
      .split("/")
      .pop()!
      .split("@");

    setTimeout(() => {
      InMemoryVideoStore.addNewVideo(projectId, path);
      InMemoryVideoStore.setVideoStatus(projectId, "done");
    }, 4000);
  });
}
