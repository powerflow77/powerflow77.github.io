(function () {
  "use strict";

  const identityKey = "hybrid";
  const variants = {
    modern: {
      name: "Modern Technical",
      colors: { "154": "#168F97", "345": "#D29A2E", "765": "#C44C5A", other: "#667B86", hvdc: "#6254D5" },
      widths: { "154": 1.15, "345": 2.15, "765": 3.30, other: 1.0, hvdc: 2.85 },
      opacity: { "154": 0.70, "345": 0.90, "765": 0.97, other: 0.55, hvdc: 0.96 },
      casing: { color: "#263D48", opacity: 0.25, extra: 1.55 },
      marker: { radii: { "154": 1.75, "345": 2.85, "765": 4.15, other: 1.65 }, ring: "#F8FAF7", ringOffset: 1.35, stroke: 0.75 },
      hvdcDash: [5.2, 2.3],
      selection: { casing: "#102A36", haloOpacity: 0.20, lineExtra: 1.75, casingExtra: 4.15 }
    },
    premium: {
      name: "Premium Atlas",
      colors: { "154": "#347B78", "345": "#B9822F", "765": "#8F4057", other: "#6F7B78", hvdc: "#5D4C91" },
      widths: { "154": 1.10, "345": 2.20, "765": 3.25, other: 0.95, hvdc: 2.75 },
      opacity: { "154": 0.65, "345": 0.89, "765": 0.95, other: 0.50, hvdc: 0.93 },
      casing: { color: "#F8F3E8", opacity: 0.90, extra: 1.75 },
      marker: { radii: { "154": 1.70, "345": 2.90, "765": 4.20, other: 1.60 }, ring: "#F9F3E8", ringOffset: 1.45, stroke: 0.8 },
      hvdcDash: [6.0, 2.8],
      selection: { casing: "#2D2832", haloOpacity: 0.18, lineExtra: 1.85, casingExtra: 4.25 }
    },
    contrast: {
      name: "Contemporary Contrast",
      colors: { "154": "#218BA1", "345": "#DD7627", "765": "#B52F45", other: "#657684", hvdc: "#4E59BE" },
      widths: { "154": 1.20, "345": 2.30, "765": 3.45, other: 1.05, hvdc: 2.95 },
      opacity: { "154": 0.72, "345": 0.93, "765": 0.98, other: 0.56, hvdc: 0.97 },
      casing: { color: "#263746", opacity: 0.27, extra: 1.65 },
      marker: { radii: { "154": 1.80, "345": 3.00, "765": 4.35, other: 1.70 }, ring: "#F8FAF8", ringOffset: 1.35, stroke: 0.75 },
      hvdcDash: [4.6, 2.0],
      selection: { casing: "#0E1A24", haloOpacity: 0.21, lineExtra: 1.85, casingExtra: 4.25 }
    },
    hybrid: {
      name: "Premium Atlas Hybrid",
      colors: { "154": "#237F83", "345": "#C58A2B", "765": "#A8394D", other: "#697A79", hvdc: "#5D4C91" },
      widths: { "154": 1.05, "345": 2.25, "765": 3.35, other: 0.92, hvdc: 2.80 },
      opacity: { "154": 0.62, "345": 0.92, "765": 0.97, other: 0.47, hvdc: 0.94 },
      casing: { color: "#F8F3E8", opacity: 0.90, extra: 1.75 },
      marker: {
        radii: { "154": 1.35, "345": 2.65, "765": 3.95, other: 1.20 },
        ring: "#F9F3E8",
        ringOffset: 1.15,
        stroke: 0.55,
        coreByZoom: {
          "5": { "154": 1.05, "345": 2.15, "765": 3.55, other: 0.95 },
          "7": { "154": 1.35, "345": 2.65, "765": 3.95, other: 1.20 },
          "10": { "154": 2.15, "345": 3.85, "765": 5.25, other: 1.95 },
          "14": { "154": 3.15, "345": 5.35, "765": 6.95, other: 2.90 }
        },
        ringOffsetByZoom: {
          "5": { "154": 0.30, "345": 0.90, "765": 1.20, other: 0.25 },
          "7": { "154": 0.55, "345": 1.05, "765": 1.35, other: 0.45 },
          "10": { "154": 1.10, "345": 1.40, "765": 1.60, other: 0.95 },
          "14": { "154": 1.35, "345": 1.60, "765": 1.80, other: 1.20 }
        },
        ringOpacityByZoom: {
          "5": { "154": 0.08, "345": 0.86, "765": 0.97, other: 0.04 },
          "7": { "154": 0.24, "345": 0.93, "765": 0.98, other: 0.12 },
          "10": { "154": 0.92, "345": 0.97, "765": 0.99, other: 0.80 },
          "14": { "154": 0.97, "345": 0.98, "765": 0.99, other: 0.94 }
        },
        ringStrokeByZoom: {
          "5": { "154": 0.22, "345": 0.80, "765": 1.05, other: 0.18 },
          "7": { "154": 0.40, "345": 0.95, "765": 1.18, other: 0.32 },
          "10": { "154": 0.90, "345": 1.20, "765": 1.42, other: 0.75 },
          "14": { "154": 1.10, "345": 1.35, "765": 1.55, other: 0.95 }
        },
        coreStrokeByZoom: {
          "5": { "154": 0.20, "345": 0.58, "765": 0.72, other: 0.18 },
          "7": { "154": 0.34, "345": 0.66, "765": 0.82, other: 0.28 },
          "10": { "154": 0.58, "345": 0.80, "765": 0.96, other: 0.50 },
          "14": { "154": 0.78, "345": 0.94, "765": 1.08, other: 0.68 }
        }
      },
      hvdcDash: [6.0, 2.8],
      selection: { casing: "#4A424C", haloOpacity: 0.18, lineExtra: 1.85, casingExtra: 4.25 }
    }
  };

  const spec = variants[identityKey] || variants.premium;
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

  function addCasing(map, band) {
    const coreId = `kg-ac-${band}`;
    const id = `kg-ac-casing-${band}`;
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
        "line-color": spec.casing.color,
        "line-width": scalarWidth(spec.widths[band], spec.casing.extra),
        "line-opacity": spec.casing.opacity
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
          "line-width": scalarWidth(spec.widths.hvdc, spec.casing.extra + 0.35),
          "line-opacity": Math.min(0.95, spec.casing.opacity + 0.12),
          "line-dasharray": spec.hvdcDash
        }
      }, "kg-hvdc");
    }
    map.setPaintProperty("kg-hvdc", "line-color", spec.colors.hvdc);
    map.setPaintProperty("kg-hvdc", "line-width", scalarWidth(spec.widths.hvdc));
    map.setPaintProperty("kg-hvdc", "line-opacity", spec.opacity.hvdc);
    map.setPaintProperty("kg-hvdc", "line-dasharray", spec.hvdcDash);

    const nativeColor = colorExpression();
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
          "circle-radius": markerRingRadius(2.0),
          "circle-color": "rgba(255,255,255,0)",
          "circle-stroke-color": spec.colors.hvdc,
          "circle-stroke-width": 1.35,
          "circle-stroke-opacity": 0.86
        }
      }, "kg-sites");
    }

    map.setPaintProperty("kg-sites", "circle-radius", markerRadius());
    map.setPaintProperty("kg-sites", "circle-color", nativeColor);
    map.setPaintProperty("kg-sites", "circle-opacity", 0.96);
    map.setPaintProperty("kg-sites", "circle-stroke-color", "#FFFFFF");
    map.setPaintProperty("kg-sites", "circle-stroke-width", markerCoreStrokeWidth());
    map.setPaintProperty("kg-sites", "circle-stroke-opacity", 0.95);

    map.setPaintProperty("kg-sites-related", "circle-radius", markerRadius(1.8));
    map.setPaintProperty("kg-sites-related", "circle-color", nativeColor);
    map.setPaintProperty("kg-sites-related", "circle-stroke-color", spec.selection.casing);
    map.setPaintProperty("kg-sites-related", "circle-stroke-width", 1.8);

    if (!map.getLayer("kg-sites-selected-halo")) {
      map.addLayer({
        id: "kg-sites-selected-halo",
        type: "circle",
        source: "kg-sites",
        filter: ["==", ["get", "fgn"], ""],
        paint: {
          "circle-radius": markerRadius(5.1),
          "circle-color": nativeColor,
          "circle-opacity": spec.selection.haloOpacity,
          "circle-stroke-color": nativeColor,
          "circle-stroke-width": 1.4,
          "circle-stroke-opacity": 0.92
        }
      }, "kg-sites-selected");
    }
    map.setPaintProperty("kg-sites-selected", "circle-radius", markerRadius(3.1));
    map.setPaintProperty("kg-sites-selected", "circle-color", nativeColor);
    map.setPaintProperty("kg-sites-selected", "circle-stroke-color", spec.selection.casing);
    map.setPaintProperty("kg-sites-selected", "circle-stroke-width", 2.5);

    if (!map.getLayer("kg-ac-selected-casing")) {
      map.addLayer({
        id: "kg-ac-selected-casing",
        type: "line",
        source: "kg-ac",
        filter: ["in", ["get", "edge_id"], ["literal", []]],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": spec.selection.casing,
          "line-width": ["interpolate", ["linear"], ["zoom"], 5, 5.2, 7, 5.8, 10, 7.2, 14, 8.8],
          "line-opacity": 0.82
        }
      }, "kg-ac-selected");
    }
    map.setPaintProperty("kg-ac-selected", "line-color", nativeColor);
    map.setPaintProperty("kg-ac-selected", "line-width", ["interpolate", ["linear"], ["zoom"], 5, 2.8, 7, 3.4, 10, 4.7, 14, 6.0]);
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
          "line-opacity": 0.84,
          "line-dasharray": spec.hvdcDash
        }
      }, "kg-hvdc-selected");
    }
    map.setPaintProperty("kg-hvdc-selected", "line-color", spec.colors.hvdc);
    map.setPaintProperty("kg-hvdc-selected", "line-width", scalarWidth(spec.widths.hvdc, spec.selection.lineExtra));
    map.setPaintProperty("kg-hvdc-selected", "line-opacity", 1);
    map.setPaintProperty("kg-hvdc-selected", "line-dasharray", spec.hvdcDash);

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
        map.setPaintProperty(`kg-ac-casing-${band}`, "line-opacity", active ? 0.025 : spec.casing.opacity);
        if (!active) map.setPaintProperty(`kg-ac-${band}`, "line-opacity", spec.opacity[band]);
      });
      map.setPaintProperty("kg-hvdc-casing", "line-opacity", active ? 0.035 : Math.min(0.95, spec.casing.opacity + 0.12));
      map.setPaintProperty("kg-sites-ring", "circle-opacity", active ? 0.035 : markerRingOpacity());
      map.setPaintProperty("kg-sites-ring", "circle-stroke-opacity", active ? 0.08 : markerRingOpacity());
      map.setPaintProperty("kg-hvdc-site-rings", "circle-stroke-opacity", active ? 0.08 : 0.86);
      if (!active) {
        map.setPaintProperty("kg-sites", "circle-opacity", 0.96);
        map.setPaintProperty("kg-sites", "circle-stroke-opacity", 0.95);
        map.setPaintProperty("kg-hvdc", "line-opacity", spec.opacity.hvdc);
      }
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
