# Korea Grid Leaflet v1.1 rollback

This directory preserves the production files from commit `ca22c40f35465997a8756f42189e9b941b96358c` before the MapLibre v2 promotion.

To roll back, restore:

- `korea-grid.css` to `assets/css/korea-grid.css`
- `korea-grid.js` to `assets/js/korea-grid.js`
- `korea-grid-page.html` to `_pages/korea-grid.html`
- `korea-grid-app.html` to `_includes/korea-grid-app.html`

The original Leaflet runtime remains available at `assets/vendor/leaflet/`.
