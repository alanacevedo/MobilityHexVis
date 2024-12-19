import Chart from 'chart.js/auto';
import { AppState } from '@js/appState';

function drawDistributionChart(ctxNode, chartData, rangeString) {
    const appState = new AppState()
    const baseGroupPercentages = appState.getState("baseGroupPercentages")

    if (ctxNode.chart) {
        ctxNode.chart.destroy();
    }

    const referenceValues = Object.values(baseGroupPercentages['group'])
    const globalValues = Object.values(chartData['global']);
    const rowPercentage = globalValues.reduce((acc, val) => acc + val, 0);

    const data = {
        labels: ['Q1', 'Q2', 'Q3', 'Q4'],
        datasets: [{
            data: Object.values(chartData['group']),
            backgroundColor: 'rgba(75, 192, 192, 0.7)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
        }]
    };


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
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 1,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: `      ${rangeString}    ${rowPercentage.toFixed(0)}%  datos`,
                    align: 'center'
                },
                tooltip: {
                    callbacks: {
                        label: (context) => '',
                        footer: (context) => {
                            const index = context[0].dataIndex;
                            const groupPercentage = chartData['group'][index + 1];
                            const globalPercentage = chartData['global'][index + 1];
                            return [
                                `${groupPercentage.toFixed(1)}%  c/r tramo `,
                                `${globalPercentage.toFixed(1)}%  c/r total: `
                            ];
                        }
                    }
                }

            },
        },
        plugins: [referenceLinesPlugin]
    };

    ctxNode.chart = new Chart(ctxNode, config);

}

export { drawDistributionChart }