import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { getMaxCount, getRawLinksByCategory } from "./utils/helperFunctions.js";
import { categories } from "./static.js";

async function loadData() {
    const kMeansData = await loadKMeansData()
    const rawData = await loadRawData()
    addPercentageToData(kMeansData)
    addPercentageToData(rawData)

    const data = { kMeansData, rawData }
    return data
}

async function loadKMeansData() {
    try {
        const data = await d3.json("/data/kmeans_edges.json")

        return data

    } catch (error) {
        console.error("Error loading KMeans data:", error)
    }
}

async function loadRawData() {
    try {
        const rawData = await d3.csv("/data/trips_by_category.csv")
        const data = getRawLinksByCategory(rawData.map(d3.autoType))

        return data

    } catch (error) {
        console.error("Error loading Raw data:", error)
    }
}

// agrega a cada arista el peso porcentual de su count respecto al total de su categoría
function addPercentageToData(data) {
    for (const [cat, linksData] of Object.entries(data)) {
        const total = linksData.reduce((currSum, linkData) => currSum + linkData[2], 0)
        data[cat] = data[cat].filter(link => link[2] > 5)
        linksData.forEach(linkData => linkData.push(linkData[2] / total))
    }
}

async function loadRawODData() {
    try {
        const data = await d3.csv("/data/od_11_15_cuartil.csv")
        return data
    } catch (error) {
        console.error(error)
    }
}

export { loadData, loadRawODData }