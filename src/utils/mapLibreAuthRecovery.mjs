import {
    appendRequestGeneration,
    getBearerToken,
    refreshRequestAuthHeaders,
} from "./requestAuth.mjs";

function errorStatus(event) {
    return event?.error?.status ?? event?.error?.statusCode ?? null;
}

function errorSourceId(event) {
    return event?.sourceId ?? event?.source?.id ?? null;
}

function requestGeneration(url, parameter) {
    try {
        const parsed = new URL(
            url,
            globalThis.location?.href || "https://local.invalid/",
        );
        const value = Number(parsed.searchParams.get(parameter));
        return Number.isInteger(value) && value > 0 ? value : null;
    } catch {
        return null;
    }
}

export function createMapLibreAuthRecoveryController({
    sourceId,
    tokenParameter = "_sheets_auth_token",
    refreshParameter = "_sheets_auth_retry",
    maxTokenGenerations = 32,
} = {}) {
    if (!sourceId) throw new TypeError("MapLibre auth recovery requires a source id.");

    let epoch = 0;
    let sourceGeneration = 0;
    let nextTokenGeneration = 0;
    const tokenGenerations = new Map();
    const tokensByGeneration = new Map();
    const recoveries = new Map();
    const failedTokens = new Set();

    function removeToken(token) {
        const generation = tokenGenerations.get(token);
        tokenGenerations.delete(token);
        if (generation) tokensByGeneration.delete(generation);
    }

    function rememberToken(token) {
        if (tokenGenerations.has(token)) return tokenGenerations.get(token);
        if (tokenGenerations.size >= maxTokenGenerations) {
            removeToken(tokenGenerations.keys().next().value);
        }
        nextTokenGeneration += 1;
        tokenGenerations.set(token, nextTokenGeneration);
        tokensByGeneration.set(nextTokenGeneration, token);
        return nextTokenGeneration;
    }

    function rejectedToken(url) {
        const generation = requestGeneration(url, tokenParameter);
        return generation ? tokensByGeneration.get(generation) || null : null;
    }

    function markFailedToken(token) {
        if (failedTokens.size >= maxTokenGenerations) {
            failedTokens.delete(failedTokens.values().next().value);
        }
        failedTokens.add(token);
    }

    return Object.freeze({
        decorateSourceUrl(url) {
            return appendRequestGeneration(url, sourceGeneration, refreshParameter);
        },

        rememberRequest(url, resourceType, request) {
            if (resourceType !== "Tile") return request;
            const token = getBearerToken(request?.headers);
            if (!token) return request;
            const requestUrl = appendRequestGeneration(
                request?.url || url,
                rememberToken(token),
                tokenParameter,
            );
            return { ...request, url: requestUrl };
        },

        recover({
            event,
            requestAuth,
            requestUrl,
            getMap,
            onError,
        }) {
            if (errorStatus(event) !== 401 || errorSourceId(event) !== sourceId) {
                return Promise.resolve(false);
            }

            const token = rejectedToken(event?.error?.url);
            if (!token) return Promise.resolve(false);
            if (failedTokens.has(token)) return Promise.resolve(false);
            if (recoveries.has(token)) return recoveries.get(token);

            const recoveryEpoch = epoch;
            const currentMap = typeof getMap === "function" ? getMap() : null;
            let recovery;
            recovery = (async () => {
                try {
                    const baseUrl = typeof requestUrl === "function" ? requestUrl() : requestUrl;
                    const headers = await refreshRequestAuthHeaders(requestAuth, baseUrl, token);
                    const refreshedToken = getBearerToken(headers);
                    if (!refreshedToken || refreshedToken === token) {
                        throw new Error("Bearer authentication could not be renewed.");
                    }
                    if (
                        recoveryEpoch !== epoch ||
                        !currentMap ||
                        (typeof getMap === "function" && getMap() !== currentMap)
                    ) return false;

                    const source = currentMap.getSource?.(sourceId);
                    if (!source || typeof source.setTiles !== "function") return false;
                    sourceGeneration += 1;
                    const nextUrl = typeof requestUrl === "function" ? requestUrl() : requestUrl;
                    source.setTiles([
                        appendRequestGeneration(nextUrl, sourceGeneration, refreshParameter),
                    ]);
                    failedTokens.delete(token);
                    removeToken(token);
                    return true;
                } catch (error) {
                    if (recoveryEpoch === epoch) {
                        markFailedToken(token);
                        if (!getMap || getMap() === currentMap) onError?.(error);
                    }
                    return false;
                } finally {
                    if (recoveries.get(token) === recovery) recoveries.delete(token);
                }
            })();

            recoveries.set(token, recovery);
            return recovery;
        },

        reset() {
            epoch += 1;
            sourceGeneration = 0;
            tokenGenerations.clear();
            tokensByGeneration.clear();
            recoveries.clear();
            failedTokens.clear();
        },
    });
}
