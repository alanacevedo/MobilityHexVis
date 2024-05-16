import { DupletMap } from "./DupletMap.js";
import { FlowMap } from './FlowMap.js';
import { KdIndex } from "./KdIndex.js";
import { FlowClusterManager } from "./FlowClusterManager.js";

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
    const originKdIndex = new KdIndex(originToFlowIds)
    const destinationKdIndex = new KdIndex(destinationToFlowIds)

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
        const [pFlow, qFlow] = pair.map(id => flowMap.getFlowObjFromId(id))
        const snnDistance = getFlowSnnDistance(pFlow, qFlow, originKdIndex, destinationKdIndex, k)
        pair.push(snnDistance)
    })

    contiguousFlows.sort((tupleA, tupleB) => {
        return tupleA[2] - tupleB[2]
    })

    const clusterManager = new FlowClusterManager(flowMap.getFlowObjs())


    contiguousFlows.forEach(([pFlowId, qFlowId, snnDistance]) => {
        const pClusterId = clusterManager.getFlowClusterId(pFlowId)
        const qClusterId = clusterManager.getFlowClusterId(qFlowId)

        // ya están mergeados
        if (pClusterId == qClusterId) {
            return
        }

        const pCentroidFlow = clusterManager.getClusterCentroidFlow(pClusterId)
        const qCentroidFlow = clusterManager.getClusterCentroidFlow(qClusterId)

        const pMedianFlow = getMedianFlow(pCentroidFlow, originKdIndex, destinationKdIndex)
        const qMedianFlow = getMedianFlow(qCentroidFlow, originKdIndex, destinationKdIndex)

        if (!checkFlowSnnIntersection(pMedianFlow, qMedianFlow, originKdIndex, destinationKdIndex, k)) {
            return
        }

        clusterManager.mergeClusters(pClusterId, qClusterId)
    })

    return clusterManager.getFlowClusters()

}

// pushea al arreglo dupletMap[keyPos]. Si no existe el arreglo, lo crea.
function pushToDupletMap(dupletMap, keyPos, valuePos) {
    if (!dupletMap.has(keyPos)) {
        dupletMap.add(keyPos.concat([[]]))
    }
    dupletMap.get(keyPos).push(valuePos)
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

function getFlowSnnDistance(pFlow, qFlow, originKdIndex, destinationKdIndex, k) {

    const originIntersectionCount = getKnnIntersectionCount(pFlow.lat_O, pFlow.lon_O, qFlow.lat_O, qFlow.lon_O, originKdIndex, k)
    const destinationIntersectionCount = getKnnIntersectionCount(pFlow.lat_D, pFlow.lon_D, qFlow.lat_D, qFlow.lon_D, destinationKdIndex, k)

    return 1 - ((originIntersectionCount * destinationIntersectionCount) / (k * k))

}

// retorna verdadero si existe intersección entre los KNN de origenes y los KNN de destinos
// El propósito de esta función es evaluar si el SNN es menor que uno sin tener que realizar
// operaciones matemáticas, para reducir cantidad de ciclos del reloj
function checkFlowSnnIntersection(pFlow, qFlow, originKdIndex, destinationKdIndex, k) {

    const hasOriginIntersection = checkKnnIntersection(pFlow.lat_O, pFlow.lon_O, qFlow.lat_O, qFlow.lon_O, originKdIndex, k)
    const hasDestinationIntersection = checkKnnIntersection(pFlow.lat_D, pFlow.lon_D, qFlow.lat_D, qFlow.lon_D, destinationKdIndex, k)

    return hasOriginIntersection && hasDestinationIntersection
}

function getKnnIntersectionCount(pLat, pLon, qLat, qLon, kdIndex, k) {
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

function checkKnnIntersection(pLat, pLon, qLat, qLon, kdIndex, k) {
    const pKNN = kdIndex.getKNN(pLat, pLon, k)
    const qKNN = kdIndex.getKNN(qLat, qLon, k)

    const pKNNSet = new DupletMap()

    for (const pPoint of pKNN) {
        pKNNSet.add(pPoint)
    }

    for (const qPoint of qKNN) {
        if (pKNNSet.has(qPoint)) {
            return true
        }
    }

    return false
}


// calcula el punto más cercano para el origen y el destino.
function getMedianFlow(centroidFlowObj, originKdIndex, destinationKdIndex) {
    const [lat_O, lon_O] = originKdIndex.getClosestPoint(centroidFlowObj.lat_O, centroidFlowObj.lon_O)
    const [lat_D, lon_D] = destinationKdIndex.getClosestPoint(centroidFlowObj.lat_D, centroidFlowObj.lonD)

    return { lat_O, lon_O, lat_D, lon_D }
}


export { getContiguousFlowClusters }