(() => {
  "use strict";

  const data = window.KOREA_GRID_DATA;
  const app = document.getElementById("korea-grid-app");
  if (!data || !window.maplibregl || !app) {
    if (app) app.setAttribute("data-map-error", "missing-runtime-or-data");
    return;
  }

  const colors = {
    "154": "#16866f",
    "345": "#146ef5",
    "765": "#c53a41",
    other: "#7a8794",
    hvdc: "#8b4bcc",
    btb: "#e47d19",
    selected: "#15283d"
  };

  const siteById = new Map();
  const neighbors = new Map();
  const incidentAc = new Map();
  const incidentHvdc = new Map();
  let selectedId = null;
  let activePopup = null;

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function addNeighbor(a, b, kind, id) {
    if (!neighbors.has(a)) neighbors.set(a, new Set());
    if (!neighbors.has(b)) neighbors.set(b, new Set());
    neighbors.get(a).add(b);
    neighbors.get(b).add(a);
    const registry = kind === "hvdc" ? incidentHvdc : incidentAc;
    if (!registry.has(a)) registry.set(a, new Set());
    if (!registry.has(b)) registry.set(b, new Set());
    registry.get(a).add(id);
    registry.get(b).add(id);
  }

  data.sites.features.forEach((feature) => siteById.set(feature.properties.fgn, feature));
  data.ac.features.forEach((feature) => addNeighbor(feature.properties.from_fgn, feature.properties.to_fgn, "ac", feature.properties.edge_id));
  data.hvdc.features.forEach((feature) => addNeighbor(feature.properties.from_fgn, feature.properties.to_fgn, "hvdc", feature.properties.asset_id));

  const bounds = data.sites.features.reduce((box, feature) => box.extend(feature.geometry.coordinates), new maplibregl.LngLatBounds());
  const map = new maplibregl.Map({
    container: "korea-grid-map",
    style: window.KOREA_GRID_BASEMAP_STYLE_URL || "assets/korea-grid-basemap-style.json",
    bounds,
    fitBoundsOptions: { padding: 12, maxZoom: 8 },
    minZoom: 5,
    maxZoom: 15,
    pitchWithRotate: false,
    dragRotate: false,
    touchPitch: false,
    attributionControl: false,
    maplibreLogo: false
  });
  window.KOREA_GRID_MAP = map;

  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-left");
  map.addControl(new maplibregl.AttributionControl({ compact: true, customAttribution: "KoreaGrid physical network" }), "bottom-right");

  const radiusExpression = ["match", ["get", "voltage_band"], "765", 5.8, "345", 4.2, "154", 2.9, 2.7];
  const colorExpression = ["match", ["get", "voltage_band"], "765", colors["765"], "345", colors["345"], "154", colors["154"], colors.other];
  const siteStrokeColor = ["case", ["boolean", ["get", "legacy_gist_reference"], false], colors.btb, "#ffffff"];
  const acWidth = ["match", ["get", "voltage_band"], "765", 2.05, "345", 1.35, "154", 0.8, 0.8];
  const acOpacity = ["match", ["get", "voltage_band"], "154", 0.31, 0.5];

  function addDashedRing(name, diameter, color, lineWidth, dash) {
    const pixelRatio = 2;
    const canvas = document.createElement("canvas");
    canvas.width = diameter * pixelRatio;
    canvas.height = diameter * pixelRatio;
    const context = canvas.getContext("2d");
    context.scale(pixelRatio, pixelRatio);
    context.strokeStyle = color;
    context.lineWidth = lineWidth;
    context.setLineDash(dash);
    context.beginPath();
    context.arc(diameter / 2, diameter / 2, (diameter - lineWidth * 2) / 2, 0, Math.PI * 2);
    context.stroke();
    map.addImage(name, context.getImageData(0, 0, canvas.width, canvas.height), { pixelRatio });
  }

  function addNetworkLayers() {
    map.addSource("kg-ac", { type: "geojson", data: data.ac });
    map.addSource("kg-hvdc", { type: "geojson", data: data.hvdc });
    map.addSource("kg-sites", { type: "geojson", data: data.sites });
    map.addSource("kg-btb", { type: "geojson", data: data.btb });

    ["154", "345", "765", "other"].forEach((band) => {
      map.addLayer({
        id: `kg-ac-${band}`,
        type: "line",
        source: "kg-ac",
        filter: band === "other" ? ["!", ["in", ["get", "voltage_band"], ["literal", ["154", "345", "765"]]]] : ["==", ["get", "voltage_band"], band],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": band === "other" ? colors.other : colors[band], "line-width": acWidth, "line-opacity": acOpacity }
      });
    });

    map.addLayer({
      id: "kg-hvdc",
      type: "line",
      source: "kg-hvdc",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": colors.hvdc, "line-width": 3, "line-opacity": 0.88, "line-dasharray": [3, 2] }
    });

    map.addLayer({
      id: "kg-sites",
      type: "circle",
      source: "kg-sites",
      paint: {
        "circle-radius": radiusExpression,
        "circle-color": ["case", ["boolean", ["get", "legacy_gist_reference"], false], "#ffffff", colorExpression],
        "circle-opacity": 0.88,
        "circle-stroke-color": siteStrokeColor,
        "circle-stroke-width": ["case", ["boolean", ["get", "legacy_gist_reference"], false], 2.4, 1],
        "circle-stroke-opacity": 0.96
      }
    });

    map.addLayer({
      id: "kg-orphan-rings",
      type: "symbol",
      source: "kg-sites",
      filter: ["==", ["get", "is_orphan"], true],
      layout: { "icon-image": "kg-orphan-ring", "icon-allow-overlap": true, "icon-ignore-placement": true },
      paint: { "icon-opacity": 0.96 }
    });

    map.addLayer({
      id: "kg-sites-related",
      type: "circle",
      source: "kg-sites",
      filter: ["in", ["get", "fgn"], ["literal", []]],
      paint: {
        "circle-radius": ["+", radiusExpression, 2],
        "circle-color": colorExpression,
        "circle-opacity": 0.95,
        "circle-stroke-color": colors.selected,
        "circle-stroke-width": 2.5,
        "circle-stroke-opacity": 1
      }
    });

    map.addLayer({
      id: "kg-sites-selected",
      type: "circle",
      source: "kg-sites",
      filter: ["==", ["get", "fgn"], ""],
      paint: {
        "circle-radius": ["+", radiusExpression, 4.5],
        "circle-color": colorExpression,
        "circle-opacity": 1,
        "circle-stroke-color": colors.selected,
        "circle-stroke-width": 4,
        "circle-stroke-opacity": 1
      }
    });

    map.addLayer({
      id: "kg-ac-selected",
      type: "line",
      source: "kg-ac",
      filter: ["in", ["get", "edge_id"], ["literal", []]],
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": colorExpression, "line-width": ["+", acWidth, 3], "line-opacity": 1 }
    });

    map.addLayer({
      id: "kg-hvdc-selected",
      type: "line",
      source: "kg-hvdc",
      filter: ["in", ["get", "asset_id"], ["literal", []]],
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": colors.hvdc, "line-width": 6, "line-opacity": 1, "line-dasharray": [3, 2] }
    });

    map.addLayer({
      id: "kg-btb",
      type: "symbol",
      source: "kg-btb",
      layout: { "icon-image": "kg-btb-ring", "icon-allow-overlap": true, "icon-ignore-placement": true },
      paint: { "icon-opacity": 0.95 }
    });
  }

  function sitePopup(properties) {
    const legacy = properties.legacy_gist_reference
      ? '<p class="kg-legacy"><strong>LEGACY GIST REFERENCE</strong><br>Exact 345-kV receiving-substation parcel unresolved.</p>'
      : "";
    return `<div class="kg-popup"><h3>${escapeHtml(properties.name)}</h3><dl>
      <dt>FGN</dt><dd>${escapeHtml(properties.fgn)}</dd>
      <dt>NMI</dt><dd>${escapeHtml(properties.nmi || "—")}</dd>
      <dt>Type</dt><dd>${escapeHtml(properties.facility_type || "—")}</dd>
      <dt>Voltage</dt><dd>${escapeHtml(properties.voltage_classes || properties.highest_voltage_kv + " kV")}</dd>
      <dt>Coordinate</dt><dd>${escapeHtml(properties.coordinate_tier)}</dd>
      <dt>Connections</dt><dd>${properties.connected_physical_pair_count} physical pairs</dd>
    </dl>${legacy}</div>`;
  }

  function showSitePopup(feature) {
    if (activePopup) activePopup.remove();
    activePopup = new maplibregl.Popup({ maxWidth: "290px", closeButton: true })
      .setLngLat(feature.geometry.coordinates)
      .setHTML(sitePopup(feature.properties))
      .addTo(map);
  }

  function linePopup(properties, kind) {
    if (kind === "hvdc") {
      return `<div class="kg-line-popup"><strong>${escapeHtml(properties.scheme)}</strong><br>${escapeHtml(properties.dc_voltage_kv)} kV DC · ${escapeHtml(properties.capacity_mw)} MW<br>${escapeHtml(properties.technology)}<br>Straight connectivity link, not an actual route.</div>`;
    }
    return `<div class="kg-line-popup"><strong>${escapeHtml(properties.from_name)} ↔ ${escapeHtml(properties.to_name)}</strong><br>${escapeHtml(properties.voltage_classes || "Voltage not restated")} kV · ${escapeHtml(properties.circuit_count || "—")} circuit(s)<br>Straight connectivity link, not an actual route.</div>`;
  }

  function clearSiteSelection() {
    selectedId = null;
    map.setPaintProperty("kg-sites", "circle-opacity", 0.88);
    map.setPaintProperty("kg-sites", "circle-stroke-opacity", 0.96);
    map.setPaintProperty("kg-orphan-rings", "icon-opacity", 0.96);
    ["154", "345", "765", "other"].forEach((band) => map.setPaintProperty(`kg-ac-${band}`, "line-opacity", acOpacity));
    map.setPaintProperty("kg-hvdc", "line-opacity", 0.88);
    map.setFilter("kg-sites-related", ["in", ["get", "fgn"], ["literal", []]]);
    map.setFilter("kg-sites-selected", ["==", ["get", "fgn"], ""]);
    map.setFilter("kg-ac-selected", ["in", ["get", "edge_id"], ["literal", []]]);
    map.setFilter("kg-hvdc-selected", ["in", ["get", "asset_id"], ["literal", []]]);
    clearSelection.disabled = true;
    selection.querySelector("p").innerHTML = "Select a site to emphasize its physical neighbors.";
    renderList(searchInput.value);
  }

  function selectSite(fgn, openPopup) {
    const feature = siteById.get(fgn);
    if (!feature || !map.getLayer("kg-sites")) return;
    selectedId = fgn;
    const related = [...(neighbors.get(fgn) || new Set())];
    const acIds = [...(incidentAc.get(fgn) || new Set())];
    const hvdcIds = [...(incidentHvdc.get(fgn) || new Set())];
    map.setPaintProperty("kg-sites", "circle-opacity", 0.035);
    map.setPaintProperty("kg-sites", "circle-stroke-opacity", 0.09);
    map.setPaintProperty("kg-orphan-rings", "icon-opacity", 0.09);
    ["154", "345", "765", "other"].forEach((band) => map.setPaintProperty(`kg-ac-${band}`, "line-opacity", 0.018));
    map.setPaintProperty("kg-hvdc", "line-opacity", 0.025);
    map.setFilter("kg-sites-related", ["in", ["get", "fgn"], ["literal", related]]);
    map.setFilter("kg-sites-selected", ["==", ["get", "fgn"], fgn]);
    map.setFilter("kg-ac-selected", ["in", ["get", "edge_id"], ["literal", acIds]]);
    map.setFilter("kg-hvdc-selected", ["in", ["get", "asset_id"], ["literal", hvdcIds]]);
    const p = feature.properties;
    selection.querySelector("p").innerHTML = `<strong>${escapeHtml(p.name)}</strong><br>${related.length} connected neighboring site${related.length === 1 ? "" : "s"} · ${escapeHtml(p.coordinate_tier)}`;
    clearSelection.disabled = false;
    renderList(searchInput.value);
    map.panTo(feature.geometry.coordinates, { animate: !window.matchMedia("(prefers-reduced-motion: reduce)").matches });
    if (openPopup) showSitePopup(feature);
    if (window.innerWidth <= 920) app.classList.remove("is-sidebar-open");
  }

  const searchInput = document.getElementById("kg-search");
  const clearSearch = document.getElementById("kg-clear");
  const siteList = document.getElementById("kg-site-list");
  const searchStatus = document.getElementById("kg-search-status");
  const selection = document.getElementById("kg-selection");
  const clearSelection = document.getElementById("kg-clear-selection");
  const sitesSorted = [...data.sites.features].sort((a, b) => a.properties.name.localeCompare(b.properties.name, "ko"));

  function renderList(query = "") {
    const needle = query.trim().toLocaleLowerCase("ko");
    const matches = sitesSorted.filter((feature) => {
      if (!needle) return true;
      const p = feature.properties;
      return [p.name, p.fgn, p.nmi].some((value) => String(value || "").toLocaleLowerCase("ko").includes(needle));
    });
    siteList.textContent = "";
    const fragment = document.createDocumentFragment();
    matches.forEach((feature) => {
      const p = feature.properties;
      const li = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.fgn = p.fgn;
      button.className = p.fgn === selectedId ? "is-selected" : "";
      button.setAttribute("aria-label", `${p.name}, ${p.highest_voltage_kv} kV, ${p.fgn}`);
      button.innerHTML = `<span class="kg-dot" data-band="${escapeHtml(p.voltage_band)}"></span><span class="kg-name">${escapeHtml(p.name)}</span><span class="kg-kv">${p.highest_voltage_kv || "—"} kV</span>`;
      button.addEventListener("click", () => selectSite(p.fgn, true));
      li.appendChild(button);
      fragment.appendChild(li);
    });
    siteList.appendChild(fragment);
    searchStatus.textContent = needle ? `${matches.length} matching site${matches.length === 1 ? "" : "s"}` : `Showing all ${matches.length} sites`;
  }

  function createMapFurniture() {
    const layerControl = document.createElement("div");
    layerControl.className = "kg-layer-control";
    layerControl.setAttribute("aria-label", "Network layer visibility");
    const groups = [
      ["Physical sites", ["kg-sites", "kg-orphan-rings", "kg-sites-related", "kg-sites-selected"]],
      ["154 kV AC pairs", ["kg-ac-154"]],
      ["345 kV AC pairs", ["kg-ac-345"]],
      ["765 kV AC pairs", ["kg-ac-765"]],
      ["Other AC pairs", ["kg-ac-other"]],
      ["HVDC links", ["kg-hvdc", "kg-hvdc-selected"]],
      ["BTB asset", ["kg-btb"]]
    ];
    groups.forEach(([label, ids]) => {
      const row = document.createElement("label");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = true;
      checkbox.addEventListener("change", () => ids.forEach((id) => map.setLayoutProperty(id, "visibility", checkbox.checked ? "visible" : "none")));
      row.append(checkbox, document.createTextNode(label));
      layerControl.appendChild(row);
    });
    layerControl.addEventListener("pointerdown", (event) => event.stopPropagation());
    document.querySelector(".kg-map-wrap").appendChild(layerControl);

    const legend = document.createElement("div");
    legend.className = "kg-legend";
    legend.innerHTML = `<strong>Network layers</strong>
      <span><i data-band="154"></i>154 kV</span><span><i data-band="345"></i>345 kV</span>
      <span><i data-band="765"></i>765 kV</span><span><i data-band="hvdc"></i>HVDC</span>
      <span><i data-band="btb"></i>BTB host</span><span><i data-band="orphan"></i>Zero-degree site</span>
      <span><i data-band="gist"></i>Legacy GIST reference</span>`;
    document.querySelector(".kg-map-wrap").appendChild(legend);
  }

  function fitKorea() {
    map.fitBounds(bounds, { padding: 12, maxZoom: 8, duration: 500 });
  }

  map.on("load", () => {
    addDashedRing("kg-orphan-ring", 16, colors.selected, 2, [3, 2]);
    addDashedRing("kg-btb-ring", 22, colors.btb, 3, [4, 3]);
    addNetworkLayers();
    createMapFurniture();

    ["kg-sites", "kg-sites-related", "kg-sites-selected"].forEach((id) => {
      map.on("click", id, (event) => {
        const feature = event.features && event.features[0];
        if (feature) selectSite(feature.properties.fgn, true);
      });
      map.on("mouseenter", id, () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", id, () => { map.getCanvas().style.cursor = ""; });
    });

    ["kg-ac-154", "kg-ac-345", "kg-ac-765", "kg-ac-other", "kg-ac-selected"].forEach((id) => {
      map.on("click", id, (event) => {
        const feature = event.features && event.features[0];
        if (feature) new maplibregl.Popup({ maxWidth: "310px" }).setLngLat(event.lngLat).setHTML(linePopup(feature.properties, "ac")).addTo(map);
      });
    });
    ["kg-hvdc", "kg-hvdc-selected"].forEach((id) => map.on("click", id, (event) => {
      const feature = event.features && event.features[0];
      if (feature) new maplibregl.Popup({ maxWidth: "310px" }).setLngLat(event.lngLat).setHTML(linePopup(feature.properties, "hvdc")).addTo(map);
    }));
    map.on("click", "kg-btb", (event) => {
      const p = event.features[0].properties;
      new maplibregl.Popup({ maxWidth: "310px" }).setLngLat(event.lngLat).setHTML(`<div class="kg-line-popup"><strong>${escapeHtml(p.scheme)}</strong><br>${escapeHtml(p.host_name)} · ${escapeHtml(p.dc_voltage_kv)} kV DC · ${escapeHtml(p.capacity_mw)} MW<br>Same-site BTB host marker; no internal node or self-loop shown.</div>`).addTo(map);
    });

    renderList();
    app.setAttribute("data-map-ready", "true");
    app.setAttribute("data-renderer", "maplibre-gl-js-5.24.0");
    app.setAttribute("data-site-count", String(data.sites.features.length));
    app.setAttribute("data-ac-count", String(data.ac.features.length));
    app.setAttribute("data-hvdc-count", String(data.hvdc.features.length));
    app.setAttribute("data-btb-count", String(data.btb.features.length));
  });

  map.on("error", (event) => {
    const message = event.error && event.error.message ? event.error.message : "map-runtime-error";
    if (!message.includes("Failed to load glyph range") && !message.includes("sprite")) app.setAttribute("data-map-runtime-warning", message);
  });

  searchInput.addEventListener("input", () => renderList(searchInput.value));
  clearSearch.addEventListener("click", () => { searchInput.value = ""; searchInput.focus(); renderList(); });
  clearSelection.addEventListener("click", clearSiteSelection);
  document.getElementById("kg-fit").addEventListener("click", fitKorea);
  const sidebarToggle = document.getElementById("kg-toggle-sidebar");
  sidebarToggle.addEventListener("click", () => {
    const open = app.classList.toggle("is-sidebar-open");
    sidebarToggle.setAttribute("aria-expanded", String(open));
    window.setTimeout(() => map.resize(), 220);
  });
  window.addEventListener("resize", () => map.resize());
})();
