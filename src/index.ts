import express, { Request } from "express";
import cors from "cors";
import {
  createSandboxProject,
  getLatestVersionId,
  getProject,
  runCommand,
} from "./controllers/projects";
import { initializeQueue, InMemoryVideoStore } from "./controllers/queue";
import { buildXml } from "./utils/xml";
import { readdir, stat } from "fs/promises";
import { createReadStream } from "fs";
import { AssetCatalogItem, PATH_TO_ASSETS } from "./assets";
import { join } from "path";

const app = express();

app.use(express.json());
app.use(cors());

initializeQueue();

const port = 8080; // default port to listen

async function getProjectAndVersionId(req: Request) {
  const projectId = req.params.projectId as string;
  let versionId = req.query.versionId as string | undefined;

  // Default to the latest version
  if (!versionId) {
    versionId = await getLatestVersionId(projectId);
    console.log("FOUND VERSION", versionId);
  }

  // Reset version ID if original is explicitly requested
  if (versionId === "original") {
    versionId = undefined;
  }

  return { projectId, versionId };
}
// define a route handler for the default home page
app.get("/api/projects/:projectId", async (req, res) => {
  const { projectId, versionId } = await getProjectAndVersionId(req);
  const projectData = await getProject(projectId, versionId);
  return res.send({ project: buildXml(projectData) });
});

app.get("/api/projects/:projectId/video", async (req, res) => {
  const { projectId, versionId } = await getProjectAndVersionId(req);
  const videoItem = InMemoryVideoStore.getItem(projectId);
  const media = req.query.media as string | undefined;

  if (!media) {
    return res.json(videoItem);
  } else {
    const fileStat = await stat(videoItem.latestFile);

    res.writeHead(200, {
      "Content-Type": "video/mp4",
      "Content-Length": fileStat.size,
    });

    const readStream = createReadStream(videoItem.latestFile);
    readStream.pipe(res);
  }
});

app.put("/api/projects/:projectId", async (req, res) => {
  const { projectId, versionId } = await getProjectAndVersionId(req);
  const command = req.body;
  const result = await runCommand(command, projectId, versionId);
  return res.send({
    updatedProject: buildXml(result.updatedProject),
    success: result.success,
  });
});

app.post("/api/projects", async (req, res) => {
  const projectId = await createSandboxProject();
  return res.send({ projectId });
});

app.get("/api/assets", async (req, res) => {
  const files = await readdir(join(PATH_TO_ASSETS, "videos"));
  const imageFiles = await readdir(join(PATH_TO_ASSETS, "images"));
  const musicFiles = await readdir(join(PATH_TO_ASSETS, "music"));

  const catalog: AssetCatalogItem[] = files.map((path) => {
    const assetId = path.split(".")![0];
    return {
      id: assetId,
      videoUrl: `/api/assets/videos/${assetId}`,
      thumbnailUrl: `/api/assets/thumbnails/${assetId}`,
      type: "video",
    };
  });

  imageFiles.forEach((imagePath) => {
    const assetId = imagePath.split(".")![0];
    catalog.push({
      id: assetId,
      imageUrl: `/api/assets/images/${assetId}`,
      type: "image",
    });
  });

  musicFiles.forEach((musicPath) => {
    const assetId = musicPath.split(".")![0];
    catalog.push({
      id: assetId,
      imageUrl: `/api/assets/music/${assetId}`,
      type: "audio",
    });
  });

  return res.json(catalog);
});
app.get("/api/assets/videos/:assetId", async (req, res) => {
  const assetId = req.params.assetId as string;
  const filePath = join(PATH_TO_ASSETS, "videos", `${assetId}.mp4`);
  const fileStat = await stat(filePath);

  res.writeHead(200, {
    "Content-Type": "video/mp4",
    "Content-Length": fileStat.size,
  });

  const readStream = createReadStream(filePath);
  readStream.pipe(res);
});

app.get("/api/assets/images/:assetId", async (req, res) => {
  const assetId = req.params.assetId as string;
  const filePath = join(PATH_TO_ASSETS, "images", `${assetId}.png`);
  const fileStat = await stat(filePath);

  res.writeHead(200, {
    "Content-Type": "image/png",
    "Content-Length": fileStat.size,
  });

  const readStream = createReadStream(filePath);
  readStream.pipe(res);
});

app.get("/api/assets/thumbnails/:assetId", async (req, res) => {
  const assetId = req.params.assetId as string;
  const filePath = join(PATH_TO_ASSETS, "thumbnails", `${assetId}.jpg`);
  const fileStat = await stat(filePath);

  res.writeHead(200, {
    "Content-Type": "image/jpeg",
    "Content-Length": fileStat.size,
  });

  const readStream = createReadStream(filePath);
  readStream.pipe(res);
});
app.get("/api/assets/music/:assetId", async (req, res) => {
  const assetId = req.params.assetId as string;
  const filePath = join(PATH_TO_ASSETS, "music", `${assetId}.mp3`);
  const fileStat = await stat(filePath);

  res.writeHead(200, {
    "Content-Type": "audio/mpeg",
    "Content-Length": fileStat.size,
  });

  const readStream = createReadStream(filePath);
  readStream.pipe(res);
});

// start the Express server
app.listen(port, () => {
  console.log(`server started at http://localhost:${port}`);
});
