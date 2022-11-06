import format from "xml-formatter";
import { XMLParser, XMLBuilder } from "fast-xml-parser";

const options = {
  alwaysCreateTextNode: true,
  ignoreAttributes: false,
  ignoreDeclaration: false,
  attributeNamePrefix: "@@",
  processEntities: true,
  preserveOrder: true,
  format: true,
};

const parser = new XMLParser(options);
const builder = new XMLBuilder(options);

export function parseXml(xml: string) {
  const parsedXml = parser.parse(xml);
  return parsedXml;
}

export function buildXml(parsedXml: any) {
  const xmlContent = builder.build(parsedXml);
  const withDocType = xmlContent.toString().split("\n");
  withDocType.splice(1, 0, "<!DOCTYPE xmeml>");
  const finalXml = withDocType.join("\n");
  return format(finalXml, { indentation: "\t", collapseContent: true });
}

export function getChild(
  childKey: string,
  funkyJson?: { [objectKey: string]: any }[],
  keepArray: boolean = false
): any {
  if (!funkyJson) return undefined;
  const results = funkyJson.filter((child) => child.hasOwnProperty(childKey));

  if (results.length > 1 || (results && keepArray)) {
    return results;
  } else if (results.length) {
    return results[0]?.[childKey];
  }

  return undefined;
}
