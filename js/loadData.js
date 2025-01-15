import protobuf from 'protobufjs';
import { cellToLatLng, latLngToCell, UNITS, greatCircleDistance } from "h3-js"
import * as d3 from 'd3';
import { point, booleanPointInPolygon } from '@turf/turf';


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
    let data = await d3.csv('/data/flows.csv'); 
    
    const hasStart = data.columns.includes('start_hour');
    const hasEnd = data.columns.includes('end_hour');

    if (hasStart && hasEnd) {
      data = data.filter(d => {
        const sHour = +d.start_hour;
        const eHour = +d.end_hour;
        return sHour === startHour && eHour === endHour;
      });
    }
    
    for (const flow of data) {
      flow.lat_O = +flow.lat_O;
      flow.lon_O = +flow.lon_O;
      flow.lat_D = +flow.lat_D;
      flow.lon_D = +flow.lon_D;
      flow.group = +flow.group;
      flow.count = +flow.count;

      if (hasStart) flow.start_hour = +flow.start_hour;
      if (hasEnd)   flow.end_hour = +flow.end_hour;

      flow.h3_O = latLngToCell(flow.lat_O, flow.lon_O, resolution);
      flow.h3_D = latLngToCell(flow.lat_D, flow.lon_D, resolution);
    }

    // Merge repeated flows by (h3_O, h3_D, group) and sum counts
    const mergedMap = new Map();
    for (const flow of data) {
      const key = `${flow.h3_O}-${flow.h3_D}-${flow.group}`;
      if (!mergedMap.has(key)) {
        mergedMap.set(key, {
          h3_O: flow.h3_O,
          h3_D: flow.h3_D,
          group: flow.group,
          count: flow.count
        });
      } else {
        mergedMap.get(key).count += flow.count;
      }
    }
    const mergedData = Array.from(mergedMap.values());

    for (const flow of mergedData) {
      flow.distance = getHexDistance(flow.h3_O, flow.h3_D);
    }

    const sumOfAllCounts = d3.sum(mergedData, d => d.count);
    const sumOfGroupCounts = d3.rollup(
      mergedData,
      flowsInGroup => d3.sum(flowsInGroup, f => f.count),
      d => d.group
    );
    for (const flow of mergedData) {
      flow.normTotal = flow.count / sumOfAllCounts;
      flow.normGroup = flow.count / sumOfGroupCounts.get(flow.group);
    }

    return mergedData;
  } catch (error) {
    console.error(error);
    return [];
  }
}

export { loadODData, deserializeBinary, loadComunas, createComunaHexIndex }