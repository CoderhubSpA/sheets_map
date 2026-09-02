import L from 'leaflet';
import { fetchWithAuth } from './requestAuth.mjs';

function responseContentType(response, blob) {
    return response?.headers?.get?.('content-type') || blob?.type || '';
}

const AuthenticatedWmsTileLayer = L.TileLayer.WMS.extend({
    initialize(baseUrl, options = {}) {
        const {
            fetchImpl,
            requestAuth,
            urlApi,
            ...leafletOptions
        } = options;

        this._fetchImpl = fetchImpl || window.fetch.bind(window);
        this._requestAuth = requestAuth || null;
        this._urlApi = urlApi || window.URL;
        this._tileTransports = new Map();
        L.TileLayer.WMS.prototype.initialize.call(this, baseUrl, leafletOptions);
    },

    createTile(coords, done) {
        const tile = L.DomUtil.create('img', 'leaflet-tile');
        tile.alt = '';
        tile.setAttribute('role', 'presentation');

        if (this.options.crossOrigin || this.options.crossOrigin === '') {
            tile.crossOrigin = this.options.crossOrigin === true
                ? ''
                : this.options.crossOrigin;
        }
        if (typeof this.options.referrerPolicy === 'string') {
            tile.referrerPolicy = this.options.referrerPolicy;
        }

        const state = {
            controller: typeof AbortController === 'function' ? new AbortController() : null,
            done: false,
            objectUrl: null,
            stopped: false,
        };
        this._tileTransports.set(tile, state);
        void this._loadTile(tile, this.getTileUrl(coords), state, done);
        return tile;
    },

    async _loadTile(tile, url, state, done) {
        if (!this._requestAuth) {
            this._loadNativeTile(tile, url, state, done);
            return;
        }

        try {
            const response = await fetchWithAuth({
                url,
                requestAuth: this._requestAuth,
                requireBearer: true,
                fetchImpl: this._fetchImpl,
                init: {
                    cache: 'no-store',
                    signal: state.controller?.signal,
                },
            });
            if (!response.ok) {
                throw new Error(`WMS tile request failed with ${response.status}.`);
            }

            const blob = await response.blob();
            if (!responseContentType(response, blob).toLowerCase().startsWith('image/')) {
                throw new Error('WMS tile response was not an image.');
            }
            if (state.stopped) return;

            state.objectUrl = this._urlApi.createObjectURL(blob);
            tile.onload = () => {
                this._revokeObjectUrl(state);
                this._finishTile(state, done, null, tile);
            };
            tile.onerror = () => {
                this._revokeObjectUrl(state);
                this._finishTile(state, done, new Error('WMS tile image failed to load.'), tile);
            };
            tile.src = state.objectUrl;
        } catch (error) {
            if (state.stopped || error?.name === 'AbortError') return;
            this._finishTile(state, done, error, tile);
        }
    },

    _loadNativeTile(tile, url, state, done) {
        if (state.stopped) return;
        tile.onload = () => this._finishTile(state, done, null, tile);
        tile.onerror = () => this._finishTile(
            state,
            done,
            new Error('Anonymous WMS tile image failed to load.'),
            tile,
        );
        tile.src = url;
    },

    _finishTile(state, done, error, tile) {
        if (state.done || state.stopped) return;
        state.done = true;
        this._tileTransports.delete(tile);
        done(error, tile);
    },

    _revokeObjectUrl(state) {
        if (!state.objectUrl) return;
        this._urlApi.revokeObjectURL(state.objectUrl);
        state.objectUrl = null;
    },

    _stopTile(tile) {
        const state = this._tileTransports.get(tile);
        if (!state) return;
        state.stopped = true;
        state.controller?.abort();
        this._revokeObjectUrl(state);
        tile.onload = null;
        tile.onerror = null;
        tile.removeAttribute('src');
        this._tileTransports.delete(tile);
    },

    _removeTile(key) {
        const tile = this._tiles[key]?.el;
        if (tile) this._stopTile(tile);
        L.TileLayer.WMS.prototype._removeTile.call(this, key);
    },

    onRemove(map) {
        this._tileTransports.forEach((_state, tile) => this._stopTile(tile));
        L.TileLayer.WMS.prototype.onRemove.call(this, map);
    },
});

export function createAuthenticatedWmsLayer(baseUrl, options = {}) {
    return new AuthenticatedWmsTileLayer(baseUrl, options);
}

export default AuthenticatedWmsTileLayer;
