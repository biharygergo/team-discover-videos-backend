export function getEncodedText(original: string) {
    const decodedBase64 = atob(original);

    const textRegex = /(\x00)([A-z\s]{3,})(\x00)/g;
    const textMatches = textRegex.exec(decodedBase64);

    return textMatches?.[2];
}

export function replaceEncodedText(original: string, textToUse?: string, fontToUse?: string) {
    const decodedBase64 = atob(original);

    const textRegex = /(\x00)([A-z\s]{3,})(\x00)/g;
    const fontRegex = /(\x00)([A-z]*\d*-[A-z]*)(\x00)/g;

    let result = decodedBase64;
    if (textToUse) {
        result = result.replace(textRegex, `$1${textToUse}$3`);
    }

    if (fontToUse) {
        result = result.replace(fontRegex, `$1${fontToUse}$3`);
    }

    return btoa(result);
}
