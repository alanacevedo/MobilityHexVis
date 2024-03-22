import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { getPathFromLinkData } from "./projectPoint.js";



function updateSvgPaths(map) {
    const g = d3.select(map.getPanes().overlayPane).select("svg").select("g")
    const pathFuncSelect = d3.select("#mapPathFuncSelect")

    // could be optimized by using "path.cat" + cat to only update paths of the (un)checked category.
    g.selectAll("path").attr("d", linkData => getPathFromLinkData(linkData, pathFuncSelect.property("value"), map))
}

function getScales(maxCount) {
    const scales = {
        "stroke-opacity": d3.scaleLinear().domain([0, 1]).range([0.5, 1]),
        "stroke-width": d3.scaleLinear().domain([0, 1]).range([1.3, 7])
    }

    return scales
}

export { updateSvgPaths, getScales }