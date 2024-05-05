import { loadODData } from "./loadData"
let instance

// Singleton
class AppState {
    constructor() {
        if (instance) {
            return instance
        }

        this.state = {}
        instance = this
    }

    getState(key) {
        return this.state[key]
    }

    setState(key, value) {
        this.state[key] = value
    }
}

async function initializeState() {
    const state = new AppState()

    state.setState("startHour", 5)
    state.setState("endHour", 12)
    const data = await loadODData(state.getState("startHour"), state.getState("endHour"))
    state.setState("data", data)
    state.setState("boundaries", [])
    state.setState("mapMatrix", [])
    state.setState("dbscanMinPoints", 1)
    state.setState("dbscanMaxDistance", 0.4)
}

async function updateData() {
    const state = new AppState()
    const data = await loadODData(state.getState("startHour"), state.getState("endHour"))
    state.setState("data", data)
}

export { AppState, initializeState, updateData }