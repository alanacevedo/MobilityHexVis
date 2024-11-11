import protobuf from 'protobufjs';
import { app } from "../firebase.js";
import { getDownloadURL, getStorage, ref } from "firebase/storage";
import { cellToLatLng } from "h3-js"
import JSZip from "jszip";
import { point, booleanPointInPolygon } from '@turf/turf';


// Function to create the hex index
function createHexIndex(data) {
    const hexIndex = new Map();
    data.forEach((entry) => {
        if (!hexIndex.has(entry.h3_O)) hexIndex.set(entry.h3_O, new Set());
        if (!hexIndex.has(entry.h3_D)) hexIndex.set(entry.h3_D, new Set());
        hexIndex.get(entry.h3_O).add(entry);
        hexIndex.get(entry.h3_D).add(entry);
    });
    return hexIndex;
}


const deserializeBinary = async (buffer) => {
    const response = await fetch("/data.proto", { headers: { 'Content-Type': 'text/plain' } });
    const protoText = await response.text();
    const root = protobuf.parse(protoText).root;
    const DataEntries = root.lookupType("DataEntries")

    const decoded_message = DataEntries.decode(new Uint8Array(buffer))
    const decoded_object = DataEntries.toObject(decoded_message, { defaults: true, longs: String })
    return decoded_object.entries
}


async function loadComunas() {
    const rawJson = await fetch('/data/comunas_metropolitana.json')
    const comunas = await rawJson.json() // comunas is a FeatureCollection geoJson object.
    return comunas
}

function getHexSet(data) {
    const hexSet = new Set()
    for (const entry of data) {
        hexSet.add(entry.h3_O)
        hexSet.add(entry.h3_D)
    }
    return hexSet
}


function createComunaHexIndex(comunas, data) {
    const hexSet = getHexSet(data)
    const comunaHexIndex = new Map()
    const hexComunaIndex = new Map()

    for (const hex of hexSet) {
        const [lat, lng] = cellToLatLng(hex)
        const hexPoint = point([lng, lat])  // Note: point() expects [longitude, latitude]

        for (const comuna of comunas.features) {
            if (booleanPointInPolygon(hexPoint, comuna.geometry)) {
                const comunaName = comuna.properties.NOM_COM;
                if (!comunaHexIndex.has(comunaName)) {
                    comunaHexIndex.set(comunaName, new Set())
                }
                comunaHexIndex.get(comunaName).add(hex)
                hexComunaIndex.set(hex, comunaName)
                break  // Exit the inner loop once we've found the matching comuna
            }
        }
    }
    return [comunaHexIndex, hexComunaIndex]
}


async function loadODData(startHour, endHour, resolution) {
    try {
        const storage = getStorage(app);
        const testRef = ref(storage, `h3_${resolution}/od_${startHour}_${endHour}_${resolution}.zip`)
        const url = await getDownloadURL(testRef)

        const response = await fetch(url);
        const blob = await response.blob();

        const zipContent = await JSZip.loadAsync(blob);
        const fileName = Object.keys(zipContent.files)[0];
        const binaryArrayBuffer = await zipContent.files[fileName].async("arraybuffer");
        const data = await deserializeBinary(binaryArrayBuffer);
        return data
    } catch (error) {
        console.error(error)
    }
}


export { loadODData, deserializeBinary, loadComunas, createHexIndex, createComunaHexIndex }