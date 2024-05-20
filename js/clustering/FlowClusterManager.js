class FlowClusterManager {
    constructor(flows) {
        // inicialmente cada flujo es un cluster
        // un cluster es válido si parent es su mismo id.

        this.flowClusters = []
        this.allClustersCount = 0

        flows.forEach((flowObj) => {

            const { id, counts, lat_O, lon_O, lat_D, lon_D, totalCount, normTotal } = flowObj

            const clusterObj = {
                parentId: id,
                agg_counts: counts,
                flowCount: 1,
                agg_lat_O: lat_O * totalCount, // weighted
                agg_lon_O: lon_O * totalCount,
                agg_lat_D: lat_D * totalCount,
                agg_lon_D: lon_D * totalCount,
                totalCount,
                normTotal
            }
            this.allClustersCount += totalCount
            this.flowClusters.push(clusterObj)

        })

    }

    getFlowClusterId(flowId) {

        // find root (highest parent)
        let rootId = flowId
        while (this.flowClusters[rootId].parentId != rootId) {
            rootId = this.flowClusters[rootId].parentId
        }

        // path shortening
        while (flowId != rootId) {
            const temp = this.flowClusters[flowId].parentId
            this.flowClusters[flowId].parentId = rootId
            flowId = temp
        }

        return rootId
    }

    // merge child cluster into parent cluster
    simpleClusterMerge(parentClusterId, childClusterId) {
        const parentCluster = this.flowClusters[parentClusterId]
        const childCluster = this.flowClusters[childClusterId]

        // add flow group counts
        for (const [group, count] of Object.entries(childCluster.agg_counts)) {

            if (!(group in parentCluster.agg_counts)) {
                parentCluster.agg_counts[group] = 0
            }
            parentCluster.agg_counts[group] += count
        }

        ["flowCount", "totalCount", "agg_lat_O", "agg_lon_O", "agg_lat_D", "agg_lon_D", "normTotal"].forEach(attr => {
            parentCluster[attr] += childCluster[attr]
        })

        childCluster.parentId = parentClusterId

        return
    }

    // 
    mergeClusters(pClusterId, qClusterId) {

        // para mantener estructura balanceada, mergear el más pequeño al más grande
        if (this.flowClusters[pClusterId].flowCount > this.flowClusters[qClusterId]) {
            this.simpleClusterMerge(pClusterId, qClusterId)
        } else {
            this.simpleClusterMerge(qClusterId, pClusterId)
        }

        return
    }

    // retorna un objeto que representa un flujo OD donde O y D son los centroides
    getClusterCentroidFlow(clusterId) {
        const { totalCount, agg_lat_O, agg_lon_O, agg_lat_D, agg_lon_D, agg_counts, parentId, normTotal } = this.flowClusters[clusterId]

        return {
            normTotal,
            totalCount,
            counts: agg_counts,
            lat_O: agg_lat_O / totalCount,
            lon_O: agg_lon_O / totalCount,
            lat_D: agg_lat_D / totalCount,
            lon_D: agg_lon_D / totalCount,
            id: parentId
        }
    }

    getFlowClusters() {

        const flowClusters = this.flowClusters
            .filter((clusterObj, index) => clusterObj.parentId == index)
            .map(clusterObj => this.getClusterCentroidFlow(clusterObj.parentId))


        return flowClusters
    }


}

export { FlowClusterManager }