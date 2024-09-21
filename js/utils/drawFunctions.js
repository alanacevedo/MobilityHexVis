import * as d3 from "d3";
import * as L from 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/+esm'
import { cellToBoundary } from "h3-js"
import { AppState } from "../appState.js";
import { generateMaps } from "./domFunctions.js";


const ORIGIN_COLOR = "#00FFFF"
const DESTINATION_COLOR = "#FF00FF"
const HIGHLIGHT_COLOR = "#FFFF00"


function updateSvgPaths(map) {
    // Updates paths to match current zoom
    const g = d3.select(map.getPanes().overlayPane).select("svg").select("g")
    const zoom = map.getZoom()
    const mapId = map.options.uuid
    const appState = new AppState()
    const selectedH3s = appState.getState("selectedH3s")

    g.selectAll("path.hexagon")
        .attr("d", d => {
            // Recalculate the path string for hexagons using the current map zoom
            const pathData = d.hexBoundary.map(latLng => {
                const point = map.latLngToLayerPoint(L.latLng(latLng));
                return [point.x, point.y];
            });
            const lineGenerator = d3.line();
            return lineGenerator(pathData) + "Z"; // Close the path
        })
        .style("stroke-width", 0.5) // You can adjust the stroke width based on zoom if needed
        .style("fill", d => getHexFill(d, mapId))

    g.selectAll("path.highlightHexagon")
        .attr("d", d => {
            // Recalculate the path string for hexagons using the current map zoom
            const pathData = d.hexBoundary.map(latLng => {
                const point = map.latLngToLayerPoint(L.latLng(latLng));
                return [point.x, point.y];
            });
            const lineGenerator = d3.line();
            return lineGenerator(pathData) + "Z"; // Close the path
        })
        .style("stroke-width", 0.5) // You can adjust the stroke width based on zoom if needed
        .style("fill", d => getHexFill(d, mapId))
        .style("fill", d => HIGHLIGHT_COLOR) // Apply the gradient fill
        .style("fill-opacity", d => selectedH3s.has(d.h3) ? 1 : 0)

    // Update comuna boundaries
    const projection = d3.geoTransform({
        point: function (lon, lat) {
            const point = map.latLngToLayerPoint(new L.LatLng(lat, lon));
            this.stream.point(point.x, point.y);
        }
    });

    const path = d3.geoPath().projection(projection);

    g.selectAll("path.comunaBoundary")
        .attr("d", path)
        .style("stroke-width", zoom / 8) // Adjust stroke width based on zoom level
}


function drawH3Hexagons(dataByH3, hexSet, map) {
    const appState = new AppState()
    const selectedH3s = appState.getState("selectedH3s")
    const isSelectHexMode = appState.getState("selectionMode") === "hex"
    const hexData = Object.entries(dataByH3).map(([h3, hexObj]) => ({
        hexBoundary: cellToBoundary(h3),
        h3,
        count: hexObj.gini
            ? Object.values(hexObj.counts).reduce((sum, count) => sum + count, 0)
            : (hexObj.origin?.count ?? 0) + (hexObj.destination?.count ?? 0),
        ...hexObj
    }));
    const totalCount = hexData.reduce((acc, hexObj) => acc + hexObj.count, 0)
    const maxCount = Math.max(...hexData.map(hexObj => hexObj.count))

    const mapId = map.options.uuid
    const svg = d3.select(map.getPanes().overlayPane).select("svg");
    svg.selectAll("defs").remove();
    const defs = svg.append("defs")
    const g = svg.select("g");
    const tooltip = d3.select("#mapTooltip")

    for (const [h3, hexObj] of Object.entries(dataByH3)) {
        const originCount = hexObj.origin?.count ?? 0
        const destinationCount = hexObj.destination?.count ?? 0
        const originPercentage = 100 * originCount / (originCount + destinationCount)
        addHexColorGradient(h3, originPercentage, defs, mapId)
    }

    let isDragging = false;
    let mouseDownTime;
    const CLICK_THRESHOLD = 200; // milliseconds

    // Bind data and draw hexagons
    g.selectAll("path.hexagon")
        .data(hexData)
        .join("path")
        .attr("style", d => `pointer-events: auto`)
        .attr("class", "hexagon")
        .attr("d", d => generateHexPath(d, map))
        .style("fill", d => getHexFill(d, mapId))
        .style("fill-opacity", d => getHexFillOpacity(d, mapId, maxCount))
        .style("stroke", d => getHexStroke(d))
        .style("stroke-width", 0.5)
        .style("stroke-opacity", 0.8)
        .on("mousedown", function (event) {
            mouseDownTime = new Date().getTime();
            isDragging = false;
        })
        .on("mousemove", function () {
            isDragging = true;
        })
        .on("mouseup", function (event, d) {
            const mouseUpTime = new Date().getTime();
            const timeDiff = mouseUpTime - mouseDownTime;

            if (!isDragging && timeDiff < CLICK_THRESHOLD) {
                // This is a click, not a drag
                if (isSelectHexMode) {
                    console.log("wena")
                    if (selectedH3s.has(d.h3)) {
                        selectedH3s.delete(d.h3);
                    } else {
                        selectedH3s.add(d.h3);
                    }
                    generateMaps({ updateDistributionChart: false });
                }
            }

            isDragging = false;
        })
        .on("mouseover", function (event, d) {
            // this contiene el elemento path, event es el evento, d contiene los datos
            tooltip
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px")
                .html(getTooltipContent(d, totalCount))

            tooltip.transition().duration(150).style("opacity", 0.8)

            if (isSelectHexMode) {
                d3.select(this).transition().duration(150).style('fill-opacity', 1)
            }
        })
        .on("mouseout", function (event, d) {
            tooltip.transition().duration(150).style("opacity", 0)

            if (isSelectHexMode) {
                d3.select(this).transition().duration(150).style('fill-opacity', d => getHexFillOpacity(d, mapId, maxCount))
            }
        })

    if (hexSet.size === 0) return

    const shownH3s = new Set(hexData.map(it => it.h3))

    const highlightHexData = [...hexSet].filter(hex => !shownH3s.has(hex)).map(hex => (
        {
            hexBoundary: cellToBoundary(hex),
            h3: hex,
        }
    ))

    // Esto dibuja los contornos de los hex sin fill (y de los selected hex)
    g.selectAll("path.highlightHexagon")
        .data(highlightHexData)
        .join("path")
        .attr("style", "pointer-events: auto;")
        .attr("class", "highlightHexagon")
        .attr("d", d => generateHexPath(d, map))
        .style("fill", d => HIGHLIGHT_COLOR) // Apply the gradient fill
        .style("fill-opacity", d => selectedH3s.has(d.h3) ? 1 : 0)
        .style("stroke", "#CCCCCC")
        .style("stroke-width", 0.5)
        .style("stroke-opacity", 0.8)
        .on("mousedown", function (event) {
            mouseDownTime = new Date().getTime();
            isDragging = false;
        })
        .on("mousemove", function () {
            isDragging = true;
        })
        .on("mouseup", function (event, d) {
            const mouseUpTime = new Date().getTime();
            const timeDiff = mouseUpTime - mouseDownTime;

            if (!isDragging && timeDiff < CLICK_THRESHOLD) {
                // This is a click, not a drag
                if (isSelectHexMode) {

                    const selectedH3s = appState.getState("selectedH3s");
                    if (selectedH3s.has(d.h3)) {
                        selectedH3s.delete(d.h3);
                    } else {
                        selectedH3s.add(d.h3);
                    }
                    generateMaps({ updateDistributionChart: false });
                }
            }

            isDragging = false;
        })

    if (isSelectHexMode) {
        g.selectAll("path.hexagon").raise()
        g.selectAll("path.highlightHexagon").raise()
    }

}


function addHexColorGradient(h3, originPercentage, defs, mapId) {
    const destinationPercentage = 100 - originPercentage

    const gradient = defs
        .append("linearGradient")
        .attr("id", `colorGradient${h3}${mapId}`)
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%");

    gradient.append("stop")
        .attr("offset", originPercentage + "%")
        .attr("stop-color", ORIGIN_COLOR);

    gradient.append("stop")
        .attr("offset", originPercentage + "%")
        .attr("stop-color", DESTINATION_COLOR);

    gradient.append("stop")
        .attr("offset", destinationPercentage + "%")
        .attr("stop-color", DESTINATION_COLOR);

}

function updateHexColorGradients() {
    const state = new AppState()
    const mapMatrix = state.getState("mapMatrix")
    const originColor = state.getState("originColor")
    const destinationColor = state.getState("destinationColor")

    // Flatten the mapMatrix and include the global map
    const allMaps = [...mapMatrix.flat(), state.getState("globalMap")]

    allMaps.forEach(map => {
        if (!map) return; // Skip if map is undefined (e.g., if global map is not set)

        const svg = d3.select(map.getPanes().overlayPane).select("svg")
        const defs = svg.select("defs")

        defs.selectAll("linearGradient").each(function () {
            const gradient = d3.select(this)
            gradient.select("stop:nth-child(1)")
                .attr("stop-color", originColor)
            gradient.select("stop:nth-child(2)")
                .attr("stop-color", destinationColor)
            gradient.select("stop:nth-child(3)")
                .attr("stop-color", destinationColor)
        })
    })
}

// Inversión de dominio para que mayor desigualdad sea oscuro  
const colorScale = d3.scaleSequential(d3.interpolateWarm).domain([1, 0.5]);

function getHexFill(hex, mapId) {
    if (hex.gini) {
        return colorScale(hex.gini)
    }

    if ((new AppState()).getState("selectedH3s").has(hex.h3))
        return HIGHLIGHT_COLOR

    return `url(#colorGradient${hex.h3}${mapId})`
}


function getHexFillOpacity(hex, mapId, maxCount) {
    if (hex.gini) {
        return 0.8
    }
    const opacityScale = d3.scaleLinear().domain([0, maxCount * 0.1]).range([0.25, 0.7]).clamp(true);
    return opacityScale(hex.count)
}

function getHexStroke(hex) {
    if (hex.gini) {
        return "gray"
    }
    return "#CCCCCC"
}

function generateHexPath(d, map) {
    const lineGenerator = d3.line()
        .x(d => map.latLngToLayerPoint([d[0], d[1]]).x)
        .y(d => map.latLngToLayerPoint([d[0], d[1]]).y);
    return lineGenerator(d.hexBoundary) + "Z"; // Close the path
}

function getTooltipContent(d, totalCount) {
    if (d.gini) {
        const groupCounts = Object.entries(d.counts)
            .map(([group, count]) => `Group ${group}: ${count}`)
            .join('<br>');
        return `
            ${groupCounts}<br>
            Índice de Gini: ${d.gini.toFixed(2)}
        `;
    } else {
        return `
            ${d.origin ? `Orígenes: ${Number(d.origin.count)}.<br>` : ''}
            ${d.destination ? `Destinos: ${Number(d.destination.count)}.<br>` : ''}
            ${d.count ? `% datos: ${Number(d.count * 100 / totalCount).toFixed(2)}%` : ''}
        `;
    }
}

function drawComunaBoundaries(map) {
    const appState = new AppState();
    const svg = d3.select(map.getPanes().overlayPane).select("svg");
    const g = svg.select("g");
    const tooltip = d3.select("#mapTooltip")

    const showComunaBoundaries = appState.getState("showComunaBoundaries");
    const selectionMode = appState.getState("selectionMode");

    if (!showComunaBoundaries && selectionMode !== "comuna") {
        g.selectAll("path.comunaBoundary").remove();
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

    // Draw comuna boundaries
    comunaGroup.selectAll("path.comunaBoundary")
        .data(comunas.features)
        .join("path")
        .attr("class", "comunaBoundary")
        .attr("d", path)
        .style("fill", "transparent")
        .style("stroke", "#FFFF00")
        .style("stroke-width", zoom / 8)
        .style("stroke-opacity", 0.8)
        .style("pointer-events", "all")
        .on("mouseover", function (event, d) {
            event.stopPropagation();  // Prevent event from bubbling to elements below
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(d.properties.NOM_COM)
                .style("left", (event.pageX) + "px")
                .style("top", (event.pageY - 28) + "px");

            if (selectionMode === "comuna") {
                const comunaHexes = appState.getState("comunaHexIndex").get(d.properties.NOM_COM);
                if (!comunaHexes) return
                g.selectAll("path.hexagon")
                    .filter(hexD => comunaHexes.has(hexD.h3))
                    .transition().duration(150).style('fill-opacity', 1);
            }
        })
        .on("mouseout", function (event, d) {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);

            if (selectionMode === "comuna") {
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

    // Ensure comuna boundaries are always on top
    if (selectionMode === "comuna") {
        comunaGroup.raise();
    } else {
        g.selectAll("path.hexagon").raise()
        g.selectAll("path.highlightHexagon").raise()
    }
}


export { updateSvgPaths, drawH3Hexagons, drawComunaBoundaries, updateHexColorGradients }