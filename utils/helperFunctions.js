import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { CATEGORIES } from "../static.js";

// distance of direct edge between link start and end
function distance(link) {
    const dx2 = Math.pow(link.startX - link.endX, 2)
    const dy2 = Math.pow(link.startY - link.endY, 2)

    return Math.sqrt(dx2 + dy2)
}

function getLinksByCategory(linksData) {
    const linksByCategory = {}

    CATEGORIES.forEach(category => {
        linksByCategory[category] = []
    })

    linksData.forEach(linkData => {
        linksByCategory[linkData.category].push(linkData)
    })

    return linksByCategory
}

export { getLinksByCategory }