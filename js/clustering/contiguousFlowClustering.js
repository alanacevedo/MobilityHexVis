import KDBush from 'kdbush'
import * as geokdbush from 'geokdbush-tk'
import { DupletMap } from "./DupletMap.js";
import { FlowMap } from './FlowMap.js';


function getContiguousFlowClusters(flows, k) {

    // Puede que los flujos tengan mismas coordenadas de origen y destino, pero distinto grupo.
    // En este objecto flowMap se fusionan los que tengan mismas coordenadas y se les asigna un identificador.
    const flowMap = new FlowMap()

    // Mapean posición al id de flujo que pertenecen
    // Estos mapas permiten saber rápidamente, dado un origen, en qué flujos se encuentra. Idem para destinos.
    const originToFlowIds = new DupletMap()
    const destinationToFlowIds = new DupletMap()


    for (const flow of flows) {
        const flowId = flowMap.add(flow)

        const origin = [flow.lat_O, flow.lon_O]
        const destination = [flow.lat_D, flow.lon_D]

        pushToDupletMap(originToFlowIds, origin, flowId)
        pushToDupletMap(destinationToFlowIds, destination, flowId)
    }

    // Índices K-D Tree para hacer consultas KNN.
    const originKdIndex = new kdIndex(originToFlowIds)
    const destinationKdIndex = new kdIndex(destinationToFlowIds)

    // Para cada flujo y su vecindad de flujos, se calculan los flujos contiguos.
    // Para un flujo (O, D), la vecindad de flujos corresponden a todos aquellos flujos donde su origen se encuentra en KNN(O) y su destino en KNN(D).

    const contiguousFlows = []
    for (const flow of flowMap.getFlowObjs()) { // ids fusionados
        const { lat_O, lon_O, lat_D, lon_D } = flow

        const destinationFlowIdSet = getFlowIdSetFromKdIndex(destinationKdIndex, destinationToFlowIds, lat_D, lon_D, k)
        const originFlowIdSet = getFlowIdSetFromKdIndex(originKdIndex, originToFlowIds, lat_O, lon_O, k)
        const flowId = flow.id

        originFlowIdSet.forEach(commonFlowId => {
            if (destinationFlowIdSet.has(commonFlowId)) {
                contiguousFlows.push([flowId, commonFlowId])
            }
        })
    }

    // Calcular, para cada pareja de flujos contiguos, la distancia SNN, y luego ordenar ascendientemente.

    contiguousFlows.forEach((pair) => {
        const [pFlow, qFlow] = pair
        const snnDistance = getSNNDistance(pFlow, qFlow, flowMap, originKdIndex, destinationKdIndex, k)
        pair.push(snnDistance)
    })

    contiguousFlows.sort((tupleA, tupleB) => {
        return tupleA[2] - tupleB[2]
    })

    console.log(contiguousFlows)


}

// pushea al arreglo dupletMap[keyPos]. Si no existe el arreglo, lo crea.
function pushToDupletMap(dupletMap, keyPos, valuePos) {
    if (!dupletMap.has(keyPos)) {
        dupletMap.add(keyPos.concat([[]]))
    }
    dupletMap.get(keyPos).push(valuePos)
}

class kdIndex {
    // recibe un objeto DupletMap donde las 2 llaves representan latlon únicos.
    // construye un índice basado en K-D Tree que permite hacer consultas KNN rápidamente.

    constructor(positionDupletMap) {

        // se genera un array con todos los latlons únicos de origen / destino
        this.points = []
        for (const [lat, lonMap] of positionDupletMap.data) {
            for (const lon of lonMap.keys()) {
                this.points.push([lat, lon])
            }
        }

        // Agregar todos los latlon al índice
        this.index = new KDBush(this.points.length)
        for (const [lat, lon] of this.points) {
            this.index.add(lon, lat)
        }

        // perform indexing
        this.index.finish()
    }

    // retorna un arreglo [[lat, lon]] para los k vecinos más cercanos.
    getKNN(lat, lon, k) {
        const ids = geokdbush.around(this.index, lon, lat, k + 1) // + 1 porque incluye al latlon mismo, que después hay que quitar
        return ids.map(id => this.points[id]).filter(latlon => latlon[0] != lat && latlon[1] != lon)
    }
}

function getFlowIdSetFromKdIndex(kdIndex, posToFlowIds, lat, lon, k) {
    // obtiene los latlon de los k origenes/destinos más cercanos
    const knnLatLonArray = kdIndex.getKNN(lat, lon, k)

    // genera un arreglo de todos los ids de flujo asociados a los k vecinos.
    const flowIds = knnLatLonArray.reduce((accArray, latlon) => {
        return accArray.concat(posToFlowIds.get(latlon))
    }, [])

    // eliminar duplicados
    const flowIdSet = new Set(flowIds)
    return flowIdSet
}

function getSNNDistance(pFlowId, qFlowId, flowMap, originKdIndex, destinationKdIndex, k) {
    const pFlow = flowMap.getFlowObjFromId(pFlowId)
    const qFlow = flowMap.getFlowObjFromId(qFlowId)

    const originIntersectionCount = getIntersectionCount(pFlow.lat_O, pFlow.lon_O, qFlow.lat_O, qFlow.lon_O, originKdIndex, k)
    const destinationIntersectionCount = getIntersectionCount(pFlow.lat_D, pFlow.lon_D, qFlow.lat_D, qFlow.lon_D, destinationKdIndex, k)

    return 1 - ((originIntersectionCount * destinationIntersectionCount) / (k * k))

}

function getIntersectionCount(pLat, pLon, qLat, qLon, kdIndex, k) {
    const pKNN = kdIndex.getKNN(pLat, pLon, k)
    const qKNN = kdIndex.getKNN(qLat, qLon, k)

    const pKNNSet = new DupletMap()
    let intersectionCount = 0

    for (const pPoint of pKNN) {
        pKNNSet.add(pPoint)
    }

    for (const qPoint of qKNN) {
        if (pKNNSet.has(qPoint)) {
            intersectionCount++;
        }
    }

    return intersectionCount
}

export { getContiguousFlowClusters }