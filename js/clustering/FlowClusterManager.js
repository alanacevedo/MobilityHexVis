class FlowClusterManager {
    constructor(flows) {
        // inicialmente cada flujo es un cluster
        // un cluster es válido si parent es su mismo id.

        this.flowClusters = []
        flows.forEach((flowObj) => {

            const { id, counts, lat_O, lon_O, lat_D, lon_D } = flowObj

            const clusterObj = {
                parentId: id,
                agg_counts: counts,
                flowCount: 1,
                agg_lat_O: lat_O,
                agg_lon_O: lon_O,
                agg_lat_D: lat_D,
                agg_lon_D: lon_D
            }

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

        parentCluster.flowCount += childCluster.flowCount
        parentCluster.agg_lat_O += childCluster.agg_lat_O
        parentCluster.agg_lon_O += childCluster.agg_lon_O
        parentCluster.agg_lat_D += childCluster.agg_lat_D
        parentCluster.agg_lon_D += childCluster.agg_lon_D

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
        const { flowCount, agg_lat_O, agg_lon_O, agg_lat_D, agg_lon_D, agg_counts } = this.flowClusters[clusterId]

        return {
            counts: agg_counts,
            lat_O: agg_lat_O / flowCount,
            lon_O: agg_lon_O / flowCount,
            lat_D: agg_lat_D / flowCount,
            lon_D: agg_lon_D / flowCount
        }
    }

    getFlowClusters() {
        return this.flowClusters
            .filter((clusterObj, index) => clusterObj.parentId == index)
            .map(clusterObj => this.getClusterCentroidFlow(clusterObj.parentId))
    }


}

export { FlowClusterManager }