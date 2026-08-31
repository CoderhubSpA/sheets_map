function headerObject(headers) {
    if (!headers) return {};
    if (typeof headers.forEach === "function") {
        const result = {};
        headers.forEach((value, key) => {
            result[key] = value;
        });
        return result;
    }
    if (Array.isArray(headers)) return Object.fromEntries(headers);
    return { ...headers };
}

export function mergeRequestHeaders(baseHeaders, addedHeaders) {
    const result = headerObject(baseHeaders);
    Object.entries(addedHeaders || {}).forEach(([key, value]) => {
        const existingKey = Object.keys(result).find(
            (candidate) => candidate.toLowerCase() === key.toLowerCase(),
        );
        if (existingKey) delete result[existingKey];
        result[key] = value;
    });
    return result;
}

export function getBearerToken(headers) {
    const authorization = Object.entries(headers || {}).find(
        ([key]) => key.toLowerCase() === "authorization",
    )?.[1];
    const match = typeof authorization === "string"
        ? authorization.match(/^Bearer\s+(.+)$/i)
        : null;
    return match ? match[1] : null;
}

export function getUrlOrigin(rawUrl, baseUrl = globalThis.location?.href) {
    try {
        return new URL(rawUrl, baseUrl).origin;
    } catch {
        return null;
    }
}

export function appendRequestGeneration(
    url,
    generation,
    parameter = "_sheets_auth_retry",
) {
    if (!url || !Number.isInteger(generation) || generation <= 0) return url;
    const hashIndex = url.indexOf("#");
    const baseUrl = hashIndex === -1 ? url : url.slice(0, hashIndex);
    const hash = hashIndex === -1 ? "" : url.slice(hashIndex);
    const separator = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${separator}${parameter}=${generation}${hash}`;
}

function trustedByClient(requestAuth, url) {
    try {
        return Boolean(
            requestAuth
            && typeof requestAuth.isTrustedUrl === "function"
            && requestAuth.isTrustedUrl(url),
        );
    } catch {
        return false;
    }
}

function layerRequestAuthMode(layer) {
    return typeof layer?.sh_map_request_auth_mode === "string"
        ? layer.sh_map_request_auth_mode.trim().toLowerCase()
        : "";
}

export function layerRequiresBearer(layer) {
    const value = layer?.sh_map_has_layer_requires_bearer;
    if (value === true || value === 1) return true;
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (normalized === "1" || normalized === "true") return true;
        if (normalized !== "") return false;
    }
    if (value !== null && value !== undefined) return false;
    return ["runtime-bearer", "ogp-bearer"].includes(
        layerRequestAuthMode(layer),
    );
}

const unavailableClientCache = new WeakMap();
const legacyClientCache = new WeakMap();

function clientForLayer(cache, layer, clientFactory) {
    if (!layer || typeof layer !== "object") return null;
    if (!cache.has(layer)) cache.set(layer, clientFactory());
    return cache.get(layer);
}

function trustedLayerOrigin(layer, url) {
    const layerOrigin = getUrlOrigin(layer?.sh_map_has_layer_url);
    return Boolean(layerOrigin && getUrlOrigin(url) === layerOrigin);
}

function unavailableRequestAuth(layer) {
    return clientForLayer(unavailableClientCache, layer, () => ({
        getHeaders: async () => ({}),
        peekHeaders: () => ({}),
        isTrustedUrl: (url) => trustedLayerOrigin(layer, url),
    }));
}

function legacyRequestAuth(layer) {
    return clientForLayer(legacyClientCache, layer, () => {
        const headers = (url) => {
            if (!trustedLayerOrigin(layer, url)) return {};
            const token = globalThis.__OGP_RUNTIME_AUTH__?.getBearerToken?.();
            return typeof token === "string" && token
                ? { Authorization: `Bearer ${token}` }
                : {};
        };
        return {
            getHeaders: async (url) => headers(url),
            peekHeaders: headers,
            isTrustedUrl: (url) => trustedLayerOrigin(layer, url),
            invalidate: (rejectedToken) => (
                globalThis.__OGP_RUNTIME_AUTH__?.invalidate?.(rejectedToken) ?? false
            ),
        };
    });
}

export function requestAuthForLayer(requestAuth, layer) {
    if (!layerRequiresBearer(layer)) return null;
    if (requestAuth) return requestAuth;
    if (layerRequestAuthMode(layer) === "ogp-bearer") {
        return legacyRequestAuth(layer);
    }
    return unavailableRequestAuth(layer);
}

export async function getRequestAuthHeaders(requestAuth, url) {
    if (
        !requestAuth ||
        typeof requestAuth.getHeaders !== "function" ||
        !trustedByClient(requestAuth, url)
    ) return {};
    const headers = headerObject(await requestAuth.getHeaders(url));
    return headers;
}

export function peekRequestAuthHeaders(requestAuth, url) {
    if (
        !requestAuth ||
        typeof requestAuth.peekHeaders !== "function" ||
        !trustedByClient(requestAuth, url)
    ) return {};
    const headers = headerObject(requestAuth.peekHeaders(url));
    return headers;
}

export function buildMapLibreRequest({
    url,
    resourceType,
    tileUrl,
    requestAuth,
    headers = {},
    baseUrl = globalThis.location?.href,
}) {
    const tileOrigin = getUrlOrigin(tileUrl, baseUrl);
    const requestOrigin = getUrlOrigin(url, baseUrl);
    if (resourceType !== "Tile" || !tileOrigin || requestOrigin !== tileOrigin) {
        return { url };
    }

    return {
        url,
        headers: mergeRequestHeaders(
            headers,
            peekRequestAuthHeaders(requestAuth, url),
        ),
    };
}

function requestStatus(resultOrError) {
    return resultOrError?.status ?? resultOrError?.response?.status ?? null;
}

export async function requestWithAuth({
    url,
    requestAuth,
    headers = {},
    request,
    requireBearer = false,
}) {
    if (typeof request !== "function") {
        throw new TypeError("requestWithAuth requires a request callback.");
    }

    const firstAuthHeaders = await getRequestAuthHeaders(requestAuth, url);
    if (requireBearer && !getBearerToken(firstAuthHeaders)) {
        throw new Error("Bearer authentication is required for this request.");
    }
    const firstHeaders = mergeRequestHeaders(headers, firstAuthHeaders);
    const rejectedToken = getBearerToken(firstAuthHeaders);
    let firstResult;
    let firstError;

    try {
        firstResult = await request(firstHeaders);
    } catch (error) {
        firstError = error;
    }

    const firstStatus = requestStatus(firstError || firstResult);
    if (firstStatus !== 401 || !rejectedToken) {
        if (firstError) throw firstError;
        return firstResult;
    }

    if (typeof requestAuth?.invalidate === "function") {
        await requestAuth.invalidate(rejectedToken);
    }
    const retryAuthHeaders = await getRequestAuthHeaders(requestAuth, url);
    if (requireBearer && !getBearerToken(retryAuthHeaders)) {
        throw new Error("Bearer authentication is required for this request.");
    }
    return request(mergeRequestHeaders(headers, retryAuthHeaders));
}

export function fetchWithAuth({
    url,
    requestAuth,
    fetchImpl = globalThis.fetch,
    init = {},
    requireBearer = false,
}) {
    if (typeof fetchImpl !== "function") {
        throw new TypeError("fetchWithAuth requires fetch support.");
    }
    return requestWithAuth({
        url,
        requestAuth,
        headers: init.headers,
        requireBearer,
        request: (headers) => fetchImpl(url, { ...init, headers }),
    });
}
