import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

import { colorMap } from "./static.js"
import { getScales } from "./utils/drawFunctions.js";

function displayPathsOnMap(cat, pathData, map, scales) {
    const g = d3.select(map.getPanes().overlayPane).select("svg").select("g")
    const tooltip = d3.select(".tooltip")

    g.selectAll("path.cat" + cat)
        .data(pathData)
        .join("path")
        .attr("class", "cat" + cat)
        .attr("style", "pointer-events: auto;")
        .style("stroke", d => colorMap[cat])
        .style("stroke-opacity", d => scales["stroke-opacity"] ? scales["stroke-opacity"](d[2]) : 0)
        .style("stroke-width", d => scales["stroke-width"] ? scales["stroke-width"](d[2]) : 0)
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
export { displayPathsOnMap }