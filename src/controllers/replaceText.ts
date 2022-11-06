import { getEncodedText, replaceEncodedText } from "../utils/encoding";
import { overlapsIntervalFrames } from "../utils/time";
import { getChild } from "../utils/xml";
import { EditorCommand } from "./projects";

function findMatchingTextNode(project: any, command: EditorCommand) {
  const xmeml = getChild("xmeml", project);
  const sequence = getChild("sequence", xmeml);
  const media = getChild("media", sequence);
  const video = getChild("video", media);

  const tracks = getChild("track", video);

  for (const track of tracks) {
    const clipItems = getChild("clipitem", track.track, true);
    for (const clipItem of clipItems) {
      const filters = getChild("filter", clipItem.clipitem, true);
      for (const filterItem of filters) {
        const filter = filterItem.filter;
        if (!filter) return;

        const start = getChild("#text", getChild("start", clipItem.clipitem));
        const end = getChild("#text", getChild("end", clipItem.clipitem));

        if (!overlapsIntervalFrames(start, end, command.time)) {
          // console.log("Does not overlap filter");
          return;
        }

        const effect = getChild("effect", filter);
        const parameters = getChild("parameter", effect);

        const textValueParameter = parameters?.find((parameter: any) => {
          const parameterId = getChild("parameterid", parameter.parameter);
          const id = getChild("#text", parameterId);

          return id === 1;
        });

        if (textValueParameter) {
          return textValueParameter;
        }
      }
    }
  }
}

export function replaceText(project: any, command: EditorCommand) {
  let foundTextToReplace = false;

  const textValueParameter = findMatchingTextNode(project, command);
  if (textValueParameter) {
    console.log("Found text value");
    const value = getChild("value", textValueParameter.parameter);
    const updatedValue = replaceEncodedText(
      value[0]["#text"],
      command.value,
      ""
    );
    value[0] = { "#text": updatedValue };
    foundTextToReplace = true;
  }

  return { project, replaced: foundTextToReplace };
}

export function getTextAtCommand(project: any, command: EditorCommand) {
  const textValueParameter = findMatchingTextNode(project, command);
  if (textValueParameter) {
    const value = getChild("value", textValueParameter.parameter);
    const text = getChild("#text", value);

    return getEncodedText(text);
  }

  return undefined;
}
