import * as d3 from "d3";


async function loadRawODData() {
    const attributesToBeParsed = ["lat_O", "lon_O", "lat_D", "lon_D", "count", "distance"]
    try {
        const data = await d3.csv("/data/od_11_15_cuartil.csv")
        data.forEach(obj => {
            attributesToBeParsed.forEach(attr => {
                obj[attr] = Number(obj[attr])
            })
        })
        return data
    } catch (error) {
        console.error(error)
    }
}

export { loadRawODData }