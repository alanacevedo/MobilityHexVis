import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as L from 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/+esm'

import { accessToken } from "./static.js"
import { addProjectionsToLinks } from "./utils/projectPoint.js";
import { generateSegments } from "./utils/forceBundle.js";

const INITIAL_CENTER = [-33.471258, -70.646552]
const INITIAL_ZOOM = 11
const MAX_ZOOM = 12
const LINK_COUNT_THRESHOLD = 7

const map = L.map('map').setView(INITIAL_CENTER, INITIAL_ZOOM);


const osmLayer = L.tileLayer(
    `https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${accessToken}`,
    { maxZoom: MAX_ZOOM }
).addTo(map)

L.svg({ clickable: true }).addTo(map)

const overlay = d3.select(map.getPanes().overlayPane)
const svg = overlay.select('svg').attr("pointer-events", "auto")
const g = svg.append('g').attr('class', 'leaflet-zoom-hide') // create a group that is hidden during zooming

const width = parseInt(svg.attr("width"));
const height = parseInt(svg.attr("height"));
const hypotenuse = Math.sqrt(width * width + height * height);

// Use Leaflets projection API for drawing svg path (creates a stream of projected points)
const projectPoint = function (x, y) {
    const point = map.latLngToLayerPoint(new L.LatLng(x, y))
    this.stream.point(point.x, point.y)
}

// Use d3's custom geo transform method to implement the above
const projection = d3.geoTransform({ point: projectPoint })
// creates geopath from projected points (SVG)
const pathCreator = d3.geoPath().projection(projection)

const colorMap = {
    abc1: "brown",
    c2: "red",
    c3: "green",
    d: "blue",
    e: "purple"
}

let line

// Function to place svg based on zoom
const initializeSvg = (data) => {
    const { nodes, links, paths } = data
    console.log("init", nodes, links, paths)
    line = d3.line()
        .curve(d3.curveBundle)
        .x(d => d.x)
        .y(d => d.y)

    const edges = g.selectAll("edge")
        .data(paths)
        .join("path")
        .attr("d", d => line(d.path))
        .attr("class", "edge")
        .style("stroke", d => colorMap[d.category])


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
            .strength(2)
            .distance(0)
        )
        .on("tick", function (d) {
            edges.attr("d", d => line(d.path));
        })
        .on("end", function (d) {
            console.log("layout complete");
        });

    layout.nodes(nodes).force("link").links(links);
    /*

    line = g.selectAll("linePath")
        .data([])
        .join("path")
        .style("fill", "none")
        .style("stroke", (d) => (
            colorMap[d.category]
        ))
        .style("stroke-width", 1)
    */
    /*

    const xdLine = d3.line().x(d => d.x).y(d => d.y)

    const a = map.latLngToLayerPoint(new L.LatLng(-33.441039, -70.733689))
    const b = map.latLngToLayerPoint(new L.LatLng(-33.530949, -70.596270))
    console.log("choripan")

    const mock_data = [[a, b]]
    console.log(mock_data)

    const wena = g.selectAll("linePathXD")
        .data(mock_data)
        .join("path")
        .attr("d", xdLine)
        .style("stroke-width", 3)
        .style("fill", "none")
        .style("stroke", "red")

    */

    //map.on('zoomend', updateSvg)
    //map.on("moveend", updateSvg)

    //updateSvg()
}

const updateSvg = () => {
    line.attr("d", (d) => (
        pathCreator({

            "type": "LineString",
            "coordinates": [[d.lat_start, d.lon_start], [d.lat_end, d.lon_end]]
        }))
    )
}

d3.csv("/data/trips_by_category.csv", (d) => {
    d = d3.autoType(d)
    return d.count > LINK_COUNT_THRESHOLD ? d : null
})
    .then((linksData) => {
        console.log([...linksData])
        addProjectionsToLinks(linksData, map)
        const bundle = generateSegments(linksData, hypotenuse)
        console.log(bundle)
        initializeSvg(bundle)
    })

// reset whenever map is moved or zoomed



