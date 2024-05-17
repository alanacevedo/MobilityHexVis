class FlowMap {
    constructor() {
        this.idToFlowObj = []
        this.data = new Map();
        this.flowObjToId = new Map()
    }

    add(flowObj) {
        const { lat_O, lon_O, lat_D, lon_D, group, count } = flowObj
        const coords = [lat_O, lon_O, lat_D, lon_D]

        let curr = this.data

        for (let i = 0; i < coords.length - 1; i++) {
            if (!curr.has(coords[i])) {
                curr.set(coords[i], new Map())
            }

            curr = curr.get(coords[i])
        }

        if (!curr.has(lon_D)) {
            const aggFlowObj = {
                lat_O,
                lon_O,
                lat_D,
                lon_D,
                id: this.idToFlowObj.length,
                counts: {},
                totalCount: 0
            }

            this.idToFlowObj.push(aggFlowObj)
            curr.set(lon_D, aggFlowObj)
        }

        const obj = curr.get(lon_D)

        obj["counts"][group] = count
        obj["totalCount"] += count

        const id = obj["id"]
        this.flowObjToId.set(curr.get(lon_D), id)

        return id
    }

    getFlowObjFromId(id) {
        return this.idToFlowObj[id]
    }

    getFlowIdFromFlowObj(flowObj) {
        return this.flowObjToId.get(flowObj)
    }

    getFlowObjs() {
        return this.idToFlowObj
    }

}

export { FlowMap }