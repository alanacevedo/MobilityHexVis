import * as d3 from "d3";
import { getPathFromLinkData, projectFlow } from "./projectPoint.js";
import { colorMap } from "../static.js";
import { polygonSmooth, polygon } from "@turf/turf";
import { cellToLatLng, cellToBoundary } from "h3-js"
import { AppState } from "../appState.js";
import { generateMaps } from "./domFunctions.js";


const ORIGIN_COLOR = "#00FFFF"
const DESTINATION_COLOR = "#FF00FF"
const HIGHLIGHT_COLOR = "#FFFF00"


function updateSvgPaths(map, displayTypeString) {
    const g = d3.select(map.getPanes().overlayPane).select("svg").select("g")
    const zoom = map.getZoom()
    const mapId = map.options.uuid
    const appState = new AppState()
    const selectedH3s = appState.getState("selectedH3s")

    /*
    // esto para lineas
    g.selectAll("path")
        .attr("d", linkData => getPathFromLinkData(linkData, displayTypeString, map))
        .style("stroke-width", d => zoom - 6)
        */

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

}

function getScales() {
    const scales = {
        "stroke-opacity": d3.scaleLinear().domain([0, 0.002]).range([0.1, 1]),
        "stroke-width": d3.scaleLinear().domain([0, 1]).range([1.3, 7]),
        // https://d3js.org/d3-scale-chromatic/sequential#interpolateWarm
        "stroke": d3.scaleSequential(d3.interpolateWarm).domain([1, 0.3]), // Inversión de dominio para que mayor desigualdad sea oscuro  
    }

    return scales
}

function setDataSettingsOnMap(pathData, map) {
    const scales = getScales()
    const svg = d3.select(map.getPanes().overlayPane).select("svg");
    const g = svg.select("g");
    const tooltip = d3.select(".tooltip")

    const defs = d3.select(map.getPanes().overlayPane).select("svg").append("svg:defs")

    pathData.forEach(flowObj => {
        const angle = getFlowAngle(flowObj, map)
        const angleCoords = getAngleCoords(angle)

        const gradient = defs.append("linearGradient")
            .attr("id", "gradient" + flowObj.id)
            .attr("x1", angleCoords.x1)
            .attr("y1", angleCoords.y1)
            .attr("x2", angleCoords.x2)
            .attr("y2", angleCoords.y2)

        gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "#008080"); // destination color

        gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "#FFA500"); // origin color
    })


    g.selectAll("path") // ("path.cat" + cat)
        .data(pathData)
        .join("path")
        //.attr("class", "cat" + cat) esto
        .attr("style", "pointer-events: auto;")
        .style("stroke", d => `url(#gradient${d.id})`)
        .style("stroke-opacity", d => scales["stroke-opacity"](d.norm_total))
        .on("mouseover", function (event, d) {
            // this contiene el elemento path, event es el evento, d contiene los datos

            tooltip
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px")
                .html(`Distancia: ${Number(d.distance).toFixed(2)} km. <br> Ocurrencias: ${Number(d.count)}`)

            tooltip.transition().duration(150).style("opacity", 0.8)

            //d3.select(this).style('stroke', '#00688B')
        })
        .on("mouseout", function (event, d) {
            tooltip.transition().duration(150).style("opacity", 0)

            //d3.select(this).style('stroke', d => colorMap[d.group]);
        })
}

function drawH3Hexagons(dataByH3, hexSet, map) {
    const appState = new AppState()
    const selectedH3s = appState.getState("selectedH3s")
    const hexData = Object.entries(dataByH3).map(([h3, hexObj]) => ({
        hexBoundary: cellToBoundary(h3),
        h3,
        count: (hexObj.origin?.count ?? 0) + (hexObj.destination?.count ?? 0),
        ...hexObj
    }))
    const totalCount = hexData.reduce((acc, hexObj) => acc + hexObj.count, 0)
    const maxCount = Math.max(...hexData.map(hexObj => hexObj.count))

    // TODO: definir mejor la escala
    const opacityScale = d3.scaleLinear().domain([0, maxCount * 0.1]).range([0.25, 0.7]).clamp(true);

    const mapId = map.options.uuid
    const svg = d3.select(map.getPanes().overlayPane).select("svg");
    svg.selectAll("defs").remove();
    const defs = svg.append("defs")
    const g = svg.select("g");
    const tooltip = d3.select(".tooltip")

    for (const [h3, hexObj] of Object.entries(dataByH3)) {
        const originCount = hexObj.origin?.count ?? 0
        const destinationCount = hexObj.destination?.count ?? 0
        const originPercentage = 100 * originCount / (originCount + destinationCount)
        addHexColorGradient(h3, originPercentage, defs, mapId)
    }

    // Bind data and draw hexagons
    g.selectAll("path.hexagon")
        .data(hexData)
        .join("path")
        .attr("style", "pointer-events: auto;")
        .attr("class", "hexagon")
        .attr("d", d => generateHexPath(d, map))
        .style("fill", d => getHexFill(d, mapId)) // Apply the gradient fill
        .style("fill-opacity", d => opacityScale(d.count))
        .style("stroke", "#CCCCCC")
        .style("stroke-width", 0.5)
        .style("stroke-opacity", 0.8)
        .on("mouseover", function (event, d) {
            // this contiene el elemento path, event es el evento, d contiene los datos
            tooltip
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px")
                .html(`
                    ${d.origin ? `Orígenes: ${Number(d.origin.count)}.<br>` : ''}
                    ${d.destination ? `Destinos: ${Number(d.destination.count)}.<br>` : ''}
                    ${d.count ? `% datos: ${Number(d.count * 100 / totalCount).toFixed(2)}%` : ''}`
                )

            tooltip.transition().duration(150).style("opacity", 0.8)

            d3.select(this).transition().duration(150).style('fill-opacity', 1)
        })
        .on("mouseout", function (event, d) {
            tooltip.transition().duration(150).style("opacity", 0)

            d3.select(this).transition().duration(150).style('fill-opacity', d => opacityScale(d.count))
        })
        .on("click", (e, d) => {
            if (selectedH3s.has(d.h3)) {
                selectedH3s.delete(d.h3)
            } else {
                selectedH3s.add(d.h3)
            }
            generateMaps({ updateDistributionChart: false })
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
        .on("click", (e, d) => {
            const selectedH3s = appState.getState("selectedH3s")
            if (selectedH3s.has(d.h3)) {
                selectedH3s.delete(d.h3)
            } else {
                selectedH3s.add(d.h3)
            }
            generateMaps({ updateDistributionChart: false })
        })

}

function getFlowAngle(flowObj, map) {
    const { start, end } = projectFlow(flowObj, map)

    const dx = end.x - start.x
    const dy = end.y - start.y

    // Use arctangent to get the angle in radians
    const angleInRadians = Math.atan2(dy, dx)

    // Optionally convert to degrees if needed
    const angleInDegrees = angleInRadians * 180 / Math.PI

    return angleInDegrees;
}

function getAngleCoords(angle) {
    var anglePI = (angle) * (Math.PI / 180);
    var angleCoords = {
        'x1': Math.round(50 + Math.sin(anglePI) * 50) + '%',
        'y1': Math.round(50 + Math.cos(anglePI) * 50) + '%',
        'x2': Math.round(50 + Math.sin(anglePI + Math.PI) * 50) + '%',
        'y2': Math.round(50 + Math.cos(anglePI + Math.PI) * 50) + '%',
    }
    return angleCoords
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

function getHexFill(hex, mapId) {
    if ((new AppState()).getState("selectedH3s").has(hex.h3))
        return HIGHLIGHT_COLOR
    return `url(#colorGradient${hex.h3}${mapId})`
}

function generateHexPath(d, map) {
    const lineGenerator = d3.line()
        .x(d => map.latLngToLayerPoint([d[0], d[1]]).x)
        .y(d => map.latLngToLayerPoint([d[0], d[1]]).y);
    return lineGenerator(d.hexBoundary) + "Z"; // Close the path
}


export { updateSvgPaths, setDataSettingsOnMap, getScales, drawH3Hexagons }