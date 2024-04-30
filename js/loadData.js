import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";



async function loadRawODData() {
    try {
        const data = await d3.csv("/data/od_11_15_cuartil.csv")
        return data
    } catch (error) {
        console.error(error)
    }
}

export { loadRawODData }