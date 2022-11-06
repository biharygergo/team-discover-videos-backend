import { copyFile, mkdir, readdir, readFile, writeFile } from "fs/promises";
import { resolve } from "path";
import { buildXml, getChild, parseXml } from "../utils/xml";
import { InMemoryVideoStore } from "./queue";
import { replaceText } from "./replaceText";
import { replaceMedia } from "./replaceMedia";
import { translateText } from "./translateText";
import { replaceAudio } from "./replaceAudio";

export interface EditorCommand {
  action: "replace" | "translate";
  time: number;
  type: "text" | "video" | "image" | "audio";
  value: string;
}

export const PATH_TO_DATA = resolve("src", "data");
export const PATH_TO_QUEUE = resolve("src", "data", "queue");

export async function getLatestVersionId(projectId: string) {
  const versionPaths = await readdir(
    resolve(PATH_TO_DATA, "projects", projectId, "versions")
  );

  const lastVersionPath = versionPaths.pop();

  return lastVersionPath?.split(".")[0];
}

export async function getProject(projectId: string, versionId?: string) {
  const versionParts = versionId
    ? ["versions", `${versionId}.xml`]
    : ["original", "project.xml"];
  const pathToXml = resolve(
    PATH_TO_DATA,
    "projects",
    projectId,
    ...versionParts
  );
  const data = await readFile(pathToXml, { encoding: "utf-8" });
  const parsed = parseXml(data);

  return parsed;
}

export async function runCommand(
  command: EditorCommand,
  projectId: string,
  versionId?: string
) {
  const parsedProject = await getProject(projectId, versionId);
  let updatedProject;
  let success = false;

  console.log('EXECUTING COMMAND', projectId, command.action, command.type, command.value, command.time);

  switch (command.action) {
    case "replace":
      switch (command.type) {
        case "text":
          const result = replaceText(parsedProject, command);
          updatedProject = result.project;
          success = result.replaced;
          break;
        case "video":
          const videoResult = replaceMedia(
            parsedProject,
            command,
            projectId,
            "video"
          );
          updatedProject = videoResult.project;
          success = videoResult.foundVideoToReplace;
          break;
        case "image":
          const imageResult = replaceMedia(
            parsedProject,
            command,
            projectId,
            "image"
          );
          updatedProject = imageResult.project;
          success = imageResult.foundVideoToReplace;
          break;
        case "audio":
            const audioResult = replaceAudio(
              parsedProject,
              command,
              projectId
            );
            updatedProject = audioResult.project;
            success = audioResult.foundAudioToReplace;
            break;
      }
      break;
    case "translate":
      const translateResult = await translateText(parsedProject, command);
      updatedProject = translateResult.project;
      success = translateResult.replaced;
      break;
    default:
      throw new Error("This command is not supported");
  }

  if (success) {
    const savedPath = await saveUpdatedProject(updatedProject, projectId);
    await generateVideo(savedPath, projectId);
  }

  console.log('COMMAND RESULT', projectId, command.action, command.type, success);

  return { success, updatedProject };
}

export async function saveUpdatedProject(project: any, projectId: string) {
  const versionId = Date.now();
  const fileName = `${versionId}.xml`;
  const pathToXml = resolve(
    PATH_TO_DATA,
    "projects",
    projectId,
    "versions",
    fileName
  );

  setProjectName(project, `${projectId}@${versionId}`);
  await writeFile(pathToXml, buildXml(project));

  return pathToXml;
}

function setProjectName(project: any, updatedName: string) {
  const xmeml = getChild("xmeml", project);
  const sequence = getChild("sequence", xmeml);
  const name = getChild("name", sequence);
  name[0] = { "#text": updatedName };

  return project;
}

export async function generateVideo(xmlPath: string, projectId: string) {
  InMemoryVideoStore.setVideoStatus(projectId, "rendering");
  return copyFile(xmlPath, PATH_TO_QUEUE + "/" + xmlPath.split("/").pop());
}

export async function createSandboxProject() {
  const sandboxId = `sandbox_${Date.now()}`;
  const newSandboxPath = resolve(PATH_TO_DATA, "projects", sandboxId);
  await mkdir(newSandboxPath);
  await mkdir(resolve(newSandboxPath, "original"));
  await mkdir(resolve(newSandboxPath, "versions"));

  const pathToNewSandboxXml = resolve(
    newSandboxPath,
    "original",
    "project.xml"
  );

  const sandboxProject = await getProject("sandbox");
  await setProjectName(sandboxProject, sandboxId);
  await writeFile(pathToNewSandboxXml, buildXml(sandboxProject));

  await generateVideo(pathToNewSandboxXml, sandboxId);
  return sandboxId;
}
