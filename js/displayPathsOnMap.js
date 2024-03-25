import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

import { categories } from "./static.js";
import { updateSvgPaths, setDataSettingsOnMap, getScales } from "./utils/drawFunctions.js";
import { generateSegments } from "./bundling/d3_force_bundle/forceBundle.js";
import { colorMap } from "./static.js";

function displayDataToAllMaps(maps, givenData, displayTypeString) {
    if (displayTypeString === "forceDirected") {
        displayForceDirectedToAllMaps(maps, givenData)
        return
    }

    defaultDisplayDataToAllMaps(maps, givenData, displayTypeString)
}

function defaultDisplayDataToAllMaps(maps, givenData, displayTypeString) {
    // Set the data to be displayed in each map

    const largeSingleMap = maps["largeSingle"]

    categories.forEach((cat) => {
        const { data, maxCount } = givenData

        const map = maps[cat]
        const pathData = data[cat]

        setDataSettingsOnMap(cat, pathData, map)
        setDataSettingsOnMap(cat, pathData, largeSingleMap)

        // large single checkbox
        d3.select("#cbox" + cat).on("change", (e) => {
            const shouldDisplay = e.target.checked
            setDataSettingsOnMap(cat, shouldDisplay ? pathData : [], largeSingleMap)
            updateSvgPaths(largeSingleMap, displayTypeString)
        })

        // Display the data on each map
        updateSvgPaths(map, displayTypeString)
        map.on('zoomend', () => updateSvgPaths(map, displayTypeString))

    })

    updateSvgPaths(largeSingleMap, displayTypeString)
    largeSingleMap.on('zoomend', () => updateSvgPaths(largeSingleMap, displayTypeString))
}

function displayForceDirectedToAllMaps(maps, givenData) {
    const largeSingleMap = maps["largeSingle"]

    const line = d3.line()
        .curve(d3.curveBundle)
        .x(d => d.x)
        .y(d => d.y)

    categories.forEach(cat => {

        const linksData = (givenData.data)[cat]
        const map = maps[cat]
        const bundle = generateSegments(linksData, map)
        const scales = getScales()
        const tooltip = d3.select(".tooltip")

        const g = d3.select(map.getPanes().overlayPane).select("svg").select("g")
        const edges = g.selectAll("path.cat" + cat)
            .data(bundle.paths)
            .join("path")
            .attr("class", "cat" + cat)
            .attr("style", "pointer-events: auto;")
            .style("stroke", d => colorMap[cat])
            .style("stroke-opacity", d => scales["stroke-opacity"] ? scales["stroke-opacity"](d.percentage) : 0)
            .style("stroke-width", d => scales["stroke-width"] ? scales["stroke-width"](d.percentage) : 0)
            .attr("d", d => line(d.path))
            .on("mouseover", function (event, d) {
                // this contiene el elemento path, event es el evento, d contiene los datos

                tooltip
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 5) + "px")
                    .text(d.percentage.toFixed(2) + " % " + cat)

                tooltip.transition().duration(150).style("opacity", 0.9)

                d3.select(this).style('stroke', '#00688B')
            })
            .on("mouseout", function (event, d) {
                tooltip.transition().duration(150).style("opacity", 0)

                d3.select(this).style('stroke', colorMap[cat]);
            })


        const layout = d3.forceSimulation()
            // settle at a layout faster
            .alphaDecay(0.2)
            // nearby nodes attract each other
            .force("charge", d3.forceManyBody()
                .strength(10)
                .distanceMax(5)
            )
            // edges want to be as short as possible
            // prevents too much stretching
            .force("link", d3.forceLink()
                .strength(0.7)
                .distance(0)
            )
            .on("tick", function (d) {
                edges.attr("d", d => line(d.path))
            })
            .on("end", function (d) {
                console.log("layout complete");
            });

        layout.nodes(bundle.nodes).force("link").links(bundle.links);

    })
}

export { displayDataToAllMaps }