(() => {
  "use strict";

  const data = window.KOREA_GRID_DATA;
  const app = document.getElementById("korea-grid-app");
  if (!data || !window.L || !app) {
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

  const map = L.map("korea-grid-map", {
    zoomControl: true,
    preferCanvas: true,
    zoomSnap: 0.25,
    zoomDelta: 0.5,
    minZoom: 5,
    maxZoom: 15
  });

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  const siteLayers = L.layerGroup().addTo(map);
  const acLayers = {
    "154": L.layerGroup().addTo(map),
    "345": L.layerGroup().addTo(map),
    "765": L.layerGroup().addTo(map),
    other: L.layerGroup().addTo(map)
  };
  const hvdcLayers = L.layerGroup().addTo(map);
  const btbLayers = L.layerGroup().addTo(map);

  const siteById = new Map();
  const markerById = new Map();
  const neighbors = new Map();
  const incident = new Map();
  const allLineLayers = [];

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function band(feature) {
    return feature.properties.voltage_band || "other";
  }

  function markerRadius(properties) {
    if (properties.voltage_band === "765") return 5.8;
    if (properties.voltage_band === "345") return 4.2;
    if (properties.voltage_band === "154") return 2.9;
    return 2.7;
  }

  function markerStyle(properties, muted = false) {
    const legacy = properties.legacy_gist_reference;
    const orphan = properties.is_orphan;
    return {
      radius: markerRadius(properties),
      color: legacy ? colors.btb : orphan ? "#15283d" : "#ffffff",
      weight: legacy ? 2.4 : orphan ? 2 : 1,
      opacity: muted ? 0.09 : 0.96,
      fillColor: legacy ? "#ffffff" : colors[properties.voltage_band] || colors.other,
      fillOpacity: muted ? 0.035 : 0.88,
      dashArray: orphan ? "3 2" : null,
      pane: "markerPane"
    };
  }

  function lineStyle(properties, kind = "ac", muted = false) {
    if (kind === "hvdc") {
      return {
        color: colors.hvdc,
        weight: muted ? 0.8 : 3,
        opacity: muted ? 0.025 : 0.88,
        dashArray: "8 6",
        lineCap: "round"
      };
    }
    const widths = { "154": 0.8, "345": 1.35, "765": 2.05, other: 0.8 };
    return {
      color: colors[properties.voltage_band] || colors.other,
      weight: muted ? 0.55 : widths[properties.voltage_band] || 0.8,
      opacity: muted ? 0.018 : properties.voltage_band === "154" ? 0.27 : 0.5,
      lineCap: "round"
    };
  }

  function sitePopup(properties) {
    const legacy = properties.legacy_gist_reference
      ? '<p class="kg-legacy"><strong>LEGACY GIST REFERENCE</strong><br>Exact 345-kV receiving-substation parcel unresolved.</p>'
      : "";
    return `<div class="kg-popup">
      <h3>${escapeHtml(properties.name)}</h3>
      <dl>
        <dt>FGN</dt><dd>${escapeHtml(properties.fgn)}</dd>
        <dt>NMI</dt><dd>${escapeHtml(properties.nmi || "—")}</dd>
        <dt>Type</dt><dd>${escapeHtml(properties.facility_type || "—")}</dd>
        <dt>Voltage</dt><dd>${escapeHtml(properties.voltage_classes || properties.highest_voltage_kv + " kV")}</dd>
        <dt>Coordinate</dt><dd>${escapeHtml(properties.coordinate_tier)}</dd>
        <dt>Connections</dt><dd>${properties.connected_physical_pair_count} physical pairs</dd>
      </dl>${legacy}
    </div>`;
  }

  function addNeighbor(a, b, layer) {
    if (!neighbors.has(a)) neighbors.set(a, new Set());
    if (!neighbors.has(b)) neighbors.set(b, new Set());
    if (!incident.has(a)) incident.set(a, []);
    if (!incident.has(b)) incident.set(b, []);
    neighbors.get(a).add(b);
    neighbors.get(b).add(a);
    incident.get(a).push(layer);
    incident.get(b).push(layer);
  }

  data.sites.features.forEach((feature) => {
    const properties = feature.properties;
    const [lon, lat] = feature.geometry.coordinates;
    siteById.set(properties.fgn, feature);
    const marker = L.circleMarker([lat, lon], markerStyle(properties));
    marker.bindPopup(sitePopup(properties), { maxWidth: 290 });
    marker.on("click", () => selectSite(properties.fgn, true));
    marker.addTo(siteLayers);
    markerById.set(properties.fgn, marker);
  });

  data.ac.features.forEach((feature) => {
    const p = feature.properties;
    const coords = feature.geometry.coordinates.map(([lon, lat]) => [lat, lon]);
    const layer = L.polyline(coords, lineStyle(p, "ac"));
    layer._kgBaseStyle = lineStyle(p, "ac");
    layer._kgKind = "ac";
    layer.bindPopup(`<div class="kg-line-popup"><strong>${escapeHtml(p.from_name)} ↔ ${escapeHtml(p.to_name)}</strong><br>${escapeHtml(p.voltage_classes || "Voltage not restated")} kV · ${escapeHtml(p.circuit_count || "—")} circuit(s)<br>Straight connectivity link, not an actual route.</div>`);
    layer.addTo(acLayers[p.voltage_band] || acLayers.other);
    allLineLayers.push(layer);
    addNeighbor(p.from_fgn, p.to_fgn, layer);
  });

  data.hvdc.features.forEach((feature) => {
    const p = feature.properties;
    const coords = feature.geometry.coordinates.map(([lon, lat]) => [lat, lon]);
    const layer = L.polyline(coords, lineStyle(p, "hvdc"));
    layer._kgBaseStyle = lineStyle(p, "hvdc");
    layer._kgKind = "hvdc";
    layer.bindPopup(`<div class="kg-line-popup"><strong>${escapeHtml(p.scheme)}</strong><br>${escapeHtml(p.dc_voltage_kv)} kV DC · ${escapeHtml(p.capacity_mw)} MW<br>${escapeHtml(p.technology)}<br>Straight connectivity link, not an actual route.</div>`);
    layer.addTo(hvdcLayers);
    allLineLayers.push(layer);
    addNeighbor(p.from_fgn, p.to_fgn, layer);
  });

  data.btb.features.forEach((feature) => {
    const p = feature.properties;
    const [lon, lat] = feature.geometry.coordinates;
    const marker = L.circleMarker([lat, lon], {
      radius: 10,
      color: colors.btb,
      weight: 3,
      opacity: 0.95,
      fillColor: "#ffffff",
      fillOpacity: 0.15,
      dashArray: "4 3"
    });
    marker.bindPopup(`<div class="kg-line-popup"><strong>${escapeHtml(p.scheme)}</strong><br>${escapeHtml(p.host_name)} · ${escapeHtml(p.dc_voltage_kv)} kV DC · ${escapeHtml(p.capacity_mw)} MW<br>Same-site BTB host marker; no internal node or self-loop shown.</div>`);
    marker.addTo(btbLayers);
  });

  const overlays = {
    "Physical sites": siteLayers,
    "154 kV AC pairs": acLayers["154"],
    "345 kV AC pairs": acLayers["345"],
    "765 kV AC pairs": acLayers["765"],
    "Other AC pairs": acLayers.other,
    "HVDC links": hvdcLayers,
    "BTB asset": btbLayers
  };
  L.control.layers(null, overlays, { collapsed: false, position: "topright" }).addTo(map);

  const legend = L.control({ position: "bottomleft" });
  legend.onAdd = () => {
    const node = L.DomUtil.create("div", "kg-legend");
    node.innerHTML = `<strong>Network layers</strong>
      <span><i data-band="154"></i>154 kV</span>
      <span><i data-band="345"></i>345 kV</span>
      <span><i data-band="765"></i>765 kV</span>
      <span><i data-band="hvdc"></i>HVDC</span>
      <span><i data-band="btb"></i>BTB host</span>
      <span><i data-band="orphan"></i>Zero-degree site</span>
      <span><i data-band="gist"></i>Legacy GIST reference</span>`;
    return node;
  };
  legend.addTo(map);

  const bounds = L.latLngBounds(data.sites.features.map((feature) => {
    const [lon, lat] = feature.geometry.coordinates;
    return [lat, lon];
  }));
  function fitKorea() {
    map.fitBounds(bounds, { padding: [18, 18], maxZoom: 8 });
  }
  fitKorea();

  const searchInput = document.getElementById("kg-search");
  const clearSearch = document.getElementById("kg-clear");
  const siteList = document.getElementById("kg-site-list");
  const searchStatus = document.getElementById("kg-search-status");
  const selection = document.getElementById("kg-selection");
  const clearSelection = document.getElementById("kg-clear-selection");
  let selectedId = null;

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

  function clearSiteSelection() {
    selectedId = null;
    markerById.forEach((marker, fgn) => marker.setStyle(markerStyle(siteById.get(fgn).properties)));
    allLineLayers.forEach((layer) => layer.setStyle(layer._kgBaseStyle));
    clearSelection.disabled = true;
    selection.querySelector("p").innerHTML = "Select a site to emphasize its physical neighbors.";
    renderList(searchInput.value);
  }

  function selectSite(fgn, openPopup) {
    const feature = siteById.get(fgn);
    const marker = markerById.get(fgn);
    if (!feature || !marker) return;
    selectedId = fgn;
    markerById.forEach((candidate, id) => candidate.setStyle(markerStyle(siteById.get(id).properties, true)));
    allLineLayers.forEach((layer) => layer.setStyle(lineStyle({}, layer._kgKind, true)));
    const related = neighbors.get(fgn) || new Set();
    marker.setStyle({ ...markerStyle(feature.properties), radius: markerRadius(feature.properties) + 4.5, color: colors.selected, weight: 4, fillOpacity: 1 });
    related.forEach((neighborId) => {
      const neighbor = markerById.get(neighborId);
      if (neighbor) {
        const neighborProperties = siteById.get(neighborId).properties;
        neighbor.setStyle({ ...markerStyle(neighborProperties), radius: markerRadius(neighborProperties) + 2, color: colors.selected, opacity: 1, fillOpacity: .95, weight: 2.5 });
        neighbor.bringToFront();
      }
    });
    (incident.get(fgn) || []).forEach((layer) => {
      const selectedStyle = { ...layer._kgBaseStyle, opacity: 1, weight: (layer._kgBaseStyle.weight || 1) + 3 };
      layer.setStyle(selectedStyle);
      layer.bringToFront();
    });
    marker.bringToFront();
    const p = feature.properties;
    selection.querySelector("p").innerHTML = `<strong>${escapeHtml(p.name)}</strong><br>${related.size} connected neighboring site${related.size === 1 ? "" : "s"} · ${p.coordinate_tier}`;
    clearSelection.disabled = false;
    renderList(searchInput.value);
    map.panTo(marker.getLatLng(), { animate: !window.matchMedia("(prefers-reduced-motion: reduce)").matches });
    if (openPopup) marker.openPopup();
    if (window.innerWidth <= 920) app.classList.remove("is-sidebar-open");
  }

  searchInput.addEventListener("input", () => renderList(searchInput.value));
  clearSearch.addEventListener("click", () => {
    searchInput.value = "";
    searchInput.focus();
    renderList();
  });
  clearSelection.addEventListener("click", clearSiteSelection);
  document.getElementById("kg-fit").addEventListener("click", fitKorea);
  const sidebarToggle = document.getElementById("kg-toggle-sidebar");
  sidebarToggle.addEventListener("click", () => {
    const open = app.classList.toggle("is-sidebar-open");
    sidebarToggle.setAttribute("aria-expanded", String(open));
  });

  renderList();
  window.addEventListener("resize", () => map.invalidateSize({ pan: false }));
  app.setAttribute("data-map-ready", "true");
  app.setAttribute("data-site-count", String(data.sites.features.length));
  app.setAttribute("data-ac-count", String(data.ac.features.length));
  app.setAttribute("data-hvdc-count", String(data.hvdc.features.length));
  app.setAttribute("data-btb-count", String(data.btb.features.length));
})();
