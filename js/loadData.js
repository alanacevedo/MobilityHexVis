import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { getMaxCount, getRawLinksByCategory } from "./utils/helperFunctions.js";

async function loadData() {
    const kMeansData = await loadKMeansData()
    const rawData = await loadRawData()
    const data = { kMeansData, rawData }
    return data
}

async function loadKMeansData() {
    try {
        const data = await d3.json("/data/kmeans_edges.json")
        const maxCount = getMaxCount(data)

        return { data, maxCount }

    } catch (error) {
        console.error("Error loading KMeans data:", error)
    }

}

async function loadRawData() {
    try {
        const rawData = await d3.csv("/data/trips_by_category.csv")
        const data = getRawLinksByCategory(rawData.map(d3.autoType))
        const maxCount = getMaxCount(data)

        return { data, maxCount }

    } catch (error) {
        console.error("Error loading Raw data:", error)
    }
}

export { loadData }