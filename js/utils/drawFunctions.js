import * as d3 from "d3";
import { getPathFromLinkData } from "./projectPoint.js";
import { colorMap } from "../static.js";


function updateSvgPaths(map, displayTypeString) {
    const g = d3.select(map.getPanes().overlayPane).select("svg").select("g")

    g.selectAll("path").attr("d", linkData => getPathFromLinkData(linkData, displayTypeString, map))
}

function getScales() {
    const scales = {
        "stroke-opacity": d3.scaleLinear().domain([0, 0.02]).range([0.5, 1]),
        "stroke-width": d3.scaleLinear().domain([0, 1]).range([1.3, 7]),
        "stroke": d3.scaleSequential(d3.interpolateWarm) // https://d3js.org/d3-scale-chromatic/sequential#interpolateWarm
    }

    return scales
}

function setDataSettingsOnMap(pathData, map) {
    const scales = getScales()
    const g = d3.select(map.getPanes().overlayPane).select("svg").select("g")
    const tooltip = d3.select(".tooltip")

    g.selectAll("path") // ("path.cat" + cat)
        .data(pathData)
        .join("path")
        //.attr("class", "cat" + cat) esto
        .attr("style", "pointer-events: auto;")
        .style("stroke", d => colorMap[d.group])
        .style("stroke-opacity", d => scales["stroke-opacity"](d.normalized_count))
        .style("stroke-width", d => 3)
        .on("mouseover", function (event, d) {
            // this contiene el elemento path, event es el evento, d contiene los datos

            tooltip
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 5) + "px")
                .text(`distance: ${Number(d.distance).toFixed(2)} \n norm: ${Number(d.normalized_count).toFixed(3)}`)

            tooltip.transition().duration(150).style("opacity", 0.9)

            d3.select(this).style('stroke', '#00688B')
        })
        .on("mouseout", function (event, d) {
            tooltip.transition().duration(150).style("opacity", 0)

            d3.select(this).style('stroke', d => colorMap[d.group]);
        })
}

function setDataSettingsOnClusteredFlowMap(pathData, map) {
    const scales = getScales()
    const colorScale = scales["stroke"]
    const g = d3.select(map.getPanes().overlayPane).select("svg").select("g")
    const tooltip = d3.select(".tooltip")

    g.selectAll("path") // ("path.cat" + cat)
        .data(pathData)
        .join("path")
        //.attr("class", "cat" + cat) esto
        .attr("style", "pointer-events: auto;")
        .style("stroke", d => colorScale(d.index))
        .style("stroke-opacity", d => scales["stroke-opacity"](d.normalized_total))
        .style("stroke-width", d => 3)
        .on("mouseover", function (event, d) {
            // this contiene el elemento path, event es el evento, d contiene los datos

            tooltip
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 5) + "px")
                .text(`index: ${Number(d.index).toFixed(2)}`)

            tooltip.transition().duration(150).style("opacity", 0.9)

            d3.select(this).style('stroke', '#00688B')
        })
        .on("mouseout", function (event, d) {
            tooltip.transition().duration(150).style("opacity", 0)

            d3.select(this).style('stroke', d => colorScale(d.index));
        })
}

export { updateSvgPaths, setDataSettingsOnMap, setDataSettingsOnClusteredFlowMap, getScales }