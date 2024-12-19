import * as d3 from "d3";
import { cellToBoundary } from "h3-js";
import { AppState } from "@js/appState";
import { generateMaps } from "@js/map/mapControl";

function drawH3Hexagons(dataByH3, hexSet, map) {
    const appState = new AppState();
    const selectedH3s = appState.getState("selectedH3s");
    const isSelectHexMode = appState.getState("selectionMode") === "hex";
    const hexComunaIndex = appState.getState('hexComunaIndex');

    // Prepare the data array from dataByH3
    const hexData = prepareHexData(dataByH3, hexComunaIndex);

    // Calculate aggregations
    const totalCount = hexData.reduce((acc, hexObj) => acc + hexObj.count, 0);
    const maxCount = Math.max(...hexData.map(hexObj => hexObj.count));

    // Set up SVG and defs for gradients
    const mapId = map.options.uuid;
    const svg = d3.select(map.getPanes().overlayPane).select("svg");
    svg.selectAll("defs").remove();
    const defs = svg.append("defs");
    const g = svg.select("g");
    const tooltip = d3.select("#mapTooltip");

    // Add color gradients for each hex
    for (const [h3, hexObj] of Object.entries(dataByH3)) {
        const originCount = hexObj.origin?.count ?? 0;
        const destinationCount = hexObj.destination?.count ?? 0;
        const originPercentage = 100 * originCount / (originCount + destinationCount);
        addHexColorGradient(h3, originPercentage, defs, mapId);
    }

    // Interaction state
    let isDragging = false;
    let mouseDownTime;
    const CLICK_THRESHOLD = 200; // milliseconds

    // Draw main hexagons
    g.selectAll("path.hexagon")
        .data(hexData)
        .join("path")
        .attr("style", "pointer-events: auto")
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
            handleMouseUp(event, d, isDragging, mouseDownTime, CLICK_THRESHOLD, isSelectHexMode, selectedH3s);
            isDragging = false;
        })
        .on("mouseover", function (event, d) {
            handleMouseOver(event, d, tooltip, totalCount, isSelectHexMode, this, mapId, maxCount);
        })
        .on("mouseout", function (event, d) {
            handleMouseOut(event, d, tooltip, isSelectHexMode, this, mapId, maxCount);
        });

    // If no hexSet, no need to highlight missing hexes
    if (hexSet.size === 0) return;

    // Highlight hexagons that are in hexSet but not shown in hexData
    const shownH3s = new Set(hexData.map(it => it.h3));
    const highlightHexData = [...hexSet]
        .filter(hex => !shownH3s.has(hex))
        .map(hex => ({
            hexBoundary: cellToBoundary(hex),
            h3: hex,
        }));

    g.selectAll("path.highlightHexagon")
        .data(highlightHexData)
        .join("path")
        .attr("style", "pointer-events: auto;")
        .attr("class", "highlightHexagon")
        .attr("d", d => generateHexPath(d, map))
        .style("fill", d => appState.getState("highlightColor"))
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
            handleMouseUp(event, d, isDragging, mouseDownTime, CLICK_THRESHOLD, isSelectHexMode, selectedH3s);
            isDragging = false;
        });
}

/**
 * Prepare hexData array from the given dataByH3.
 */
function prepareHexData(dataByH3, hexComunaIndex) {
    return Object.entries(dataByH3).map(([h3, hexObj]) => ({
        hexBoundary: cellToBoundary(h3),
        h3,
        comuna: hexComunaIndex.get(h3),
        count: hexObj.gini
            ? Object.values(hexObj.counts).reduce((sum, count) => sum + count, 0)
            : (hexObj.origin?.count ?? 0) + (hexObj.destination?.count ?? 0),
        ...hexObj
    }));
}

/**
 * Add a color gradient definition for a given hex.
 */
function addHexColorGradient(h3, originPercentage, defs, mapId) {
    const appState = new AppState();
    const destinationPercentage = 100 - originPercentage;

    const gradient = defs
        .append("linearGradient")
        .attr("id", `colorGradient${h3}${mapId}`)
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%");

    gradient.append("stop")
        .attr("offset", originPercentage + "%")
        .attr("stop-color", appState.getState("originColor"));

    gradient.append("stop")
        .attr("offset", originPercentage + "%")
        .attr("stop-color", appState.getState("destinationColor"));

    gradient.append("stop")
        .attr("offset", destinationPercentage + "%")
        .attr("stop-color", appState.getState("destinationColor"));
}

/**
 * Determine the fill color for a hex.
 */
function getHexFill(hex, mapId) {
    const appState = new AppState();
    if (hex.gini) {
        const mixturaColorScale = appState.getState("mixturaColorScale") || d3.interpolateWarm;
        const colorScale = d3.scaleSequential(mixturaColorScale).domain([1, 0.5]);
        return colorScale(hex.gini);
    }

    if (appState.getState("selectedH3s").has(hex.h3))
        return appState.getState("highlightColor");

    return `url(#colorGradient${hex.h3}${mapId})`;
}

/**
 * Determine the fill opacity for a hex.
 */
function getHexFillOpacity(hex, mapId, maxCount) {
    if (hex.gini) {
        return 0.8;
    }
    const opacityScale = d3.scaleLinear()
        .domain([0, maxCount * 0.1])
        .range([0.25, 0.7])
        .clamp(true);
    return opacityScale(hex.count);
}

/**
 * Determine the stroke color for a hex.
 */
function getHexStroke(hex) {
    if (hex.gini) {
        return "gray";
    }
    return "#CCCCCC";
}

/**
 * Generate the path string for a hex boundary.
 */
function generateHexPath(d, map) {
    const lineGenerator = d3.line()
        .x(coord => map.latLngToLayerPoint([coord[0], coord[1]]).x)
        .y(coord => map.latLngToLayerPoint([coord[0], coord[1]]).y);
    return lineGenerator(d.hexBoundary) + "Z";
}

/**
 * Get the tooltip content for a hex.
 */
function getTooltipContent(d, totalCount) {
    if (d.gini) {
        const groupCounts = Object.entries(d.counts)
            .map(([group, count]) => `Group ${group}: ${count}`)
            .join('<br>');
        return `
            ${groupCounts}<br>
            Índice de Gini: ${d.gini.toFixed(2)} <br>
            ${d.comuna ? `Comuna: ${d.comuna}. <br>` : ''}
            ${d.h3 ? `ID: ${d.h3}.` : ''}
        `;
    } else {
        return `
            ${d.origin ? `Orígenes: ${Number(d.origin.count)}.<br>` : ''}
            ${d.destination ? `Destinos: ${Number(d.destination.count)}.<br>` : ''}
            ${d.count ? `% Datos: ${Number(d.count * 100 / totalCount).toFixed(2)}%. <br>` : ''}
            ${d.comuna ? `Comuna: ${d.comuna}. <br>` : ''}
            ${d.h3 ? `ID: ${d.h3}.` : ''}
        `;
    }
}

/**
 * MouseUp handler to handle hex selection (click detection logic).
 */
function handleMouseUp(event, d, isDragging, mouseDownTime, CLICK_THRESHOLD, isSelectHexMode, selectedH3s) {
    const mouseUpTime = new Date().getTime();
    const timeDiff = mouseUpTime - mouseDownTime;

    if (!isDragging && timeDiff < CLICK_THRESHOLD) {
        if (isSelectHexMode) {
            if (selectedH3s.has(d.h3)) {
                selectedH3s.delete(d.h3);
            } else {
                selectedH3s.add(d.h3);
            }
            generateMaps({ updateDistributionChart: false });
        }
    }
}

/**
 * MouseOver handler: shows tooltip and optionally highlights hex.
 */
function handleMouseOver(event, d, tooltip, totalCount, isSelectHexMode, element, mapId, maxCount) {
    tooltip
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 20) + "px")
        .html(getTooltipContent(d, totalCount));

    tooltip.transition().duration(150).style("opacity", 0.8);

    if (isSelectHexMode) {
        d3.select(element).transition().duration(150).style('fill-opacity', 1);
    }
}

/**
 * MouseOut handler: hides tooltip and resets highlight if in selection mode.
 */
function handleMouseOut(event, d, tooltip, isSelectHexMode, element, mapId, maxCount) {
    tooltip.transition().duration(150).style("opacity", 0);

    if (isSelectHexMode) {
        d3.select(element).transition().duration(150).style('fill-opacity', getHexFillOpacity(d, mapId, maxCount));
    }
}

export { drawH3Hexagons }
