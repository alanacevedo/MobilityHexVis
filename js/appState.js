import { loadRawODData } from "./loadData"

let instance

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
    const data = await loadRawODData()
    state.setState("data", data)
    state.setState("boundariesString", "")
    state.setState("mapMatrix", [])
    state.setState("dbscanMinPoints", 1)
    state.setState("dbscanMaxDistance", 0.4)

}

export { AppState, initializeState }