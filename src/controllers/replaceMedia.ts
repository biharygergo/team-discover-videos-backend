import { join } from "path";
import { overlapsIntervalFrames } from "../utils/time";
import { getChild } from "../utils/xml";
import { EditorCommand, PATH_TO_DATA } from "./projects";

const videoExtensions = [".MOV, .mov, .mp4"];
const imageExtensions = [".jpg", ".jpeg", ".png", ".JPG", ".JPEG"];

const imageExtension = ".png";
const videoExtension = ".mp4";

export function replaceMedia(
  project: any,
  command: EditorCommand,
  projectId: string,
  mediaType: "image" | "video"
) {
  let foundVideoToReplace = false;
  const xmeml = getChild("xmeml", project);
  const sequence = getChild("sequence", xmeml);
  const media = getChild("media", sequence);
  const video = getChild("video", media);

  const tracks = getChild("track", video);
  const videoTrack = tracks[0].track;

  const clipItems = getChild("clipitem", videoTrack, true);
  clipItems?.forEach((clipItem: any) => {
    const file = getChild("file", clipItem.clipitem);
    if (!file) return;

    const start = getChild("#text", getChild("start", clipItem.clipitem));
    const end = getChild("#text", getChild("end", clipItem.clipitem));

    const name = getChild("name", clipItem.clipitem);
    const existingFileName = getChild("#text", name);
    const existingExtension = "." + existingFileName.split(".").pop();

    const allowedExtensions =
      mediaType === "video" ? videoExtensions : imageExtensions;
    if (
      !overlapsIntervalFrames(start, end, command.time) ||
      !allowedExtensions.includes(existingExtension)
    ) {
      // console.log("Does not overlap filter");
      return;
    }

    console.log("FOUND OVERLAP");
    const nameWithExtension = `${command.value}${
      mediaType === "video" ? videoExtension : imageExtension
    }`;

    foundVideoToReplace = true;

    name[0] = { "#text": nameWithExtension };

    const fileName = getChild("name", file);
    fileName[0] = { "#text": nameWithExtension };

    const filePath = getChild("pathurl", file);

    const pathToAssets =
      "file://localhost" +
      join(
        PATH_TO_DATA,
        "assets",
        mediaType === "video" ? "videos" : "images",
        nameWithExtension
      );
    filePath[0] = { "#text": pathToAssets };
  });

  return { project, foundVideoToReplace };
}
