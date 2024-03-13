import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as L from 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/+esm'

import { accessToken } from "./token.js";
import { categories, colorMap, INITIAL_CENTER, INITIAL_ZOOM, MAX_ZOOM, LINK_COUNT_THRESHOLD } from "./static.js"
import { getPathFromLinkData } from "./utils/projectPoint.js";
import { getRawLinksByCategory } from "./utils/helperFunctions.js";

const map = L.map('map').setView(INITIAL_CENTER, INITIAL_ZOOM);

L.tileLayer(
    `https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${accessToken}`,
    { maxZoom: MAX_ZOOM }
).addTo(map)

L.svg({ clickable: true }).addTo(map)

const overlay = d3.select(map.getPanes().overlayPane)
const svg = overlay.select('svg').attr("pointer-events", "auto")
const g = svg.append('g').attr('class', 'leaflet-zoom-hide') // create a group that is hidden during zooming, because svg lines are updated after the zoom finishes

d3.select(".categoryCheckboxes").selectAll(".customCheckbox").property("checked", true)

categories.forEach((cat) => {
    d3.select("#cbox" + cat).on("change", (e) => updateSvgData(cat, e.target.checked))
})

let rawLinksByCategory, kMeansLinksByCategory

const updateSvgPaths = () => {
    g.selectAll("path")
        .attr("d", linkData => getPathFromLinkData(linkData, map))
}

const updateSvgData = (cat, shouldDisplay) => {
    const data = shouldDisplay ? kMeansLinksByCategory[cat] : []

    g.selectAll("path.cat" + cat)
        .data(data)
        .join("path")
        .attr("class", "cat" + cat)
        .attr("style", "pointer-events: auto;")
        .style("stroke", d => colorMap[cat])
        .attr("d", linkData => getPathFromLinkData(linkData, map))
        .on("mouseover", function (event, d) {
            // this contiene el elemento path, event es el evento, d contiene los datos
            d3.select(this).style('stroke', '#00688B')
        })
        .on("mouseout", function (d) {

            d3.select(this).style('stroke', colorMap[cat]);
        })

}

d3.json("/data/kmeans_edges.json")
    .then((data) => {
        kMeansLinksByCategory = data
    })

d3.csv("/data/trips_by_category.csv", (data) => {
    data = d3.autoType(data)

    return data.count > LINK_COUNT_THRESHOLD ? data : null
})
    .then((linksData) => {
        rawLinksByCategory = getRawLinksByCategory(linksData)
        categories.forEach((cat) => updateSvgData(cat, true))
        map.on('zoomend', updateSvgPaths)
    })


