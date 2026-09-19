(function () {
  "use strict";

  const identityKey = "premium-scientific";
  const spec = {
    name: "Premium Scientific",
    colors: { "154": "#2C63A8", "345": "#C18428", "765": "#A23A50", other: "#687976", hvdc: "#5A4E93" },
    markerColors: { "154": "#22777C", "345": "#C18428", "765": "#A23A50", other: "#687976" },
    widths: { "154": 1.20, "345": 2.25, "765": 3.35, other: 0.90, hvdc: 2.80 },
    opacity: { "154": 0.82, "345": 0.94, "765": 0.98, other: 0.46, hvdc: 0.95 },
    casing: { color: "#F4F5F2", opacity: 0.88, extra: 1.55 },
    casing154: { color: "#F7F3EA", opacity: 0.76, extra: 1.10 },
    marker: {
      ring: "#F4F5F2",
      coreByZoom: {
        "5": { "154": 0.90, "345": 2.10, "765": 3.45, other: 0.84 },
        "7": { "154": 1.30, "345": 2.65, "765": 3.95, other: 1.15 },
        "10": { "154": 2.10, "345": 3.80, "765": 5.15, other: 1.90 },
        "14": { "154": 3.05, "345": 5.15, "765": 6.70, other: 2.75 }
      },
      ringOffsetByZoom: {
        "5": { "154": 0.08, "345": 0.78, "765": 1.15, other: 0.06 },
        "7": { "154": 0.22, "345": 0.92, "765": 1.28, other: 0.16 },
        "10": { "154": 0.78, "345": 1.22, "765": 1.48, other: 0.66 },
        "14": { "154": 1.08, "345": 1.48, "765": 1.70, other: 0.92 }
      },
      ringOpacityByZoom: {
        "5": { "154": 0.02, "345": 0.82, "765": 0.97, other: 0.02 },
        "7": { "154": 0.10, "345": 0.92, "765": 0.985, other: 0.07 },
        "10": { "154": 0.84, "345": 0.97, "765": 0.995, other: 0.70 },
        "14": { "154": 0.96, "345": 0.985, "765": 0.995, other: 0.92 }
      },
      ringStrokeByZoom: {
        "5": { "154": 0.06, "345": 0.62, "765": 1.00, other: 0.05 },
        "7": { "154": 0.16, "345": 0.76, "765": 1.10, other: 0.11 },
        "10": { "154": 0.62, "345": 0.98, "765": 1.24, other: 0.52 },
        "14": { "154": 0.88, "345": 1.18, "765": 1.40, other: 0.75 }
      },
      coreStrokeByZoom: {
        "5": { "154": 0.0204, "345": 0.2108, "765": 0.34, other: 0.017 },
        "7": { "154": 0.0544, "345": 0.2584, "765": 0.374, other: 0.0374 },
        "10": { "154": 0.2108, "345": 0.3332, "765": 0.4216, other: 0.1768 },
        "14": { "154": 0.2992, "345": 0.4012, "765": 0.476, other: 0.255 }
      }
    },
    selection: {
      casing: "#42505A",
      casingOpacity: 0.74,
      haloOpacity: 0.15,
      lineExtra: 1.80,
      casingExtra: 3.95,
      unrelatedLineOpacity: 0.055,
      unrelatedMarkerOpacity: 0.070
    }
  };
  window.KOREA_GRID_VISUAL_IDENTITY = { key: identityKey, ...spec };

  function onReady(callback) {
    const map = window.KOREA_GRID_MAP;
    if (!map) return;
    if (map.getLayer("kg-sites")) callback(map);
    else if (map.loaded()) callback(map);
    else map.once("load", () => callback(map));
  }

  function scalarWidth(base, extra = 0) {
    return ["interpolate", ["linear"], ["zoom"], 5, base * 0.78 + extra, 7, base + extra, 10, base * 1.36 + extra, 14, base * 1.68 + extra];
  }

  function voltageWidth(extra = 0) {
    const atZoom = (factor) => voltageMatch({
      "765": spec.widths["765"] * factor + extra,
      "345": spec.widths["345"] * factor + extra,
      "154": spec.widths["154"] * factor + extra
    }, spec.widths.other * factor + extra);
    return ["interpolate", ["linear"], ["zoom"], 5, atZoom(0.78), 7, atZoom(1), 10, atZoom(1.36), 14, atZoom(1.68)];
  }

  function voltageMatch(values, fallback) {
    return ["match", ["get", "voltage_band"], "765", values["765"], "345", values["345"], "154", values["154"], fallback];
  }

  function zoomTableExpression(table, extra = 0) {
    const expression = ["interpolate", ["linear"], ["zoom"]];
    [5, 7, 10, 14].forEach((zoom) => {
      const values = table[String(zoom)];
      expression.push(zoom, voltageMatch(
        { "765": values["765"] + extra, "345": values["345"] + extra, "154": values["154"] + extra },
        values.other + extra
      ));
    });
    return expression;
  }

  function markerRadius(extra = 0) {
    if (spec.marker.coreByZoom) return zoomTableExpression(spec.marker.coreByZoom, extra);
    const radii = spec.marker.radii;
    const matched = (factor) => voltageMatch(
      { "765": radii["765"] * factor + extra, "345": radii["345"] * factor + extra, "154": radii["154"] * factor + extra },
      radii.other * factor + extra
    );
    return ["interpolate", ["linear"], ["zoom"], 5, matched(0.82), 8, matched(1.06), 11, matched(1.48), 14, matched(1.78)];
  }

  function markerRingRadius(extra = 0) {
    if (!spec.marker.coreByZoom || !spec.marker.ringOffsetByZoom) return markerRadius(spec.marker.ringOffset + extra);
    const table = {};
    [5, 7, 10, 14].forEach((zoom) => {
      const core = spec.marker.coreByZoom[String(zoom)];
      const offset = spec.marker.ringOffsetByZoom[String(zoom)];
      table[String(zoom)] = {
        "154": core["154"] + offset["154"],
        "345": core["345"] + offset["345"],
        "765": core["765"] + offset["765"],
        other: core.other + offset.other
      };
    });
    return zoomTableExpression(table, extra);
  }

  function markerRingOpacity() {
    return spec.marker.ringOpacityByZoom ? zoomTableExpression(spec.marker.ringOpacityByZoom) : 0.97;
  }

  function markerRingStrokeWidth() {
    return spec.marker.ringStrokeByZoom ? zoomTableExpression(spec.marker.ringStrokeByZoom) : 1.15;
  }

  function markerCoreStrokeWidth() {
    return spec.marker.coreStrokeByZoom ? zoomTableExpression(spec.marker.coreStrokeByZoom) : spec.marker.stroke;
  }

  function colorExpression() {
    return voltageMatch({ "765": spec.colors["765"], "345": spec.colors["345"], "154": spec.colors["154"] }, spec.colors.other);
  }

  function markerColorExpression() {
    return voltageMatch({ "765": spec.markerColors["765"], "345": spec.markerColors["345"], "154": spec.markerColors["154"] }, spec.markerColors.other);
  }

  function addCasing(map, band) {
    const coreId = `kg-ac-${band}`;
    const id = `kg-ac-casing-${band}`;
    const casing = band === "154" ? spec.casing154 : spec.casing;
    if (map.getLayer(id)) return;
    map.addLayer({
      id,
      type: "line",
      source: "kg-ac",
      filter: band === "other"
        ? ["!", ["in", ["get", "voltage_band"], ["literal", ["154", "345", "765"]]]]
        : ["==", ["get", "voltage_band"], band],
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": casing.color,
        "line-width": scalarWidth(spec.widths[band], casing.extra),
        "line-opacity": casing.opacity
      }
    }, coreId);
  }

  function safeSetFilter(map, target, source) {
    if (map.getLayer(target) && map.getLayer(source)) map.setFilter(target, map.getFilter(source));
  }

  function applyIdentity(map) {
    const data = window.KOREA_GRID_DATA;
    const app = document.getElementById("korea-grid-app");
    if (!data || !app || !map.getLayer("kg-sites")) return;

    if (map.getLayer("kg-ac-other")) map.moveLayer("kg-ac-other", "kg-ac-154");
    ["other", "154", "345", "765"].forEach((band) => addCasing(map, band));

    ["other", "154", "345", "765"].forEach((band) => {
      map.setPaintProperty(`kg-ac-${band}`, "line-color", spec.colors[band]);
      map.setPaintProperty(`kg-ac-${band}`, "line-width", scalarWidth(spec.widths[band]));
      map.setPaintProperty(`kg-ac-${band}`, "line-opacity", spec.opacity[band]);
    });

    if (!map.getLayer("kg-hvdc-casing")) {
      map.addLayer({
        id: "kg-hvdc-casing",
        type: "line",
        source: "kg-hvdc",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": spec.casing.color,
          "line-width": scalarWidth(spec.widths.hvdc, spec.casing.extra),
          "line-opacity": spec.casing.opacity
        }
      }, "kg-hvdc");
    }
    map.setPaintProperty("kg-hvdc", "line-color", spec.colors.hvdc);
    map.setPaintProperty("kg-hvdc", "line-width", scalarWidth(spec.widths.hvdc));
    map.setPaintProperty("kg-hvdc", "line-opacity", spec.opacity.hvdc);

    const lineColor = colorExpression();
    const nativeColor = markerColorExpression();
    if (!map.getLayer("kg-sites-ring")) {
      map.addLayer({
        id: "kg-sites-ring",
        type: "circle",
        source: "kg-sites",
        paint: {
          "circle-radius": markerRingRadius(),
          "circle-color": spec.marker.ring,
          "circle-opacity": markerRingOpacity(),
          "circle-stroke-color": nativeColor,
          "circle-stroke-width": markerRingStrokeWidth(),
          "circle-stroke-opacity": markerRingOpacity()
        }
      }, "kg-sites");
    }

    const hvdcSiteIds = [...new Set(data.hvdc.features.flatMap((feature) => [feature.properties.from_fgn, feature.properties.to_fgn]).filter(Boolean))];
    if (!map.getLayer("kg-hvdc-site-rings")) {
      map.addLayer({
        id: "kg-hvdc-site-rings",
        type: "circle",
        source: "kg-sites",
        filter: ["in", ["get", "fgn"], ["literal", hvdcSiteIds]],
        paint: {
          "circle-radius": markerRingRadius(1.65),
          "circle-color": "rgba(255,255,255,0)",
          "circle-stroke-color": spec.colors.hvdc,
          "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 5, 0.65, 8, 0.90, 12, 1.15],
          "circle-stroke-opacity": 0.88
        }
      }, "kg-sites");
    }

    map.setPaintProperty("kg-sites", "circle-radius", markerRadius());
    map.setPaintProperty("kg-sites", "circle-color", nativeColor);
    map.setPaintProperty("kg-sites", "circle-opacity", 0.98);
    map.setPaintProperty("kg-sites", "circle-stroke-color", spec.marker.ring);
    map.setPaintProperty("kg-sites", "circle-stroke-width", markerCoreStrokeWidth());
    map.setPaintProperty("kg-sites", "circle-stroke-opacity", 0.88);

    map.setPaintProperty("kg-sites-related", "circle-radius", markerRadius(1.55));
    map.setPaintProperty("kg-sites-related", "circle-color", nativeColor);
    map.setPaintProperty("kg-sites-related", "circle-stroke-color", spec.selection.casing);
    map.setPaintProperty("kg-sites-related", "circle-stroke-width", 1.45);
    map.setPaintProperty("kg-sites-related", "circle-opacity", 0.98);
    map.setPaintProperty("kg-sites-related", "circle-stroke-opacity", 0.92);

    if (!map.getLayer("kg-sites-selected-halo")) {
      map.addLayer({
        id: "kg-sites-selected-halo",
        type: "circle",
        source: "kg-sites",
        filter: ["==", ["get", "fgn"], ""],
        paint: {
          "circle-radius": markerRadius(6.2),
          "circle-color": nativeColor,
          "circle-opacity": spec.selection.haloOpacity,
          "circle-stroke-color": nativeColor,
          "circle-stroke-width": 0
        }
      }, "kg-sites-selected");
    }
    map.setPaintProperty("kg-sites-selected", "circle-radius", markerRadius(2.7));
    map.setPaintProperty("kg-sites-selected", "circle-color", nativeColor);
    map.setPaintProperty("kg-sites-selected", "circle-stroke-color", spec.selection.casing);
    map.setPaintProperty("kg-sites-selected", "circle-stroke-width", 2.1);

    if (!map.getLayer("kg-ac-selected-casing")) {
      map.addLayer({
        id: "kg-ac-selected-casing",
        type: "line",
        source: "kg-ac",
        filter: ["in", ["get", "edge_id"], ["literal", []]],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": spec.selection.casing,
          "line-width": voltageWidth(spec.selection.casingExtra),
          "line-opacity": spec.selection.casingOpacity
        }
      }, "kg-ac-selected");
    }
    map.setPaintProperty("kg-ac-selected", "line-color", lineColor);
    map.setPaintProperty("kg-ac-selected", "line-width", voltageWidth(spec.selection.lineExtra));
    map.setPaintProperty("kg-ac-selected", "line-opacity", 1);

    if (!map.getLayer("kg-hvdc-selected-casing")) {
      map.addLayer({
        id: "kg-hvdc-selected-casing",
        type: "line",
        source: "kg-hvdc",
        filter: ["in", ["get", "asset_id"], ["literal", []]],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": spec.selection.casing,
          "line-width": scalarWidth(spec.widths.hvdc, spec.selection.casingExtra),
          "line-opacity": spec.selection.casingOpacity
        }
      }, "kg-hvdc-selected");
    }
    map.setPaintProperty("kg-hvdc-selected", "line-color", spec.colors.hvdc);
    map.setPaintProperty("kg-hvdc-selected", "line-width", scalarWidth(spec.widths.hvdc, spec.selection.lineExtra));
    map.setPaintProperty("kg-hvdc-selected", "line-opacity", 1);

    ["kg-ac-selected-casing", "kg-ac-selected", "kg-hvdc-selected-casing", "kg-hvdc-selected"].forEach((id) => {
      if (map.getLayer(id)) map.moveLayer(id, "kg-sites-ring");
    });

    function selectionActive() {
      return Boolean(app.getAttribute("data-selection-kind"));
    }

    function syncSelection() {
      safeSetFilter(map, "kg-sites-selected-halo", "kg-sites-selected");
      safeSetFilter(map, "kg-ac-selected-casing", "kg-ac-selected");
      safeSetFilter(map, "kg-hvdc-selected-casing", "kg-hvdc-selected");
      const active = selectionActive();
      ["other", "154", "345", "765"].forEach((band) => {
        const casing = band === "154" ? spec.casing154 : spec.casing;
        map.setPaintProperty(`kg-ac-casing-${band}`, "line-opacity", active ? 0.025 : casing.opacity);
        map.setPaintProperty(`kg-ac-${band}`, "line-opacity", active ? spec.selection.unrelatedLineOpacity : spec.opacity[band]);
      });
      map.setPaintProperty("kg-hvdc-casing", "line-opacity", active ? 0.03 : spec.casing.opacity);
      map.setPaintProperty("kg-sites-ring", "circle-opacity", active ? 0.03 : markerRingOpacity());
      map.setPaintProperty("kg-sites-ring", "circle-stroke-opacity", active ? 0.06 : markerRingOpacity());
      map.setPaintProperty("kg-hvdc-site-rings", "circle-stroke-opacity", active ? 0.08 : 0.88);
      map.setPaintProperty("kg-sites", "circle-opacity", active ? spec.selection.unrelatedMarkerOpacity : 0.98);
      map.setPaintProperty("kg-sites", "circle-stroke-opacity", active ? 0.10 : 0.88);
      map.setPaintProperty("kg-hvdc", "line-opacity", active ? 0.065 : spec.opacity.hvdc);
    }

    new MutationObserver(syncSelection).observe(app, { attributes: true, attributeFilter: ["data-selection-kind", "data-selection-id"] });
    syncSelection();

    const toggleTargets = {
      "Facilities": ["kg-sites-ring", "kg-hvdc-site-rings", "kg-sites-selected-halo"],
      "154 kV": ["kg-ac-casing-154", "kg-ac-casing-other"],
      "345 kV AC connections": ["kg-ac-casing-345"],
      "765 kV AC connections": ["kg-ac-casing-765"],
      "HVDC": ["kg-hvdc-casing", "kg-hvdc-selected-casing"]
    };
    document.querySelectorAll(".kg-layer-control label").forEach((label) => {
      const key = label.textContent.trim();
      const checkbox = label.querySelector("input");
      if (!checkbox || !toggleTargets[key]) return;
      checkbox.addEventListener("change", () => toggleTargets[key].forEach((id) => {
        if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", checkbox.checked ? "visible" : "none");
      }));
    });

    app.dataset.visualIdentity = identityKey;
    app.dataset.visualIdentityReady = "true";
  }

  onReady(applyIdentity);
}());
