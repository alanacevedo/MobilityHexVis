import * as d3 from "d3";
import { projectPoint } from "../../utils/projectPoint.js";

const SEGMENT_RANGE = [1, 10]

function distance(start, end) {
    const dx2 = Math.pow(start.x - end.x, 2)
    const dy2 = Math.pow(start.y - end.y, 2)

    return Math.sqrt(dx2 + dy2)
}

function generateSegments(linksData, map) {

    // scale determines how many control nodes each edge has
    const svg = d3.select("#mapAbc1").select("svg") // de momento solo consideraré los mapas chicos
    const width = parseInt(svg.attr("width"))
    const height = parseInt(svg.attr("height"))
    const hypotenuse = Math.sqrt(width * width + height * height);
    const segmentScale = d3.scaleLinear().domain([0, hypotenuse]).range(SEGMENT_RANGE)

    // This bundle will be used by the simulation to do force-directed edge bundling
    const bundle = {
        nodes: [],
        links: [],
        paths: []
    }

    linksData.forEach(linkData => {
        const [start, end, count, percentage] = linkData

        const startNode = projectPoint(start, map)
        const endNode = projectPoint(end, map)

        // fx fy makes it so these nodes can't be moved by the forces, unlike the nodes that will be created in between (segments).
        startNode.fx = startNode.x
        startNode.fy = startNode.y
        endNode.fx = endNode.x
        endNode.fy = endNode.y

        // scales help define the position of each sub-node in each edge
        const edgeLength = distance(startNode, endNode)
        const totalSegments = Math.round(segmentScale(edgeLength))
        const xScale = d3.scaleLinear().domain([0, totalSegments + 1]).range([startNode.x, endNode.x])
        const yScale = d3.scaleLinear().domain([0, totalSegments + 1]).range([startNode.y, endNode.y])


        // we generate the path, and add the nodes and links to the bundle.

        let from = startNode
        let to = null
        const path = [startNode]
        bundle.nodes.push(startNode)

        for (let segment = 1; segment <= totalSegments; segment++) {

            to = {
                x: xScale(segment),
                y: yScale(segment)
            }

            path.push(to)
            bundle.nodes.push(to)
            bundle.links.push({
                source: from,
                target: to
            })

            from = to
        }

        path.push(endNode)
        bundle.nodes.push(endNode)
        bundle.links.push({
            source: to,
            target: endNode
        })

        bundle.paths.push({ path, count, percentage })

    })

    return bundle
}

export { generateSegments }