
import { TupleMap } from "./TupleMap.js";
import { point, featureCollection, clustersDbscan } from "@turf/turf";

const MAX_DISTANCE_KM = 0.4
const MIN_POINTS = 1

function getClusterFlows(data) {
    const uniqueOrigins = new TupleMap()
    const uniqueDestinations = new TupleMap()

    for (const entry of data) {
        uniqueOrigins.add([entry.lat_O, entry.lon_O])
        uniqueDestinations.add([entry.lat_D, entry.lon_D])
    }

    const [originCoordsToCluster, originCentroidMap] = getClustersFromUniqueCoords(uniqueOrigins)
    const [destinationCoordsToCluster, destinationCentroidMap] = getClustersFromUniqueCoords(uniqueDestinations)

    const clusterIdFlows = new TupleMap()
    let total = 0

    data.forEach(entry => {
        const originCluster = getCoordsCluster(entry.lat_O, entry.lon_O, originCoordsToCluster)
        const destinationCluster = getCoordsCluster(entry.lat_D, entry.lon_D, destinationCoordsToCluster)
        if (!originCluster || !destinationCluster) return

        if (!clusterIdFlows.has([originCluster, destinationCluster])) {
            clusterIdFlows.add([originCluster, destinationCluster, { flow_total: 0, counts: {} }])
        }

        const flowObj = clusterIdFlows.data.get(originCluster).get(destinationCluster)

        if (!(entry.group in flowObj.counts)) {
            flowObj.counts[entry.group] = 0
        }
        flowObj.counts[entry.group] += entry.count
        flowObj.flow_total += entry.count
        total += entry.count
    })


    const clusterFlows = []
    clusterIdFlows.data.forEach((destinationClusterMap, originCluster) => {
        destinationClusterMap.forEach((flowObj, destinationCluster) => {

            const originCentroidCoords = originCentroidMap.get(originCluster)
            const destinationCentroidCoords = destinationCentroidMap.get(destinationCluster)

            clusterFlows.push({
                lat_O: originCentroidCoords.coords[0],
                lon_O: originCentroidCoords.coords[1],
                lat_D: destinationCentroidCoords.coords[0],
                lon_D: destinationCentroidCoords.coords[1],
                counts: flowObj.counts,
                normalized_total: total ? (flowObj.flow_total) / total : 0

            })
        })
    })

    return clusterFlows
}

function getCoordsCluster(lat, lon, coordsToCluster) {
    if (!coordsToCluster.has([lat, lon])) return null
    return coordsToCluster.data.get(lat).get(lon)
}

function getClustersFromUniqueCoords(uniqueCoords) {
    const points = []

    for (const [lat, lonMap] of uniqueCoords.data) {
        for (const lon of lonMap.keys()) {
            points.push(point([lat, lon]))
        }
    }

    const clusteredFeatures = clustersDbscan(featureCollection(points), MAX_DISTANCE_KM, { minPoints: MIN_POINTS })
    const coordsToCluster = new TupleMap() // maps coordinates to its corresponding cluster
    const clusterCentroidMap = new Map()

    clusteredFeatures.features.forEach(feature => {
        if (feature.properties.dbscan !== "core") return
        const [lat, lon] = feature.geometry.coordinates
        const cluster = feature.properties.cluster

        coordsToCluster.add([lat, lon, cluster])

        // for calculating coordinates of centroid, mean of all cordinates
        if (!clusterCentroidMap.has(cluster)) {
            clusterCentroidMap.set(cluster, {
                lat: 0,
                lon: 0,
                n: 0
            })
        }

        const obj = clusterCentroidMap.get(cluster)
        obj.lat += lat
        obj.lon += lon
        obj.n += 1
    })

    clusterCentroidMap.forEach((obj) => {
        obj.coords = [obj.lat / obj.n, obj.lon / obj.n]
    })

    return [coordsToCluster, clusterCentroidMap]
}

export { getClusterFlows }