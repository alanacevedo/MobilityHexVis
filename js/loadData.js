import * as d3 from "d3";


async function loadRawODData() {
    try {
        const data = await d3.csv("/data/od_11_15_cuartil.csv")
        data.forEach(obj => {
            obj.lat_O = Number(obj.lat_O)
            obj.lon_O = Number(obj.lon_O)
            obj.lat_D = Number(obj.lat_D)
            obj.lon_D = Number(obj.lon_D)
            obj.count = Number(obj.count)
        })
        return data
    } catch (error) {
        console.error(error)
    }
}

export { loadRawODData }