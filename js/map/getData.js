
import { AppState } from "../appState.js";
import { getGiniIndex } from "../utils/segregationIndexes.js";

function getDataByGroup(data) {
    const dataByGroup = {}

    for (const entry of data) {
        const group = entry.group
        if (!(group in dataByGroup)) {
            dataByGroup[group] = []
        }
        dataByGroup[group].push(entry)
    }

    return dataByGroup
}

function getDataByH3(data) {
    const appState = new AppState()
    const selectedH3s = appState.getState("selectedH3s")
    const hexIndex = appState.getState("hexIndex")
    const dataByHex = {}
    const hexSet = new Set()

    const showOriginHex = appState.getState("showOriginHex")
    const showDestinationHex = appState.getState("showDestinationHex")

    const processHex = (hexId, type, entry) => {
        if (!(hexId in dataByHex)) dataByHex[hexId] = {}
        if (!(type in dataByHex[hexId])) {
            dataByHex[hexId][type] = {
                count: 0,
                normGroup: 0,
                normTotal: 0,
            }
        }
        const hexObj = dataByHex[hexId][type]
        hexObj.count += entry.count
        hexObj.normGroup += entry.normGroup
        hexObj.normTotal += entry.normTotal
    }

    const processEntries = (entries) => {
        for (const entry of entries) {
            hexSet.add(entry.h3_O)
            hexSet.add(entry.h3_D)

            if (entry.distance === 0) continue

            if (showOriginHex && (
                selectedH3s.size === 0 ||
                (!selectedH3s.has(entry.h3_O) && selectedH3s.has(entry.h3_D))
            )) {
                processHex(entry.h3_O, 'origin', entry)
            }

            if (showDestinationHex && (
                selectedH3s.size === 0 ||
                (selectedH3s.has(entry.h3_O) && !selectedH3s.has(entry.h3_D))
            )) {
                processHex(entry.h3_D, 'destination', entry)
            }
        }
    }

    if (selectedH3s.size === 0) {
        processEntries(data)
    } else {
        const relevantEntries = new Set()
        for (const selectedH3 of selectedH3s) {
            const relatedEntries = hexIndex.get(selectedH3) || []
            relatedEntries.forEach(entry => {
                if (data.includes(entry)) {  // Only include entries that are in the current data slice
                    relevantEntries.add(entry)
                }
            })
        }
        processEntries([...relevantEntries])
    }

    // Ensure all hexagons in the current view are included in hexSet
    // this is to render the outlines of those hexagons that do not have any flow
    data.forEach(entry => {
        hexSet.add(entry.h3_O)
        hexSet.add(entry.h3_D)
    })

    return { dataByHex, hexSet }
}

function getGiniIndexByH3(data) {
    const giniByHex = {};
    const hexSet = new Set();

    for (const entry of data) {
        const { h3_O, h3_D, group, count, distance } = entry;

        // Ignore flows where distance is 0 (same origin and destination)
        if (distance === 0) continue;

        [h3_O, h3_D].forEach(h3 => {
            if (!giniByHex[h3]) giniByHex[h3] = { counts: {} };
            if (!giniByHex[h3].counts[group]) giniByHex[h3].counts[group] = 0;
            giniByHex[h3].counts[group] += count;
            hexSet.add(h3);
        });
    }

    Object.values(giniByHex).forEach(hex => {
        hex.gini = getGiniIndex(hex.counts)
    });

    return giniByHex;
}

export { getDataByGroup, getDataByH3, getGiniIndexByH3 }