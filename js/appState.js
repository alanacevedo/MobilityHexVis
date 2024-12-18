import * as d3 from "d3";
import { loadODData, loadComunas, createComunaHexIndex, createHexIndex } from "./loadData";
import { getGroupPercentages, getTotalEntries } from "./utils/charts/distribution/utils";

// Singleton
let instance;

class AppState {
    constructor() {
        if (instance) {
            return instance;
        }

        this.state = {};
        instance = this;
    }

    getState(key) {
        return this.state[key];
    }

    setState(key, value) {
        this.state[key] = value;
    }

    setMultipleStates(updates) {
        Object.assign(this.state, updates);
    }
}

async function initializeState() {
    const state = new AppState();

    const comunas = await loadComunas();

    state.setMultipleStates({
        comunas,
        startHour: 5,
        endHour: 12,
        resolution: 7,
        boundaries: [],
        mapMatrix: [],
        showOriginHex: true,
        showDestinationHex: true,
        showComunaBoundaries: false,
        selectedH3s: new Set(),
        selectionMode: "hex",
        originColor: "#00FFFF",
        destinationColor: "#FF00FF",
        highlightColor: "#FFFF00",
        comunaBoundaryColor: "#FFFF00",
        mixturaColorScale: d3.interpolateWarm,
    });

    await updateData();
}

async function updateData() {
    const state = new AppState();
    const data = await loadODData(state.getState("startHour"), state.getState("endHour"), state.getState("resolution"));
    const hexIndex = createHexIndex(data);
    const comunas = state.getState("comunas");
    const [comunaHexIndex, hexComunaIndex] = createComunaHexIndex(comunas, data);
    const totalEntries = getTotalEntries(data);
    const baseGroupPercentages = getGroupPercentages(data, totalEntries);

    state.setMultipleStates({
        data,
        hexIndex,
        comunaHexIndex,
        hexComunaIndex,
        baseGroupPercentages,
        totalEntries,
    });
}

export { AppState, initializeState, updateData };
