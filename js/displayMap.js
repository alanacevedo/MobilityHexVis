import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as L from 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/+esm'

import { accessToken } from "./token.js";
import { categories, colorMap, INITIAL_CENTER, INITIAL_ZOOM, MAX_ZOOM, LINK_COUNT_THRESHOLD } from "./static.js"
import { getPathFromLinkData } from "./utils/projectPoint.js";

function displayMap(cat, data, map) {
    const g = d3.select(map.getPanes().overlayPane).select("svg").select("g")

    const pathFuncSelect = d3.select("#smallMapPathFuncSelect") // used for selecting path creation function
    pathFuncSelect.on("change", e => updateSvgPaths())

    const kMeansLinksByCategory = data.kMeansData.data
    const maxCount = data.kMeansData.maxCount

    const scales = {
        "stroke-opacity": d3.scaleLinear().domain([0, maxCount]).range([0.5, 1]),
        "stroke-width": d3.scaleLinear().domain([0, maxCount]).range([0.5, 7])
    }

    const updateSvgPaths = () => {
        console.log("wena")
        g.selectAll("path")
            .attr("d", linkData => getPathFromLinkData(linkData, pathFuncSelect.property("value"), map))
    }


    const tooltip = d3.select(".tooltip")

    const pathData = kMeansLinksByCategory[cat]

    g.selectAll("path.cat" + cat)
        .data(pathData)
        .join("path")
        .attr("class", "cat" + cat)
        .attr("style", "pointer-events: auto;")
        .style("stroke", d => colorMap[cat])
        .style("stroke-opacity", d => scales["stroke-opacity"] ? scales["stroke-opacity"](d[2]) : 0)
        .style("stroke-width", d => scales["stroke-width"] ? scales["stroke-width"](d[2]) : 0)
        .attr("d", linkData => getPathFromLinkData(linkData, pathFuncSelect.property("value"), map))
        .on("mouseover", function (event, d) {
            // this contiene el elemento path, event es el evento, d contiene los datos

            tooltip
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 5) + "px")
                .text("Count: " + d[2])

            tooltip.transition().duration(150).style("opacity", 0.9)

            d3.select(this).style('stroke', '#00688B')
        })
        .on("mouseout", function (event, d) {
            tooltip.transition().duration(150).style("opacity", 0)

            d3.select(this).style('stroke', colorMap[cat]);
        })

    map.on('zoomend', updateSvgPaths)



}
export { displayMap }