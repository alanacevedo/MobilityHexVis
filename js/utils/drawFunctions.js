import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { getPathFromLinkData } from "./projectPoint.js";
import { colorMap } from "../static.js";


function updateSvgPaths(map, displayTypeString) {
    const g = d3.select(map.getPanes().overlayPane).select("svg").select("g")

    // could be optimized by using "path.cat" + cat to only update paths of the (un)checked category.
    g.selectAll("path").attr("d", linkData => getPathFromLinkData(linkData, displayTypeString, map))
}

function getScales() {
    const scales = {
        "stroke-opacity": d3.scaleLinear().domain([0, 0.3]).range([0.2, 1]),
        "stroke-width": d3.scaleLinear().domain([0, 1]).range([1.3, 7])
    }

    return scales
}

function setDataSettingsOnMap(cat, pathData, map) {
    const scales = getScales()
    const g = d3.select(map.getPanes().overlayPane).select("svg").select("g")
    const tooltip = d3.select(".tooltip")

    g.selectAll("path.cat" + cat)
        .data(pathData)
        .join("path")
        .attr("class", "cat" + cat)
        .attr("style", "pointer-events: auto;")
        .style("stroke", d => colorMap[cat])
        .style("stroke-opacity", d => scales["stroke-opacity"] ? scales["stroke-opacity"](d[3]) : 0)
        .style("stroke-width", d => scales["stroke-width"] ? scales["stroke-width"](d[3]) : 0)
        .on("mouseover", function (event, d) {
            // this contiene el elemento path, event es el evento, d contiene los datos

            tooltip
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 5) + "px")
                .text(d[3].toFixed(2) + " % " + cat)

            tooltip.transition().duration(150).style("opacity", 0.9)

            d3.select(this).style('stroke', '#00688B')
        })
        .on("mouseout", function (event, d) {
            tooltip.transition().duration(150).style("opacity", 0)

            d3.select(this).style('stroke', colorMap[cat]);
        })
}

export { updateSvgPaths, setDataSettingsOnMap, getScales }