import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

import { categories, colorMap } from "./static.js"
import { getPathFromLinkData } from "./utils/projectPoint.js";

function displayLargeSingle(data, map) {
    const g = d3.select(map.getPanes().overlayPane).select("svg").select("g")


    d3.select(".categoryCheckboxes").selectAll(".customCheckbox").property("checked", true)

    const pathFuncSelect = d3.select("#bigMapPathFuncSelect") // used for selecting path creation function
    pathFuncSelect.on("change", e => updateSvgPaths())

    categories.forEach((cat) => {
        d3.select("#cbox" + cat).on("change", (e) => updateSvgData(cat, e.target.checked))
    })

    const kMeansLinksByCategory = data.kMeansData.data

    /*
    for (const [cat, dataArray] of Object.entries(kMeansLinksByCategory)) {
        kMeansLinksByCategory[cat] = dataArray.filter(data => data[2] > LINK_COUNT_THRESHOLD)
    }
    */

    const maxCount = data.kMeansData.maxCount
    const scales = {
        "stroke-opacity": d3.scaleLinear().domain([0, maxCount]).range([0.5, 1]),
        "stroke-width": d3.scaleLinear().domain([0, maxCount]).range([0.5, 7])
    }

    const updateSvgPaths = () => {
        g.selectAll("path")
            .attr("d", linkData => getPathFromLinkData(linkData, pathFuncSelect.property("value"), map))
    }

    const tooltip = d3.select(".tooltip")

    const updateSvgData = (cat, shouldDisplay) => {
        const pathData = shouldDisplay ? kMeansLinksByCategory[cat] : []

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
    }

    categories.forEach((cat) => updateSvgData(cat, true))
    map.on('zoomend', updateSvgPaths)

}

export { displayLargeSingle }