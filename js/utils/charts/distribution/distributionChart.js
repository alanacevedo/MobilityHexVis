import Chart from 'chart.js/auto';
import { AppState } from '../../../appState';

function drawDistributionChart(ctxNode, chartData, baseGroupPercentages, rangeString) {
    const appState = new AppState()
    const totalEntries = appState.getState("totalEntries")
    console.log(totalEntries)

    if (ctxNode.chart) {
        ctxNode.chart.destroy();
    }

    const data = {
        labels: ['Q1', 'Q2', 'Q3', 'Q4'],
        datasets: [{
            data: Object.values(chartData['group']),
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
        }]
    };

    const referenceValues = Object.values(baseGroupPercentages['group'])

    const referenceLinesPlugin = {
        id: 'referenceLines',
        afterDatasetsDraw: (chart) => {
            const ctx = chart.ctx;
            chart.data.datasets.forEach((dataset, datasetIndex) => {
                const meta = chart.getDatasetMeta(datasetIndex);
                meta.data.forEach((bar, index) => {
                    const referenceValue = referenceValues[index];
                    const y = chart.scales['y'].getPixelForValue(referenceValue);

                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(bar.x - bar.width / 2, y);
                    ctx.lineTo(bar.x + bar.width / 2, y);
                    ctx.strokeStyle = 'rgba(255, 0, 0, 0.4)';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    ctx.restore();
                });
            });
        }
    };

    const config = {
        type: 'bar',
        data: data,
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            },
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: "Tramo " + rangeString
                },
                tooltip: {
                    callbacks: {
                        label: (context) => '',
                        footer: (context) => {
                            console.log(context)
                            return ["% c/r tramo: X", "% c/r total: Y"]
                        }
                    }
                }

            },
            maintainAspectRatio: true,
            aspectRatio: 1
        },
        plugins: [referenceLinesPlugin]
    };

    ctxNode.chart = new Chart(ctxNode, config);

}

export { drawDistributionChart }