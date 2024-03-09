import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as L from 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/+esm'

import { accessToken } from "./token.js";
import { categories, colorMap, INITIAL_CENTER, INITIAL_ZOOM, MAX_ZOOM, LINK_COUNT_THRESHOLD } from "./static.js"
import { projectPoint } from "./utils/projectPoint.js";
import { getLinksByCategory } from "./utils/helperFunctions.js";

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

const line = d3.line()
    .x(d => d.x)
    .y(d => d.y)

let linksByCategory

const updateSvgPaths = () => {
    g.selectAll("path")
        .attr("d", linkData => {
            const start = projectPoint(linkData.lat_start, linkData.lon_start, map)
            const end = projectPoint(linkData.lat_end, linkData.lon_end, map)
            return line([start, end])
        })
}

const updateSvgData = (cat, shouldDisplay) => {
    const data = shouldDisplay ? linksByCategory[cat] : []

    g.selectAll("path.cat" + cat)
        .data(data)
        .join("path")
        .attr("class", "cat" + cat)
        .style("stroke", d => colorMap[cat])
        .attr("d", linkData => {
            const start = projectPoint(linkData.lat_start, linkData.lon_start, map)
            const end = projectPoint(linkData.lat_end, linkData.lon_end, map)
            return line([start, end])
        })
}

d3.csv("/data/trips_by_category.csv", (d) => {
    d = d3.autoType(d)

    return d.count > LINK_COUNT_THRESHOLD ? d : null
})
    .then((linksData) => {
        linksByCategory = getLinksByCategory(linksData)
        categories.forEach((cat) => updateSvgData(cat, true))
        map.on('zoomend', updateSvgPaths)
    })

