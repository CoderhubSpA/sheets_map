const MIME_EXTENSIONS = Object.freeze({
    "application/geo+json": "geojson",
    "application/geopackage+sqlite3": "gpkg",
    "application/json": "json",
    "application/vnd.google-earth.kml+xml": "kml",
    "application/x-sqlite3": "gpkg",
    "application/zip": "zip",
    "text/csv": "csv",
});

function sanitizeFilename(value) {
    const basename = String(value || "").split(/[\\/]/).pop();
    const safeBasename = Array.from(basename, (character) => {
        const code = character.charCodeAt(0);
        return code <= 31 || code === 127 || '<>:"|?*'.includes(character)
            ? "_"
            : character;
    }).join("");
    return safeBasename
        .trim()
        .replace(/[. ]+$/g, "")
        .slice(0, 180);
}

function headerValue(headers, name) {
    if (!headers) return "";
    try {
        const value = headers.get?.(name);
        if (typeof value === "string") return value;
    } catch {
        return "";
    }

    return Object.entries(headers).find(
        ([key]) => key.toLowerCase() === name.toLowerCase(),
    )?.[1] || "";
}

function decodeExtendedFilename(rawValue) {
    const value = rawValue.trim().replace(/^"|"$/g, "");
    const encodedValue = value.match(/^[^']*'[^']*'(.*)$/)?.[1] ?? value;
    try {
        return decodeURIComponent(encodedValue);
    } catch {
        return encodedValue;
    }
}

export function filenameFromContentDisposition(value) {
    if (typeof value !== "string" || !value) return "";

    const extendedMatch = value.match(/filename\*\s*=\s*([^;]+)/i);
    if (extendedMatch) {
        return sanitizeFilename(decodeExtendedFilename(extendedMatch[1]));
    }

    const filenameMatch = value.match(/filename\s*=\s*("(?:[^"\\]|\\.)*"|[^;]+)/i);
    if (!filenameMatch) return "";
    const filename = filenameMatch[1].trim().replace(/^"|"$/g, "")
        .replace(/\\(["\\])/g, "$1");
    return sanitizeFilename(filename);
}

function filenameFromUrl(url) {
    try {
        const parsed = new URL(url, globalThis.location?.href || "https://local.invalid/");
        return sanitizeFilename(decodeURIComponent(parsed.pathname.split("/").pop() || ""));
    } catch {
        return "";
    }
}

function filenameExtension(filename) {
    return filename.match(/\.([a-z0-9]{1,10})$/i)?.[1]?.toLowerCase() || "";
}

export function resolveDownloadFilename({
    headers,
    contentType,
    fallbackName,
    fallbackExtension,
    url,
} = {}) {
    const serverFilename = filenameFromContentDisposition(
        headerValue(headers, "content-disposition"),
    );
    if (serverFilename) return serverFilename;

    const urlFilename = filenameFromUrl(url);
    const name = sanitizeFilename(fallbackName) || urlFilename || "layer";
    if (filenameExtension(name)) return name;

    const normalizedFallbackExtension = String(fallbackExtension || "")
        .replace(/^\./, "")
        .replace(/[^a-z0-9]/gi, "")
        .toLowerCase();
    const normalizedContentType = String(contentType || "")
        .split(";", 1)[0]
        .trim()
        .toLowerCase();
    const extension = normalizedFallbackExtension
        || MIME_EXTENSIONS[normalizedContentType]
        || filenameExtension(urlFilename);

    return extension ? `${name}.${extension}` : name;
}
