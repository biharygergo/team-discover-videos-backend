import { join } from "path";
import { overlapsIntervalFrames } from "../utils/time";
import { getChild } from "../utils/xml";
import { EditorCommand, PATH_TO_DATA } from "./projects";

export function replaceAudio(
  project: any,
  command: EditorCommand,
  projectId: string
) {
  let foundAudioToReplace = false;
  const xmeml = getChild("xmeml", project);
  const sequence = getChild("sequence", xmeml);
  const media = getChild("media", sequence);
  const video = getChild("audio", media);

  const tracks = getChild("track", video);

  tracks?.forEach((track: any) => {
    const audioTrack = track.track;
    const clipItems = getChild("clipitem", audioTrack, true);
    clipItems?.forEach((clipItem: any) => {
      console.log(clipItem);
      const file = getChild("file", clipItem.clipitem);
      if (!file || !JSON.parse(JSON.stringify(file))) return;

      const start = getChild("#text", getChild("start", clipItem.clipitem));
      const end = getChild("#text", getChild("end", clipItem.clipitem));

      const name = getChild("name", clipItem.clipitem);
      const existingFileName = getChild("#text", name);
      const existingExtension = "." + existingFileName.split(".").pop();

      const allowedExtensions = [".mp3", ".MP3"];
      if (
        !overlapsIntervalFrames(start, end, command.time) ||
        !allowedExtensions.includes(existingExtension)
      ) {
        // console.log("Does not overlap filter");
        return;
      }

      console.log("FOUND OVERLAP");
      const nameWithExtension = `${command.value}.mp3`;

      foundAudioToReplace = true;

      try {
        console.log("name", name);
        name[0] = { "#text": nameWithExtension };

        const fileName = getChild("name", file);
        fileName[0] = { "#text": nameWithExtension };

        const filePath = getChild("pathurl", file);
        console.log("filepath", filePath);

        const pathToAssets =
          "file://localhost" +
          join(PATH_TO_DATA, "assets", "music", nameWithExtension);
        filePath[0] = { "#text": pathToAssets };
      } catch (e) {
        console.error("Error while setting audio", e);
      }
    });
  });

  return { project, foundAudioToReplace };
}
