import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const SEGMENT_RANGE = [1, 10]

function generateSegments(links) {

    // scale determines how many control nodes each edge has
    const svg = d3.select("#mapAbc1").select("svg")
    const width = parseInt(svg.attr("width"))
    const height = parseInt(svg.attr("height"))
    const hypotenuse = Math.sqrt(width * width + height * height);
    const segmentScale = d3.scaleLinear().domain([0, hypotenuse]).range(SEGMENT_RANGE)

    const bundle = {
        nodes: [],
        links: [],
        paths: []
    }

    links.forEach(link => {
        console.log(link)
    })



}