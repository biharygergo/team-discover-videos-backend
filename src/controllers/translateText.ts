import { EditorCommand } from "./projects";
import { TranslationServiceClient } from "@google-cloud/translate";
import { getTextAtCommand, replaceText } from "./replaceText";

const translationClient = new TranslationServiceClient();

const projectId = "discovervideos";
const location = "global";

export async function translateText(project: any, command: EditorCommand) {
  // Construct request
  const translateToLanguage = command.value;
  const textToTranslate = getTextAtCommand(project, command) ?? 'Error';

  console.log("TO TRANSLATE", textToTranslate);

  const request = {
    parent: `projects/${projectId}/locations/${location}`,
    contents: [textToTranslate],
    mimeType: "text/plain", // mime types: text/plain, text/html
    targetLanguageCode: translateToLanguage,
  };

  // Run request
  const [response] = await translationClient.translateText(request);

  const translation = response.translations?.length
    ? response.translations[0].translatedText
    : textToTranslate;

  console.log('TRANSLATION', translation);

  const replaceResponse = replaceText(project, {
    type: "text",
    value: translation || "Error",
    time: command.time,
    action: "replace",
  });

  return replaceResponse;
}
