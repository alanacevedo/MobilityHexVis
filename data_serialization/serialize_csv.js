import fs from 'fs';
import * as d3 from 'd3';
import protobuf from 'protobufjs';
import Long from 'long'
import csv from 'csv-parser';
import { parse } from 'csv-parse/sync';

// this script should be run from OD_vis_chile root

const CSV_DIR = "../../data_tesis/output/h3_7"

const serializeCsvToProtobuf = async (start_hour, end_hour) => {
    const root = await protobuf.load("./data_serialization/data.proto")
    const DataEntry = root.lookupType("DataEntry")
    const DataEntries = root.lookupType("DataEntries")


    const CSV_PATH = `${CSV_DIR}/od_${start_hour}_${end_hour}_cuartil.csv`

    const fileContent = fs.readFileSync(CSV_PATH, 'utf-8');

    // Parse the CSV content synchronously
    const records = parse(fileContent, {
        columns: true,  // Treat the first row as headers and create objects
        skip_empty_lines: true
    });

    const payloads = records.map(obj => ({
        h3_O: Long.fromString(obj.h3_O, 16),
        h3_D: Long.fromString(obj.h3_D, 16),
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

    const filePath = `./data_serialization/data_${start_hour}_${end_hour}.bin`;
    fs.writeFileSync(filePath, buffer);

    const readBuffer = fs.readFileSync(filePath);

    const decoded_message = DataEntries.decode(readBuffer)
    const decoded_object = DataEntries.toObject(decoded_message, { defaults: true })
    console.log(decoded_object.entries.slice(0, 3).map(obj => ({
        ...obj,
        h3_O: obj.h3_O.toString(16),
        h3_D: obj.h3_D.toString(16)
    })))
    //console.log(decoded_object.origin.toString(16))

}

serializeCsvToProtobuf(9, 15)