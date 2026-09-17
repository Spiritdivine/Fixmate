import L from 'leaflet';

export interface TileFallbackOptions extends L.TileLayerOptions {
  fallbackUrls?: string[];
  onFallbackUsed?: (url: string) => void;
  onAllFailed?: () => void;
}

/**
 * Enhanced Leaflet TileLayer with resilient multi-CDN failover.
 * If CartoDB CDN tiles encounter network errors or rate limits,
 * it automatically re-routes tile image requests to OpenStreetMap standard tiles.
 */
export class TileLayerWithFallback extends L.TileLayer {
  private fallbackUrls: string[];
  private onFallbackUsed?: (url: string) => void;
  private onAllFailed?: () => void;
  private failedTileCounts = new Map<string, number>();

  constructor(primaryUrl: string, options: TileFallbackOptions = {}) {
    super(primaryUrl, options);
    this.fallbackUrls = options.fallbackUrls || [
      'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      'https://a.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
    ];
    this.onFallbackUsed = options.onFallbackUsed;
    this.onAllFailed = options.onAllFailed;
  }

  createTile(coords: L.Coords, done: L.DoneCallback): HTMLElement {
    const tile = document.createElement('img');

    L.DomEvent.on(tile, 'load', L.Util.bind(this._tileOnLoad, this, done, tile));
    L.DomEvent.on(tile, 'error', () => {
      const tileKey = `${coords.z}/${coords.x}/${coords.y}`;
      const failCount = (this.failedTileCounts.get(tileKey) || 0) + 1;
      this.failedTileCounts.set(tileKey, failCount);

      if (failCount <= this.fallbackUrls.length) {
        const fallbackTemplate = this.fallbackUrls[failCount - 1];
        if (this.onFallbackUsed && failCount === 1) {
          this.onFallbackUsed(fallbackTemplate);
        }
        // Switch tile source to fallback CDN template
        tile.src = L.Util.template(fallbackTemplate, {
          ...coords,
          s: this.options.subdomains ? this.options.subdomains[0] : 'a',
          r: '',
        });
      } else {
        if (this.onAllFailed) {
          this.onAllFailed();
        }
        this._tileOnError(done, tile, new Error('All tile CDNs failed'));
      }
    });

    if (this.options.crossOrigin || this.options.crossOrigin === '') {
      tile.crossOrigin =
        this.options.crossOrigin === true ? '' : this.options.crossOrigin;
    }

    tile.alt = '';
    tile.setAttribute('role', 'presentation');
    tile.src = this.getTileUrl(coords);

    return tile;
  }
}
