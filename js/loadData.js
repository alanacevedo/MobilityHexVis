import * as d3 from "d3";


async function loadODData(startHour, endHour) {
    const attributesToBeParsed = ["lat_O", "lon_O", "lat_D", "lon_D", "count", "distance", "norm_total"]
    try {
        const data = await d3.csv(`/data/od_${startHour}_${endHour}_cuartil.csv`)
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

export { loadODData }