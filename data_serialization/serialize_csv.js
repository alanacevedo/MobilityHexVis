import fs from 'fs';
import * as d3 from 'd3';
import protobuf from 'protobufjs';
import Long from 'long'

const serializeCsvToProtobuf = async (start_hour, end_hour) => {
    const root = await protobuf.load("./data_serialization/data.proto")
    const DataEntry = root.lookupType("DataEntry")
    const DataEntries = root.lookupType("DataEntries")

    const payloads = [
        {
            h3_O: "wena",
            h3_D: "chao",
            group: 1,
            count: 2,
            distance: 3.0,
            normTotal: 32.3,
            normGroup: 45.0,
            origin: Long.fromString("88b2c5541bfffff", 16)
        },
        {
            h3_O: "hola",
            h3_D: "adios",
            group: 2,
            count: 3,
            distance: 4.0,
            normTotal: 12.3,
            normGroup: 22.0,
            origin: Long.fromString("77a2c5541afffff", 16)
        }
    ];

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
    console.log(decoded_object.entries.map(obj => ({ ...obj, origin: obj.origin.toString(16) })))
    //console.log(decoded_object.origin.toString(16))

}

serializeCsvToProtobuf(9, 15)