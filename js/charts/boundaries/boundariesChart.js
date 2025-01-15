import Chart from 'chart.js/auto';
import * as d3 from "d3";
import { AppState } from '@js/appState';
import { generateMaps } from "@js/map/mapControl"

const TOOLTIPID = 'chartjs-tooltip'

const clickableLines = {
    id: "clickableLines",
    afterEvent(chart, args, pluginOptions) {

        if (args.event.type !== "click") {
            return
        }

        const clickX = args.event.x
        const delta = 4

        let removed = false

        const state = new AppState()
        const boundaries = state.getState("boundaries")

        boundaries.forEach((boundary, i) => {
            const xPixel = chart.scales.x.getPixelForValue(boundary)
            if (clickX - delta <= xPixel && xPixel <= clickX + delta && !removed) {
                boundaries.splice(i, 1)
                generateMaps()
                removed = true
            }
        })

        if (!removed) {
            boundaries.push(chart.scales.x.getValueForPixel(clickX))
            generateMaps()
        }

        chart.update()
        return

    },
    afterDatasetsDraw(chart, args, pluginOptions) {
        const { ctx, chartArea: { top, bottom } } = chart
        class Line {
            constructor(xCoord) {
                this.width = xCoord
            }

            draw(ctx) {
                ctx.restore()
                ctx.beginPath()
                ctx.lineWidth = 1
                ctx.strokeStyle = "rgba(255,255,255,0.8)"
                ctx.moveTo(this.width, top)
                ctx.lineTo(this.width, bottom)
                ctx.stroke()
                ctx.save()
            }
        }

        const state = new AppState()
        const boundaries = state.getState("boundaries")
        boundaries.forEach(boundary => {
            let drawLine = new Line(chart.scales.x.getPixelForValue(boundary))
            drawLine.draw(ctx)
        })

    }

}

function drawBoundariesChart(ctxNode, chartData) {
    const gridLineColor = "rgba(255,255,255,0.2)";

    const chart = new Chart(ctxNode, {
        type: 'line',
        data: {
            datasets: [{
                data: chartData,
            }]
        },
        options: {
            elements: {
                point: {
                    radius: 1
                }
            },
            animation: false,
            scales: {
                y: {
                    title: {
                        display: true,
                        text: "Porcentaje de ocurrencias (%)",
                        color: 'white'
                    },
                    beginAtZero: true,
                    max: 100, // El máximo ahora es 100% para reflejar el porcentaje total
                    grid: {
                        color: gridLineColor,
                    },
                    ticks: {
                        callback: (label) => label.toFixed(0) + '%', // Mostrar en porcentaje,
                        color: 'white'
                    }
                },
                x: {
                    title: {
                      display: true,
                      text: "Distancia (km)",
                      color: 'white'
                    },
                    grid: {
                      color: gridLineColor
                    },
                    type: "linear",
                    max: chartData.length === 0 ? 0 : chartData[chartData.length - 1].x,
                    ticks: {
                      color: 'white'
                    }
                  }
            },
            parsing: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            onHover: handleOnHover
        },
        plugins: [clickableLines]
    });

    d3.select("#" + ctxNode.id).node().addEventListener('mouseleave', () => {
        d3.select("#" + TOOLTIPID).node().style.display = 'none';
    });
}

function getChartData(data) {
    const chartData = [];
    let currentSegment = 0;
    let cumulativeCount = 0;
    let lastAddedCount = 0;

    // Calcular el total de ocurrencias
    const totalCount = data.reduce((sum, entry) => sum + entry.count, 0);

    // Definir los umbrales y tamaños de segmentos correspondientes
    const thresholds = [
        { maxDistance: 10, segmentSize: 0.2 }, // Segmentos más pequeños para los primeros 10 km
        { maxDistance: 30, segmentSize: 0.5 }, // Segmentos medianos para 10-30 km
        { maxDistance: Infinity, segmentSize: 1 } // Segmentos más grandes para distancias mayores a 30 km
    ];

    let currentThresholdIndex = 0;
    let segmentSize = thresholds[currentThresholdIndex].segmentSize;

    data.forEach(entry => {
        if (!entry.distance) return;

        // Actualizar el conteo acumulado con el conteo de la entrada actual
        cumulativeCount += entry.count;

        while (entry.distance >= currentSegment + segmentSize) {
            // Cambiar el tamaño del segmento según los umbrales
            if (currentSegment + segmentSize > thresholds[currentThresholdIndex].maxDistance) {
                currentThresholdIndex++;
                segmentSize = thresholds[currentThresholdIndex].segmentSize;
            }

            // Calcular el porcentaje acumulado
            const cumulativePercentage = (cumulativeCount / totalCount) * 100;

            // Agregar a chartData solo si el porcentaje acumulado ha cambiado y no está en el punto de origen
            if (cumulativePercentage !== lastAddedCount && cumulativePercentage > 0 && currentSegment > 0) {
                chartData.push({ x: currentSegment, y: cumulativePercentage });
                lastAddedCount = cumulativePercentage;
            }
            currentSegment += segmentSize;
        }
    });

    // Añadir el último porcentaje acumulado después de procesar todas las entradas
    const finalPercentage = (cumulativeCount / totalCount) * 100;
    if (finalPercentage !== lastAddedCount && finalPercentage > 0 && currentSegment > 0) {
        chartData.push({ x: currentSegment, y: finalPercentage });
    }

    return chartData;
}

function handleOnHover(event, activeElements, chartElement) {
    const tooltipNode = d3.select("#" + TOOLTIPID).node()

    const xScale = chartElement.scales.x;
    const xValue = xScale.getValueForPixel(event.x);

    if (xValue < 0) {
        return
    }

    // Position the tooltip
    tooltipNode.innerHTML = `${xValue.toFixed(2)} km.`;
    tooltipNode.style.left = event.native.clientX + 'px';
    tooltipNode.style.top = event.native.clientY - 20 + 'px';
    tooltipNode.style.display = 'block'; // Ensure the tooltip is visible
}

export { drawBoundariesChart, getChartData }