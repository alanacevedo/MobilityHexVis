import KDBush from 'kdbush'
import * as geokdbush from 'geokdbush-tk'

class KdIndex {
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

    getClosestPoint(lat, lon) {
        const id = geokdbush.around(this.index, lon, lat, 1)[0]
        return this.points[id]
    }
}

export { KdIndex }