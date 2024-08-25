import protobuf from 'protobufjs';
import { app } from "../firebase.js";
import { getDownloadURL, getStorage, ref } from "firebase/storage";
import JSZip from "jszip";

// todo: change to firebase storage
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
        return deserializeBinary(binaryArrayBuffer)
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
    return decoded_object.entries
}

export { loadODData, deserializeBinary }