import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { categories } from "../static.js";

// distance of direct edge between link start and end
function distance(link) {
    const dx2 = Math.pow(link.startX - link.endX, 2)
    const dy2 = Math.pow(link.startY - link.endY, 2)

    return Math.sqrt(dx2 + dy2)
}

function getRawLinksByCategory(linksData) {
    const linksByCategory = {}

    categories.forEach(category => {
        linksByCategory[category] = []
    })

    linksData.forEach(linkData => {
        linksByCategory[linkData.category].push([
            [linkData.lat_start, linkData.lon_start],
            [linkData.lat_end, linkData.lon_end],
            linkData.count
        ])
    })

    return linksByCategory
}

function getMaxCount(linksData) {
    let max_count = 0
    Object.values(linksData).forEach(arr => {
        const counts = arr.map(x => x[2])
        max_count = Math.max(max_count, Math.max(...counts))
    })

    return max_count
}

export { getRawLinksByCategory, getMaxCount }