import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const SEGMENT_RANGE = [1, 10]

function generateSegments(links, hypotenuse) {
    const segmentScale = d3.scaleLinear().domain([0, hypotenuse]).range(SEGMENT_RANGE)

    const bundle = {
        nodes: [],
        links: [],
        paths: []
    }

    links.forEach((link) => {
        const { startX, startY, endX, endY } = link
        const linkLength = distance(link)
        const totalSegments = Math.round(segmentScale(linkLength))

        const xScale = d3.scaleLinear().domain([0, totalSegments + 1]).range([startX, endX])
        const yScale = d3.scaleLinear().domain([0, totalSegments + 1]).range([startY, endY])

        // start and end nodes have to be fixed, so only in those are fx and fy defined.

        let source = {
            x: startX,
            fx: startX,
            y: startY,
            fy: startY
        }

        let target = null

        const path = [source]
        bundle.nodes.push(source)

        for (let segment = 1; segment <= totalSegments; segment++) {
            target = {
                x: xScale(segment),
                y: yScale(segment)
            }

            path.push(target)
            bundle.nodes.push(target)
            bundle.links.push({
                source: source,
                target: target
            })

            source = target
        }

        const endNode = {
            x: endX,
            fx: endX,
            y: endY,
            fy: endY
        }

        path.push(endNode)
        bundle.nodes.push(endNode)
        bundle.links.push({
            source: target,
            target: endNode
        })

        bundle.paths.push(path)
    })

    return bundle
}

// distance of direct edge between link start and end
function distance(link) {
    const dx2 = Math.pow(link.startX - link.endX, 2)
    const dy2 = Math.pow(link.startY - link.endY, 2)

    return Math.sqrt(dx2 + dy2)
}

export { generateSegments }