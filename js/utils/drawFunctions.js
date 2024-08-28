import * as d3 from "d3";
import { getPathFromLinkData, projectFlow } from "./projectPoint.js";
import { colorMap } from "../static.js";
import { polygonSmooth, polygon } from "@turf/turf";
import { cellToLatLng, cellToBoundary } from "h3-js"


function updateSvgPaths(map, displayTypeString) {
    const g = d3.select(map.getPanes().overlayPane).select("svg").select("g")
    const zoom = map.getZoom()

    /*
    // esto para lineas
    g.selectAll("path")
        .attr("d", linkData => getPathFromLinkData(linkData, displayTypeString, map))
        .style("stroke-width", d => zoom - 6)
        */

    g.selectAll("path.hexagon")
        .attr("d", d => {
            // Recalculate the path string for hexagons using the current map zoom
            const pathData = d.map(latLng => {
                const point = map.latLngToLayerPoint(L.latLng(latLng));
                return [point.x, point.y];
            });
            const lineGenerator = d3.line();
            return lineGenerator(pathData) + "Z"; // Close the path
        })
        .style("stroke-width", 1); // You can adjust the stroke width based on zoom if needed

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

function drawH3Hexagons(dataByH3, map) {
    const hexagons = Object.keys(dataByH3).map(hex => cellToBoundary(hex))
    console.log(hexagons)
    // TODO: use values in origin and destination of each h3 to define the gradient to be used and the opacity.

    // Select the SVG layer from the Leaflet map
    const svg = d3.select(map.getPanes().overlayPane).select("svg");
    const defs = svg.append("defs")
    const g = svg.select("g");

    generateGradient(defs)

    // Bind data and draw hexagons
    g.selectAll("path.hexagon")
        .data(hexagons)
        .join("path")
        .attr("class", "hexagon")
        .attr("d", d => {
            // Generate a D3 path string from the hexagon coordinates
            const lineGenerator = d3.line()
                .x(d => map.latLngToLayerPoint([d[0], d[1]]).x)
                .y(d => map.latLngToLayerPoint([d[0], d[1]]).y);
            return lineGenerator(d) + "Z"; // Close the path
        })
        .style("fill", "url(#hexagonGradient)") // Apply the gradient fill
        .style("fill-opacity", 1)
        .style("stroke", "#7e1e94")
        .style("stroke-width", 1)
        .style("stroke-opacity", 0.8);
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

function generateGradient(defs) {

    const gradient = defs
        .append("linearGradient")
        .attr("id", "hexagonGradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%");

    gradient.append("stop")
        .attr("offset", "30%")
        .attr("stop-color", "pink");

    gradient.append("stop")
        .attr("offset", "30%")
        .attr("stop-color", "green");

    gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "green");

}


export { updateSvgPaths, setDataSettingsOnMap, getScales, drawH3Hexagons }