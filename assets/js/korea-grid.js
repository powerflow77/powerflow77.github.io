(() => {
  "use strict";

  const data = window.KOREA_GRID_DATA;
  const app = document.getElementById("korea-grid-app");
  if (!data || !window.maplibregl || !app) {
    if (app) app.setAttribute("data-map-error", "missing-runtime-or-data");
    return;
  }

  const colors = {
    "154": "#237F83",
    "345": "#C58A2B",
    "765": "#A8394D",
    other: "#697A79",
    hvdc: "#5D4C91",
    btb: "#5D4C91",
    selected: "#15283d"
  };

  const lineStyleVariants = {
    light: {
      widths: { "154": 1.1, "345": 1.8, "765": 2.7, other: 1.1, hvdc: 2.35 },
      opacity: { "154": 0.58, "345": 0.74, "765": 0.84, other: 0.52, hvdc: 0.8 }
    },
    balanced: {
      widths: { "154": 1.05, "345": 2.25, "765": 3.35, other: 0.92, hvdc: 2.8 },
      opacity: { "154": 0.62, "345": 0.92, "765": 0.97, other: 0.47, hvdc: 0.94 }
    },
    strong: {
      widths: { "154": 1.7, "345": 2.6, "765": 3.7, other: 1.7, hvdc: 3.3 },
      opacity: { "154": 0.78, "345": 0.89, "765": 0.95, other: 0.69, hvdc: 0.93 }
    }
  };
  const requestedVariant = new URLSearchParams(window.location.search).get("variant") || "balanced";
  const lineStyleName = Object.hasOwn(lineStyleVariants, requestedVariant) ? requestedVariant : "balanced";
  const lineStyle = lineStyleVariants[lineStyleName];
  window.KOREA_GRID_LINE_STYLE = { name: lineStyleName, colors: { ...colors }, widths: { ...lineStyle.widths }, opacity: { ...lineStyle.opacity } };

  const siteById = new Map();
  const acById = new Map();
  const hvdcById = new Map();
  const neighbors = new Map();
  const incidentAc = new Map();
  const incidentHvdc = new Map();
  let selectionState = null;
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
  data.ac.features.forEach((feature) => {
    acById.set(feature.properties.edge_id, feature);
    addNeighbor(feature.properties.from_fgn, feature.properties.to_fgn, "ac", feature.properties.edge_id);
  });
  data.hvdc.features.forEach((feature) => {
    hvdcById.set(feature.properties.asset_id, feature);
    addNeighbor(feature.properties.from_fgn, feature.properties.to_fgn, "hvdc", feature.properties.asset_id);
  });

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

  const radiusExpression = ["match", ["get", "voltage_band"], "765", 5.8, "345", 4.2, "154", 2.9, 2.7];
  const colorExpression = ["match", ["get", "voltage_band"], "765", colors["765"], "345", colors["345"], "154", colors["154"], colors.other];
  const siteStrokeColor = "#ffffff";
  function zoomWidth(base, extra = 0) {
    return ["interpolate", ["linear"], ["zoom"], 5, base * 0.82 + extra, 7, base + extra, 10, base * 1.32 + extra, 14, base * 1.58 + extra];
  }
  function acWidthAt(scale, extra = 0) {
    return [
      "match", ["get", "voltage_band"],
      "765", lineStyle.widths["765"] * scale + extra,
      "345", lineStyle.widths["345"] * scale + extra,
      "154", lineStyle.widths["154"] * scale + extra,
      lineStyle.widths.other * scale + extra
    ];
  }
  const acWidth = ["interpolate", ["linear"], ["zoom"], 5, acWidthAt(0.82), 7, acWidthAt(1), 10, acWidthAt(1.32), 14, acWidthAt(1.58)];
  const acSelectedWidth = ["interpolate", ["linear"], ["zoom"], 5, acWidthAt(0.82, 2.8), 7, acWidthAt(1, 2.8), 10, acWidthAt(1.32, 2.8), 14, acWidthAt(1.58, 2.8)];
  const acOpacity = [
    "match", ["get", "voltage_band"],
    "765", lineStyle.opacity["765"],
    "345", lineStyle.opacity["345"],
    "154", lineStyle.opacity["154"],
    lineStyle.opacity.other
  ];
  const hvdcWidth = zoomWidth(lineStyle.widths.hvdc);
  const hvdcSelectedWidth = zoomWidth(lineStyle.widths.hvdc, 3);

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
      paint: { "line-color": colors.hvdc, "line-width": hvdcWidth, "line-opacity": lineStyle.opacity.hvdc, "line-dasharray": [3, 2] }
    });

    map.addLayer({
      id: "kg-sites",
      type: "circle",
      source: "kg-sites",
      paint: {
        "circle-radius": radiusExpression,
        "circle-color": colorExpression,
        "circle-opacity": 0.88,
        "circle-stroke-color": siteStrokeColor,
        "circle-stroke-width": 1,
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
      paint: { "line-color": colorExpression, "line-width": acSelectedWidth, "line-opacity": 1 }
    });

    map.addLayer({
      id: "kg-hvdc-selected",
      type: "line",
      source: "kg-hvdc",
      filter: ["in", ["get", "asset_id"], ["literal", []]],
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": colors.hvdc, "line-width": hvdcSelectedWidth, "line-opacity": 1, "line-dasharray": [3, 2] }
    });

    map.addLayer({
      id: "kg-btb",
      type: "symbol",
      source: "kg-btb",
      layout: { "icon-image": "kg-btb-ring", "icon-allow-overlap": true, "icon-ignore-placement": true },
      paint: { "icon-opacity": 0.95 }
    });
  }

  const facilityTypeLabels = {
    SUBSTATION: "Substation",
    SWITCHING_STATION: "Switching station",
    HVDC_CONVERTER: "HVDC converter station",
    HVDC_CONVERTER_STATION: "HVDC converter station",
    PLANT_HV_GIS_SWITCHYARD: "Power plant switchyard",
    PLANT_SIDE_SUBSTATION: "Power plant substation",
    PLANT_SWITCHYARD: "Power plant switchyard",
    THERMAL_PLANT_SWITCHYARD: "Power plant switchyard",
    GENERATOR_PLANT_154KV_SWITCHYARD: "Power plant switchyard",
    CURRENT_PHYSICAL_STATION: "Electrical facility",
    SOURCE_SCOPED_UNRESOLVED: "Electrical facility",
    UNRESOLVED: "Electrical facility"
  };

  function publicFacilityType(value) {
    return facilityTypeLabels[value] || "Electrical facility";
  }

  function highestVoltage(properties) {
    const value = Number(properties.highest_voltage_kv || 0);
    return value > 0 ? `${value} kV` : "Not specified";
  }

  function sitePopup(properties) {
    return `<div class="kg-popup"><h3>${escapeHtml(properties.name)}</h3><dl>
      <dt>Facility type</dt><dd>${escapeHtml(publicFacilityType(properties.facility_type))}</dd>
      <dt>Highest voltage</dt><dd>${escapeHtml(highestVoltage(properties))}</dd>
      <dt>Mapped connections</dt><dd>${Number(properties.connected_physical_pair_count || 0)}</dd>
    </dl></div>`;
  }

  function closeActivePopup() {
    if (!activePopup) return;
    const popup = activePopup;
    activePopup = null;
    popup.remove();
  }

  function showPopupAt(lngLat, html, maxWidth = "310px") {
    closeActivePopup();
    activePopup = new maplibregl.Popup({ maxWidth, closeButton: true })
      .setLngLat(lngLat)
      .setHTML(html)
      .addTo(map);
    activePopup.on("close", () => { activePopup = null; });
  }

  function showSitePopup(feature) {
    showPopupAt(feature.geometry.coordinates, sitePopup(feature.properties), "290px");
  }

  function linePopup(properties, kind) {
    if (kind === "hvdc") {
      const fromName = properties.from_name || siteById.get(properties.from_fgn)?.properties.name || "Facility";
      const toName = properties.to_name || siteById.get(properties.to_fgn)?.properties.name || "Facility";
      return `<div class="kg-line-popup"><strong>${escapeHtml(fromName)} ↔ ${escapeHtml(toName)}</strong><br>${escapeHtml(properties.dc_voltage_kv)} kV DC<br>Shown schematically, not as an actual route.</div>`;
    }
    return `<div class="kg-line-popup"><strong>${escapeHtml(properties.from_name)} ↔ ${escapeHtml(properties.to_name)}</strong><br>${escapeHtml(properties.voltage_classes || "Voltage not specified")} kV · ${escapeHtml(properties.circuit_count || "—")} circuit(s)<br>Shown schematically, not as an actual route.</div>`;
  }

  function setSelectionAttributes(kind = "", id = "") {
    app.setAttribute("data-selection-kind", kind);
    app.setAttribute("data-selection-id", id);
  }

  function dimBaseNetwork() {
    map.setPaintProperty("kg-sites", "circle-opacity", 0.035);
    map.setPaintProperty("kg-sites", "circle-stroke-opacity", 0.09);
    map.setPaintProperty("kg-orphan-rings", "icon-opacity", 0.09);
    map.setPaintProperty("kg-btb", "icon-opacity", 0.12);
    ["154", "345", "765", "other"].forEach((band) => map.setPaintProperty(`kg-ac-${band}`, "line-opacity", 0.055));
    map.setPaintProperty("kg-hvdc", "line-opacity", 0.07);
  }

  function restoreBaseNetwork() {
    map.setPaintProperty("kg-sites", "circle-opacity", 0.88);
    map.setPaintProperty("kg-sites", "circle-stroke-opacity", 0.96);
    map.setPaintProperty("kg-orphan-rings", "icon-opacity", 0.96);
    map.setPaintProperty("kg-btb", "icon-opacity", 0.95);
    ["154", "345", "765", "other"].forEach((band) => map.setPaintProperty(`kg-ac-${band}`, "line-opacity", acOpacity));
    map.setPaintProperty("kg-hvdc", "line-opacity", lineStyle.opacity.hvdc);
  }

  function resetSelectionFilters() {
    map.setFilter("kg-sites-related", ["in", ["get", "fgn"], ["literal", []]]);
    map.setFilter("kg-sites-selected", ["==", ["get", "fgn"], ""]);
    map.setFilter("kg-ac-selected", ["in", ["get", "edge_id"], ["literal", []]]);
    map.setFilter("kg-hvdc-selected", ["in", ["get", "asset_id"], ["literal", []]]);
  }

  function clearSelectionState(options = {}) {
    selectionState = null;
    restoreBaseNetwork();
    resetSelectionFilters();
    setSelectionAttributes();
    selection.hidden = true;
    selection.querySelector("p").textContent = "";
    if (options.closePopup !== false) closeActivePopup();
    renderList(searchInput.value);
  }

  function selectSite(fgn, openPopup, zoomTo = false) {
    const feature = siteById.get(fgn);
    if (!feature || !map.getLayer("kg-sites")) return;
    if (selectionState && selectionState.kind === "site" && selectionState.id === fgn) {
      clearSelectionState();
      return;
    }
    selectionState = { kind: "site", id: fgn };
    const related = [...(neighbors.get(fgn) || new Set())];
    const acIds = [...(incidentAc.get(fgn) || new Set())];
    const hvdcIds = [...(incidentHvdc.get(fgn) || new Set())];
    closeActivePopup();
    dimBaseNetwork();
    map.setFilter("kg-sites-related", ["in", ["get", "fgn"], ["literal", related]]);
    map.setFilter("kg-sites-selected", ["==", ["get", "fgn"], fgn]);
    map.setFilter("kg-ac-selected", ["in", ["get", "edge_id"], ["literal", acIds]]);
    map.setFilter("kg-hvdc-selected", ["in", ["get", "asset_id"], ["literal", hvdcIds]]);
    const p = feature.properties;
    selection.hidden = false;
    selection.querySelector("p").innerHTML = `<strong>${escapeHtml(p.name)}</strong><br>${related.length} connected neighboring facilit${related.length === 1 ? "y" : "ies"}`;
    setSelectionAttributes("site", fgn);
    renderList(searchInput.value);
    const animate = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (zoomTo) map.easeTo({ center: feature.geometry.coordinates, zoom: Math.max(map.getZoom(), 10.5), duration: animate ? 650 : 0 });
    else map.panTo(feature.geometry.coordinates, { animate });
    if (openPopup) showSitePopup(feature);
    if (window.innerWidth <= 920) app.classList.remove("is-sidebar-open");
  }

  function selectLine(kind, feature, lngLat, openPopup = true) {
    const properties = feature && feature.properties;
    if (!properties || !map.getLayer("kg-sites")) return;
    const id = kind === "hvdc" ? properties.asset_id : properties.edge_id;
    if (selectionState && selectionState.kind === kind && selectionState.id === id) {
      clearSelectionState();
      return;
    }
    selectionState = { kind, id };
    const endpoints = [properties.from_fgn, properties.to_fgn].filter(Boolean);
    closeActivePopup();
    dimBaseNetwork();
    map.setFilter("kg-sites-related", ["in", ["get", "fgn"], ["literal", endpoints]]);
    map.setFilter("kg-sites-selected", ["==", ["get", "fgn"], ""]);
    map.setFilter("kg-ac-selected", ["in", ["get", "edge_id"], ["literal", kind === "ac" ? [id] : []]]);
    map.setFilter("kg-hvdc-selected", ["in", ["get", "asset_id"], ["literal", kind === "hvdc" ? [id] : []]]);
    const fromName = properties.from_name || (siteById.get(properties.from_fgn)?.properties.name) || "Facility";
    const toName = properties.to_name || (siteById.get(properties.to_fgn)?.properties.name) || "Facility";
    const label = kind === "hvdc" ? "HVDC link" : "AC connection";
    selection.hidden = false;
    selection.querySelector("p").innerHTML = `<strong>${escapeHtml(fromName)} ↔ ${escapeHtml(toName)}</strong><br>${label}`;
    setSelectionAttributes(kind, id);
    renderList(searchInput.value);
    if (openPopup) showPopupAt(lngLat, linePopup(properties, kind));
  }

  const searchInput = document.getElementById("kg-search");
  const siteList = document.getElementById("kg-site-list");
  const searchStatus = document.getElementById("kg-search-status");
  const selection = document.getElementById("kg-selection");
  const sitesSorted = [...data.sites.features].sort((a, b) => a.properties.name.localeCompare(b.properties.name, "ko"));

  function renderList(query = "") {
    const needle = query.trim().toLocaleLowerCase("ko");
    if (!needle) {
      siteList.textContent = "";
      siteList.hidden = true;
      searchStatus.textContent = "";
      searchStatus.hidden = true;
      return;
    }
    const matches = sitesSorted.filter((feature) => {
      const p = feature.properties;
      return String(p.name || "").toLocaleLowerCase("ko").includes(needle);
    });
    siteList.textContent = "";
    const fragment = document.createDocumentFragment();
    matches.forEach((feature) => {
      const p = feature.properties;
      const li = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.fgn = p.fgn;
      button.className = selectionState && selectionState.kind === "site" && p.fgn === selectionState.id ? "is-selected" : "";
      button.setAttribute("aria-label", `${p.name}, ${highestVoltage(p)}`);
      button.innerHTML = `<span class="kg-dot" data-band="${escapeHtml(p.voltage_band)}"></span><span class="kg-name">${escapeHtml(p.name)}</span><span class="kg-kv">${p.highest_voltage_kv || "—"} kV</span>`;
      button.addEventListener("click", () => {
        selectSite(p.fgn, true, true);
        searchInput.value = "";
        renderList("");
      });
      li.appendChild(button);
      fragment.appendChild(li);
    });
    siteList.appendChild(fragment);
    siteList.hidden = false;
    searchStatus.hidden = false;
    searchStatus.textContent = `${matches.length} matching facilit${matches.length === 1 ? "y" : "ies"}`;
  }

  function createMapFurniture() {
    const layerControl = document.createElement("div");
    layerControl.className = "kg-layer-control";
    layerControl.setAttribute("aria-label", "Network layer visibility");
    const groups = [
      ["Facilities", ["kg-sites", "kg-orphan-rings", "kg-sites-related", "kg-sites-selected"]],
      ["154 kV", ["kg-ac-154", "kg-ac-other"]],
      ["345 kV AC connections", ["kg-ac-345"]],
      ["765 kV AC connections", ["kg-ac-765"]],
      ["HVDC", ["kg-hvdc", "kg-hvdc-selected", "kg-btb"]]
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
      <span><i data-band="765"></i>765 kV</span><span><i data-band="hvdc"></i>HVDC</span>`;
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

    const siteLayers = ["kg-sites-selected", "kg-sites-related", "kg-sites"];
    const acLayers = ["kg-ac-selected", "kg-ac-765", "kg-ac-345", "kg-ac-154", "kg-ac-other"];
    const hvdcLayers = ["kg-hvdc-selected", "kg-hvdc"];
    const interactiveLayers = [...siteLayers, ...acLayers, ...hvdcLayers, "kg-btb"];

    map.on("click", (event) => {
      const siteHit = map.queryRenderedFeatures(event.point, { layers: siteLayers })[0];
      if (siteHit) {
        selectSite(siteHit.properties.fgn, true);
        return;
      }

      const hitBox = [[event.point.x - 6, event.point.y - 6], [event.point.x + 6, event.point.y + 6]];
      const lineHit = map.queryRenderedFeatures(hitBox, { layers: [...acLayers, ...hvdcLayers] })[0];
      if (lineHit) {
        const kind = String(lineHit.layer.id).includes("hvdc") ? "hvdc" : "ac";
        selectLine(kind, lineHit, event.lngLat, true);
        return;
      }

      const btbHit = map.queryRenderedFeatures(event.point, { layers: ["kg-btb"] })[0];
      if (btbHit) {
        selectSite(btbHit.properties.host_fgn, true);
        return;
      }

      clearSelectionState();
    });

    map.on("mousemove", (event) => {
      const hitBox = [[event.point.x - 4, event.point.y - 4], [event.point.x + 4, event.point.y + 4]];
      const hits = map.queryRenderedFeatures(hitBox, { layers: interactiveLayers });
      map.getCanvas().style.cursor = hits.length ? "pointer" : "";
    });
    map.on("mouseout", () => { map.getCanvas().style.cursor = ""; });

    renderList();
    app.setAttribute("data-map-ready", "true");
    app.setAttribute("data-renderer", "maplibre-gl-js-5.24.0");
    app.setAttribute("data-line-style", lineStyleName);
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
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && selectionState && map.getLayer("kg-sites")) clearSelectionState();
  });
  document.getElementById("kg-fit").addEventListener("click", fitKorea);
  const sidebarToggle = document.getElementById("kg-toggle-sidebar");
  sidebarToggle.addEventListener("click", () => {
    const open = app.classList.toggle("is-sidebar-open");
    sidebarToggle.setAttribute("aria-expanded", String(open));
    window.setTimeout(() => map.resize(), 220);
  });
  window.addEventListener("resize", () => map.resize());
})();
