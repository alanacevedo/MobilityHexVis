import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { getPathFromLinkData } from "./projectPoint.js";
import { colorMap } from "../static.js";


function updateSvgPaths(map, displayTypeString) {
    const g = d3.select(map.getPanes().overlayPane).select("svg").select("g")

    g.selectAll("path").attr("d", linkData => getPathFromLinkData(linkData, displayTypeString, map))
}

function getScales() {
    const scales = {
        "stroke-opacity": d3.scaleLinear().domain([0, 0.3]).range([0.2, 1]),
        "stroke-width": d3.scaleLinear().domain([0, 1]).range([1.3, 7])
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
        .style("stroke-opacity", d => 1)
        .style("stroke-width", d => 4)
        .on("mouseover", function (event, d) {
            // this contiene el elemento path, event es el evento, d contiene los datos

            tooltip
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 5) + "px")
                .text(`distance: ${Number(d.distance).toFixed(2)}`)

            tooltip.transition().duration(150).style("opacity", 0.9)

            d3.select(this).style('stroke', '#00688B')
        })
        .on("mouseout", function (event, d) {
            tooltip.transition().duration(150).style("opacity", 0)

            d3.select(this).style('stroke', d => colorMap[d.group]);
        })
}

export { updateSvgPaths, setDataSettingsOnMap, getScales }