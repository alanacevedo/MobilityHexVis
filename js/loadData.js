import protobuf from 'protobufjs';
import { app } from "../firebase.js";
import { getDownloadURL, getStorage, ref } from "firebase/storage";
import JSZip from "jszip";

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
        const hexIndex = createHexIndex(data);
        return { data, hexIndex };
    } catch (error) {
        console.error(error)
    }
}

async function loadComunas() {
    const rawJson = await fetch('/data/comunas_metropolitana.json')
    const comunas = await rawJson.json()
    return comunas
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

export { loadODData, deserializeBinary, loadComunas }