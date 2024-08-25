import fs from 'fs';
import protobuf from 'protobufjs';
import Long from 'long'
import { parse } from 'csv-parse/sync';
import JSZip from 'jszip';

// this script should be run from OD_vis_chile root

const BASE_DIR = "../../data_tesis/output"

const serializeCsvToProtobuf = async (resolution, start_hour, end_hour) => {
    const csv_path = `${BASE_DIR}/h3_${resolution}/od_${start_hour}_${end_hour}_cuartil.csv`
    const output_path = `${BASE_DIR}/h3_${resolution}/compressed/od_${start_hour}_${end_hour}_${resolution}.zip`
    if (fs.existsSync(output_path)) return;

    const root = await protobuf.load("./data_serialization/data.proto")
    const DataEntry = root.lookupType("DataEntry")
    const DataEntries = root.lookupType("DataEntries")

    const fileContent = fs.readFileSync(csv_path, 'utf-8');
    const records = parse(fileContent, {
        columns: true,  // Treat the first row as headers and create objects
        skip_empty_lines: true
    });

    const payloads = records.map(obj => ({
        h3_O: obj.h3_O,
        h3_D: obj.h3_D,
        group: Number(obj.group),
        count: Number(obj.count),
        distance: Number(obj.distance),
        normTotal: Number(obj.norm_total),
        normGroup: Number(obj.norm_group),
    }))

    const dataEntriesList = payloads.map(payload => {
        const errMsg = DataEntry.verify(payload);
        if (errMsg) throw new Error(errMsg);
        return DataEntry.create(payload);
    });

    const dataEntriesPayload = {
        entries: dataEntriesList
    };

    const errMsg = DataEntries.verify(dataEntriesPayload);
    if (errMsg) throw new Error(errMsg);

    const dataEntriesMessage = DataEntries.create(dataEntriesPayload);

    const buffer = DataEntries.encode(dataEntriesMessage).finish();

    const zip = new JSZip()
    const fileName = `data_${start_hour}_${end_hour}_${resolution}.bin`;
    zip.file(fileName, buffer);

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
    fs.writeFileSync(output_path, zipBuffer);
}


for (const resolution of [7, 8, 9]) {
    for (let start = 0; start < 23; start++) {
        for (let end = start; end <= 23; end++) {
            console.log(`serializing: ${resolution} ${start} ${end}`)
            await serializeCsvToProtobuf(resolution, start, end)
        }
    }
}

/*
await serializeCsvToProtobuf(7, 8, 15)
//const zipBuffer = fs.readFileSync(`${BASE_DIR}/h3_7/compressed/od_9_15_7.zip`)
const zipBuffer = fs.readFileSync(`./public/od_8_15_7.zip`)
const zip = new JSZip();
const zipContent = await zip.loadAsync(zipBuffer);
const fileName = Object.keys(zipContent.files)[0];
const binaryArrayBuffer = await zipContent.files[fileName].async("arraybuffer");
console.log(binaryArrayBuffer)
const root = await protobuf.load("./data_serialization/data.proto")
const DataEntries = root.lookupType("DataEntries")
const decoded_message = DataEntries.decode(new Uint8Array(binaryArrayBuffer))
const decoded_object = DataEntries.toObject(decoded_message, { defaults: true })
console.log(decoded_object.entries[0].h3_O)
console.log(decoded_object.entries.slice(0, 1).map(obj => ({
    ...obj
})))
*/