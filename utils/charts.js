const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const Calc = require("./calc")

const calc = new Calc()

//global chart config for lines eff
const chartJSNodeCanvas = new ChartJSNodeCanvas({ type: 'png', width: 400, height: 400, chartCallback: (ChartJS) => {
    ChartJS.register(require('chartjs-plugin-datalabels'))
}});

const getGraphColor = (eff) => {
    let presentage, graphColor
    if (eff && eff !== "NaN" && eff !== "NaN%") presentage = eff.replace("%", "")
    else presentage = "0"
    
    if (parseInt(presentage) > 99) graphColor = "green"
    else if (parseInt(presentage) > 74) graphColor = "blue"
    else if (parseInt(presentage) > 45) graphColor = "orange"
    else graphColor = "red"

    return graphColor
}

const getIssuesGraph = async(issues) => {
    return new Promise(async(resolve, reject) => {
        //global chart config barChart
        const barChart = new ChartJSNodeCanvas({ type: 'png', width: 575, height: 500, chartCallback: (ChartJS) => {
            ChartJS.register(require('chartjs-plugin-datalabels'))
        }});

        const options = {
            scale: {
                ticks: { min: 0 }
            },
            responsive: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                title: {
                    display: true,
                    color: "black",
                    text: `Delay Causes`,
                    align: "center",
                    padding: {
                        top: 10,
                        bottom: 5,
                    },
                    font: {
                        size: 25,
                    }
                },
                datalabels: {
                    anchor: 'start',
                    align: 'center',
                    color: 'black',
                    font: {
                        weight: 'bold',
                        size: 14,
                    },
                    labels: {
                        value0: {},
                        value1: {},
                        value2: {},
                        value3: {},
                        value4: {},
                    }
                },
                legend: {
                    display: true,
                }
            },
        } 

        /*
        {
                    label: [ 'Material', 'Man-power', 'Equipment', 'Method', 'Other'],
                    data: [3, 1, 9, 0, 5],
                    backgroundColor: [
                        'rgba(255, 205, 86, 0.2)',
                        'rgba(75, 192, 192, 0.2)',
                        'rgba(54, 162, 235, 0.2)',
                        'rgba(153, 102, 255, 0.2)',
                        'rgba(201, 203, 207, 0.2)'
                    ],
                    borderColor: [
                        'rgb(255, 205, 86)',
                        'rgb(75, 192, 192)',
                        'rgb(54, 162, 235)',
                        'rgb(153, 102, 255)',
                        'rgb(201, 203, 207)'
                    ],
                    borderWidth: 1,
                    hoverOffset: 4,
                    count: 5,
                }]
        */
        const config = {
            type: 'bar',
            data: {
                labels: [ 'Delays'],
                datasets: [
                    {
                        label: "Material Delay",
                        data: [issues.material],
                        backgroundColor: 'rgba(255, 205, 86, 0.2)',
                        borderColor: 'rgb(255, 205, 86)',
                        borderWidth: 1
                    },
                    {
                        label: "Man-Power-Related Delay",
                        data: [issues.manpower],
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderColor: 'rgb(75, 192, 192)',
                        borderWidth: 1
                    },
                    {
                        label: "Equipment Breakdown",
                        data: [issues.equipment],
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        borderColor: 'rgb(54, 162, 235)',
                        borderWidth: 1
                    },
                    {
                        label: "Method (Procedures prior and during assembly)",
                        data: [issues.method],
                        backgroundColor: 'rgba(153, 102, 255, 0.2)',
                        borderColor: 'rgb(153, 102, 255)',
                        borderWidth: 1
                    },
                    {
                        label: "Other",
                        data: [issues.other],
                        backgroundColor: 'rgba(201, 203, 207, 0.2)',
                        borderColor: 'rgb(201, 203, 207)',
                        borderWidth: 1
                    },
                ]
            },
            options: options
        };

        // Generate chart image
        barChart.renderToBuffer(config).then((buf) => {
            resolve(buf)
        })
    })
}

const getGraph = async(target, actual, eff, title) => {
    return new Promise((resolve, reject) => {
        try{
        let completedPresentage = isNaN((actual/target)*100 )? 0 : calc.round((actual/target)*100)
        let gapPresentage = isNaN(100-((actual/target) * 100))? 100 : (100-((actual/target) * 100) < 0? 0 : calc.round(100-((actual/target) * 100)))

        // console.log(completedPresentage, gapPresentage)
        
        const doughntColor = getGraphColor(eff)

        const options = {
            elements: {
                arc: {
                    borderWidth: 0
                }
            },
            scale: {
                ticks: { min: 0 }
            },
            responsive: false,
            plugins: {
                title: {
                    display: true,
                    color: "black",
                    text: `${title}`,
                    align: "center",
                    padding: {
                        top: 10,
                        bottom: 5,
                    },
                    font: {
                        size: 25,
                    }
                },
                datalabels: {
                    anchor: 'center',
                    align: 'center',
                    color: 'black',
                    font: {
                        weight: 'bold',
                        size: 25,
                    },
                    formatter: function(value) {
                        return value === completedPresentage? actual : target
                    },
                    labels: {
                        
                        value0: {},
                        value1: {}
                    }
                }
            },
            cutout: '60%',
        } 

        const configuration = {
            type: 'doughnut',
            data: {
                labels: [
                    'Actual Production',
                    'Line Target',
                ],
                datasets: [{
                    data: [completedPresentage, gapPresentage],
                    backgroundColor: [
                        doughntColor,
                        'rgba(101, 100, 100, 0.143)',
                    ],
                    // hoverOffset: 4
                    hoverOffset: 4,
                    count: 2,
                }]
            },
            options: options
        };

        // Generate chart image
        chartJSNodeCanvas.renderToBuffer(configuration).then((buf) => {
            resolve(buf)
        })

        }catch(err){
            console.error(err)
            reject("Something went wrong")
        }
    })
}

module.exports = {
    getGraphColor,
    getGraph,
    getIssuesGraph
}