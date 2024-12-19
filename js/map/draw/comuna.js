import * as d3 from "d3";
import * as L from 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/+esm'
import { AppState } from "@js/appState.js"
import { generateMaps } from "@js/map/mapControl.js";

function drawComunaBoundaries(map) {
    const appState = new AppState();
    const svg = d3.select(map.getPanes().overlayPane).select("svg");
    const g = svg.select("g");
    const tooltip = d3.select("#mapTooltip")

    const showComunaBoundaries = appState.getState("showComunaBoundaries");
    const selectionMode = appState.getState("selectionMode");

    if (!showComunaBoundaries && selectionMode !== "comuna") {
        g.selectAll("path.comunaBoundary").remove();
        g.selectAll("path.comunaFill").remove();
        return;
    }

    const comunas = appState.getState("comunas");
    const zoom = map.getZoom()

    // Calculate maxCount
    const hexagons = g.selectAll("path.hexagon").data();
    const maxCount = Math.max(...hexagons.map(d => d.count));

    // Define custom projection
    const projection = d3.geoTransform({
        point: function (lon, lat) {
            const point = map.latLngToLayerPoint(new L.LatLng(lat, lon));
            this.stream.point(point.x, point.y);
        }
    });

    // Create path generator
    const path = d3.geoPath().projection(projection);

    // Ensure the comuna group is created after the hexagon group
    let comunaGroup = g.select(".comuna-group");
    if (comunaGroup.empty()) {
        comunaGroup = g.append("g").attr("class", "comuna-group");
    }

    let isDragging = false;
    let mouseDownTime;
    const CLICK_THRESHOLD = 200;

    // Draw comuna fills
    comunaGroup.selectAll("path.comunaFill")
        .data(comunas.features)
        .join("path")
        .attr("class", "comunaFill")
        .attr("d", path)
        .style("fill", "transparent")
        .style("pointer-events", selectionMode === "comuna" ? "all" : "none")
        .on("mouseover", function (event, d) {
            if (selectionMode === "comuna") {
                event.stopPropagation();
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(d.properties.NOM_COM)
                    .style("left", (event.pageX) + "px")
                    .style("top", (event.pageY - 28) + "px");

                const comunaHexes = appState.getState("comunaHexIndex").get(d.properties.NOM_COM);
                if (!comunaHexes) return
                g.selectAll("path.hexagon")
                    .filter(hexD => comunaHexes.has(hexD.h3))
                    .transition().duration(150).style('fill-opacity', 1);
            }
        })
        .on("mouseout", function (event, d) {
            if (selectionMode === "comuna") {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);

                const comunaHexes = appState.getState("comunaHexIndex").get(d.properties.NOM_COM);
                if (!comunaHexes) return
                g.selectAll("path.hexagon")
                    .transition().duration(150)
                    .style('fill-opacity', d => getHexFillOpacity(d, map.options.uuid, maxCount));
            }
        })
        .on("mousedown", function (event) {
            mouseDownTime = new Date().getTime();
            isDragging = false;
        })
        .on("mousemove", function () {
            isDragging = true;
        })
        .on("mouseup", function (event, d) {
            if (selectionMode !== "comuna") {
                isDragging = false
                return
            }

            const mouseUpTime = new Date().getTime();
            const timeDiff = mouseUpTime - mouseDownTime;

            if (!isDragging && timeDiff < CLICK_THRESHOLD && selectionMode === "comuna") {
                const selectedH3s = appState.getState("selectedH3s");
                const comunaHexes = appState.getState("comunaHexIndex").get(d.properties.NOM_COM);
                if (!comunaHexes) return

                // Toggle the selection state of the entire comuna
                const allSelected = [...comunaHexes].every(hex => selectedH3s.has(hex));
                if (allSelected) {
                    comunaHexes.forEach(hex => selectedH3s.delete(hex));
                } else {
                    comunaHexes.forEach(hex => selectedH3s.add(hex));
                }

                generateMaps({ updateDistributionChart: false });
            }
            isDragging = false
        });

    // Draw comuna boundaries
    comunaGroup.selectAll("path.comunaBoundary")
        .data(comunas.features)
        .join("path")
        .attr("class", "comunaBoundary")
        .attr("d", path)
        .style("fill", "none")
        .style("stroke", appState.getState("comunaBoundaryColor"))
        .style("stroke-width", zoom / 8)
        .style("stroke-opacity", 0.9)
        .style("pointer-events", "none");

    // Ensure proper layering
    if (selectionMode === "hex") {
        comunaGroup.selectAll("path.comunaFill").lower();
        g.selectAll("path.hexagon").raise();
        g.selectAll("path.highlightHexagon").raise();
    } else {
        comunaGroup.selectAll("path.comunaFill").raise();
        g.selectAll("path.hexagon").lower();
        g.selectAll("path.highlightHexagon").lower();
    }

    // Always raise comuna boundaries to the top
    comunaGroup.selectAll("path.comunaBoundary").raise();

    // Raise the entire comuna group to ensure boundaries are on top
    comunaGroup.raise();
}

export { drawComunaBoundaries }