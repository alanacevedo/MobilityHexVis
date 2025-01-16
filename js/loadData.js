import protobuf from 'protobufjs';
import { cellToLatLng, latLngToCell, UNITS, greatCircleDistance } from "h3-js"
import * as d3 from 'd3';
import { point, booleanPointInPolygon } from '@turf/turf';
import { asyncBufferFromUrl, parquetRead } from 'hyparquet';


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

function getHexDistance(h3_O, h3_D) {
    return greatCircleDistance(
        cellToLatLng(h3_O),
        cellToLatLng(h3_D),
        UNITS.km
    )
}


async function loadODData(startHour, endHour, resolution) {
    try {
      let parquetData = [];
      await parquetRead({
        file: await asyncBufferFromUrl({ url: '/data/flows.parquet' }),
        onComplete: (raw) => { parquetData = raw; }
      });
  
      let data = parquetData.map(row => ({
        lat_O: Number(row[0]),
        lon_O: Number(row[1]),
        lat_D: Number(row[2]),
        lon_D: Number(row[3]),
        group: row[4] !== undefined ? Number(row[4]) : undefined,
        count: row[5] !== undefined ? Number(row[5]) : undefined,
        start_hour: row[6] !== undefined ? Number(row[6]) : undefined,
        end_hour: row[7] !== undefined ? Number(row[7]) : undefined
      }));
  
      const hasStart = data.some(d => d.start_hour !== undefined);
      const hasEnd = data.some(d => d.end_hour !== undefined);
      if (hasStart && hasEnd) {
        data = data.filter(d => d.start_hour === startHour && d.end_hour === endHour);
      }
  
      for (const f of data) {
        f.h3_O = latLngToCell(f.lat_O, f.lon_O, resolution);
        f.h3_D = latLngToCell(f.lat_D, f.lon_D, resolution);
      }
  
      const merged = new Map();
      for (const f of data) {
        const k = `${f.h3_O}-${f.h3_D}-${f.group}`;
        if (!merged.has(k)) merged.set(k, { ...f });
        else merged.get(k).count += f.count;
      }
  
      const mergedData = [...merged.values()];
      for (const f of mergedData) f.distance = getHexDistance(f.h3_O, f.h3_D);
  
      const total = d3.sum(mergedData, d => d.count);
      const groupTotals = d3.rollup(mergedData, v => d3.sum(v, x => x.count), d => d.group);
      for (const f of mergedData) {
        f.normTotal = f.count / total;
        f.normGroup = f.count / groupTotals.get(f.group);
      }
  
      return mergedData;
    } catch (err) {
      console.error(err);
      return [];
    }
  }

export { loadODData, deserializeBinary, loadComunas, createComunaHexIndex }