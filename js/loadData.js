import * as d3 from "d3";
import protobuf from 'protobufjs';
import Long from 'long'

// todo: change to firebase storage
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

const deserializeBinary = async (buffer) => {
    const response = await fetch("/data.proto", { headers: { 'Content-Type': 'text/plain' } });
    const protoText = await response.text();
    const root = protobuf.parse(protoText).root;
    const DataEntries = root.lookupType("DataEntries")

    const decoded_message = DataEntries.decode(new Uint8Array(buffer))
    const decoded_object = DataEntries.toObject(decoded_message, { defaults: true, longs: String })
    console.log(decoded_object.entries[0].h3_O)
    console.log(decoded_object.entries.slice(0, 1).map(obj => ({
        ...obj,
    })))
}

export { loadODData, deserializeBinary }