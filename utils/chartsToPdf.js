const fs = require('fs')
// const tmp = require("tmp");
// const PDFDocument = require('pdfkit');
const MemoryStream = require('memorystream');
const PDFDocument = require("pdfkit-table");
const {db} = require("./firebase")
const {getGraph, getIssuesGraph, getGraphColor} = require("./charts")
const Calc = require("./calc")

const calc = new Calc()

PDFDocument.prototype.addSVG = function(svg, x, y, options) {
    return SVGtoPDF(this, svg, x, y, options), this;
};

const getIssuesTotal = async(lines) => {
    return new Promise((resolve, reject) => {
        
        let material = 0, manpower = 0, equipment = 0, method = 0, other= 0
        lines.forEach((item) => {
            if (!Array.isArray(item.remarks) || item.remarks < 1) return

            item.remarks.forEach((remark) => {
                if (!remark?.cause) return
                switch(remark.cause){
                    case "material":
                        material += 1
                        break;
                    case "manpower":
                        manpower += 1
                        break;
                    case "equipment":
                        equipment += 1
                        break;
                    case "method":
                        method += 1
                        break;
                    default:
                        other += 1
                        break;
                }
            })
        })
        

        resolve({
            "material": material, "manpower": manpower, 
            "equipment": equipment, "method": method, "other": other
        })
    })
}



const getTable = async(data, name, doc, isOverAll=false) => {
    const dates = !isOverAll? 
    {
        options: { fontSize: 12, separation: true},
        target:`bold:${data.target}`,
        actual:`${data.actual}`, 
        gap:`${data.gap}`, 
        eff: `${data.eff}`,
        abs: `${data?.manpower?.abs ?? 0}`,
        shifts: `${data?.totalHrs}`
    }
    :
    {
        options: { fontSize: 12, separation: true},
        target:`bold:${data.target}`,
        actual:`${data.actual}`, 
        gap:`${data.gap}`, 
        eff: `${data.eff}`,
        abs: `${data?.manpower?.abs}`,
        shifts: `${data?.totalHrs}`
    }
    const tableJson = { 
        title: name,
        headers: [
            { label: "Line Target", property:"target", width:100, align: "center", headerAlign: "center" },
            { label: "Actual Production", property:"actual", width:100, align: "center", headerAlign: "center" },
            { label:"Gap", property:"gap", width:50, align: "center", headerAlign: "center" },
            {label: "Trend", property: "arrow", width:50, align: "center", headerAlign: "center", 
            renderer: (value, indexColumn, indexRow, row, rectRow, rectCell) => {
                const { x, y, width, height } = rectCell;
                doc?.image(`./utils/resources/${getGraphColor(data.eff)}_arrow.png`, x + 20, y + 2, { height: height - 15});
                return ''; // void return
            }},
            { label:"Efficiency", property:"eff", width:90, align: "center", headerAlign: "center" },
            !isOverAll && { label:"Absentees", property:"abs", width:80, align: "center", headerAlign: "center" },
            !isOverAll && { label:"Total Shift Hrs", property:"shifts", width:80, align: "center", headerAlign: "center" }

        ],
        datas: [
            dates,
        ],
        // rows: [
        //     [
        //         "bold:remarks",
        //         `${data?.remarks? data?.remarks : ""}`
        //     ]
        // ],
        options: {
            width: 550,
            x: (300 - 275),
            divider: {
                header: { disabled: false, width: 0.5, opacity: 1 },
                horizontal: { disabled: false, width: 0.5, opacity: 0.5 },
            },
        }
    }
    // console.log(JSON.stringify(tableJson))
    return tableJson
}
const getOverAll = async(data) => {
    if (!data || data.length < 1) return
    let target = 0
    let actual = 0
    return new Promise((resolve, reject) => {
        data.forEach((item) => {
            target += item?.target? parseInt(item?.target): 0
            actual += item?.actual? parseInt(item?.actual) : 0
        })
        const res = calc.calcValues(target, actual)
        resolve({target: target, actual: actual, gap: res[0], eff: res[1]})
    })
}

const getData = async(line, mult=false) => {
    return new Promise((resolve, reject) => {
        const docRef = db.collection(`data/${line}/production`).orderBy('timestamp', 'desc')
        docRef.get().then((snapshot) => {
            if (!snapshot || snapshot.size < 1 || snapshot.length < 1) resolve()
            if (mult){
                const arr = []
                snapshot.docs.forEach((item) => {
                    arr.push(item?.data())
                })
                resolve(arr)
            }
            resolve([snapshot.docs[0]?.data()])
        })
    })
}

const linesId = [
    {name: "MRT", id: "line1"}, {name: "SRT/SPP/LSS", id: "line2"},
    {name: "AHU", id: "line3"}, {name: "42 Series", id: "line4"},
    {name: "40R, F & OptiClean Series", id: "line5" }, {name: "CDU", id: "line6"}, 
    { name: "WRAC",  id: "line7"}
]

async function generatePDFWithCharts(past=false, from=null, to=null) {
    console.log("Running ...")
    //get Data from the DB, analyze them and store them in these arrays
    const arrOfValues = []
    const images = []

    for (let index = 0; index < linesId.length; index++) {
        const data = await getData(linesId[index].id, (past && from && to)? true : false)
        let tod
        if (past && from && to) tod = await calc.getPastValues(data, from, to)
        else tod = await calc.getTodaysValues(data, from)
        arrOfValues.push(tod)
        const imgBuf = await getGraph(tod.target, tod.actual, tod.eff, linesId[index].name).catch((err) => {
            console.log(err)
        })
        images.push(imgBuf)
    }

    const lineData = await getOverAll(arrOfValues)

    const imageBuffer = await getGraph(lineData.target, lineData.actual, lineData.eff, "Overall")
    // Write the Overall chart image to the system
    fs.writeFileSync(`./utils/resources/overall.png`, imageBuffer)

    // Write the chart images to the system because the PDF needs a path
    let imagesPaths = []
    images.forEach((buf, i) => {
        // const tempImg = tmp.fileSync({ postfix: ".png" });
        fs.writeFileSync(`./utils/resources/${linesId[i].id}.png`, buf)
        imagesPaths.push(`./utils/resources/${linesId[i].id}.png`)
    })
    console.log("Analized!")
    // Prepare the PDF
    const doc = new PDFDocument({size: "A4", font: 'Courier-Bold', addPage: true});
    doc.info['Author'] =  "Khalid Alnahdi"
    //add the logo
    doc.image('./utils/resources/Group_black2.png', Math.round((doc.page.width - 100) /2), 10, {width: 100, link: "http://samco-jed-ap02/dashboard"})
    //add the title and sub title along wiht todya's date
    doc.fontSize(20).fillColor("black").text('Lines Efficiency Report',  Math.round((doc.page.width - 260) /2), 70, {width: 300});
    const day = new Date().toLocaleString("en-US", {timeZone: "Asia/Riyadh", weekday: "long"}).split(",")[0]
    const date = new Date().toLocaleString("en-US", {timeZone: "Asia/Riyadh"}).split(",")[0]
    doc.fontSize(7).fillColor("gray").text(`${day}, ${date}`, Math.round((doc.page.width - 100)), 20, {width: 100})
    doc.font('./utils/resources/fonts/Adelle Sans Semibold.otf').fontSize(13).fillColor("#434343").text(`Daily Production for ${day}`,  Math.round((doc.page.width - 160) /2), 90, {width: 200})

    //overall graph
    doc.image('./utils/resources/overall.png', Math.round((doc.page.width - 200) /2), Math.round((doc.page.height - 200) /2), {width: 200, align: 'center', valign:'center'})
    .fontSize(24).fillColor(getGraphColor(lineData.eff)).text(`${lineData.eff}`, Math.round((doc.page.width - 190)/2), Math.round(doc.page.height /2), {align: "center", width: 200})
    //First Row
    for (let i = 0; i < 3; i++) {
        doc.image(imagesPaths[i], 15+(i*210), 130, {width: 150, align: 'center', valign:'center'})
        .fontSize(16).fillColor(getGraphColor(arrOfValues[i].eff)).text(`${arrOfValues[i].eff}`, 15+(i*210), 210, {width: 150, align: 'center', valign:'center'})
    }
    //Second Row
    for (let i = 0; i < 2; i++) {
        doc.image(imagesPaths[i+3], 15+(i*415), Math.round((doc.page.height - 150) /2), {width: 150, align: 'center', valign:'center'})
        .fontSize(16).fillColor(getGraphColor(arrOfValues[i+3].eff)).text(`${arrOfValues[i+3].eff}`, 15+(i*415), Math.round((doc.page.height) /2), {width: 150, align: "center"})
    }
    //Third Row
    for (let i = 0; i < 2; i++) {
        doc.image(imagesPaths[i+5], 100+(i*240), 580, {width: 150, align: 'center', valign:'center'})
        .fontSize(16).fillColor(getGraphColor(arrOfValues[i+5].eff)).text(`${arrOfValues[i+5].eff}`, 100+(i*240), 655, {width: 150, align: "center"})
    }

    //add the tables page
    doc.addPage()
    //add destination for the anniotation
    doc.addNamedDestination('TABLES');

    const lorem = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam in suscipit purus. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Vivamus nec hendrerit felis. Morbi aliquam facilisis risus eu. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam in suscipit purus. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Vivamus nec hendrerit felis. Morbi aliquam facilisis risus eu.`;
    doc.lineWidth(10);
    //loop through the lines and add their details as a table to the report
    for (let index = 0; index < linesId.length; index++) {
        if (doc.y > 650) {
            doc.addPage()
            // doc.addNamedDestination('TABLES2');
        }
        const table = await getTable(arrOfValues[index], linesId[index].name, doc)
        doc.table(table, {padding: 10})
        doc.font('./utils/resources/fonts/Adelle Sans Semibold.otf').fontSize(12).fillColor("red").text(`remarks:`, {
            width: 100,
            align: 'left'
        });

       //doc.moveDown();
        arrOfValues[index]?.remarks?
        (
            Array.isArray(arrOfValues[index]?.remarks) && arrOfValues[index]?.remarks.length > 0? 
            arrOfValues[index]?.remarks.map((item) => (
                (typeof item === "object")? 
                doc.fontSize(8).fillColor("black").text( `${item?.from} - ${item?.to}: ${item?.text}` , { width: 500, align: 'left'})
                :
                doc.fontSize(8).fillColor("black").text( `${arrOfValues[index]?.remarks}` , { width: 500, align: 'left'})
            ))
            : doc.fontSize(8).fillColor("black").text( `${arrOfValues[index]?.remarks}` , { width: 500, align: 'left'})
        ) 
        : 
        doc.fontSize(8).fillColor("black").text( "N/A" , { width: 500, align: 'left'});

        doc.text(" ", {width: 500, align: "center"})
    }

    //add OverAll Table
    const overAllTable = await getTable(lineData, "Overall", doc, true)
    doc.table(overAllTable, {padding: 10})

    //add the delays causes graph to the document.
    const issues = await getIssuesTotal(arrOfValues)

    //create the issues graph and save it to the system
    const issuesGraphBuff = await getIssuesGraph(issues)
    fs.writeFileSync(`./utils/resources/issues.png`, issuesGraphBuff)

    doc.addPage()
    doc.image('./utils/resources/issues.png', 10, 20, {width: 575, align: 'center', valign:'center'})
    
    //doc.addSVG('./utils/resources/issues.png', 10, 10, {width: 575, align: 'center', valign:'center'});
    // Create a stream to hold the PDF in memory
    const memStream = new MemoryStream(null, {
        readable : false
    });

    doc.pipe(memStream);

    // Write the PDF stream buffer to the file system
    doc.on('end', function () {
        const pdfBuffer = Buffer.concat(memStream.queue)

        fs.writeFileSync(`./utils/resources/report${past? '_past' : ""}.pdf`, pdfBuffer);
    })

    doc.end();

    // return filePath
}

module.exports = {
    generatePDFWithCharts
}


/*
doc.fontSize(8).fillColor("black").text(`
${arrOfValues[index]?.remarks? 
    (
        Array.isArray(arrOfValues[index]?.remarks) || arrOfValues[index]?.remarks.length > 0? 
        arrOfValues[index]?.remarks.map((item) => (
            `${item.from} - ${item.to}: ${item.text}, ${item.from} - ${item.to}: ${item.text}, ${item.from} - ${item.to}: ${item.text}, ${item.from} - ${item.to}: ${item.text}, ${item.from} - ${item.to}: ${item.text}` 
        ))
        : arrOfValues[index]?.remarks
    ) 
    : "N/A"
}
`, {
    width: 500,
    align: 'left'
});
*/

// doc.lineCap('round').moveTo(50, 90*index).lineTo(50, 90*index).stroke();
// doc.moveDown();
// doc.rect(doc.x, 0, 500, 300).stroke();

// doc.on('pageAdded', () => {
//     //add the same header for all pages 
//     doc.image('./utils/resources/Group_black2.png', Math.round((doc.page.width - 100) /2), 10, {width: 100})
//     //add the title and sub title along wiht todya's date
//     doc.font('Courier-Bold').fontSize(20).fillColor("black").text('Lines Efficiency Report',  Math.round((doc.page.width - 260) /2), 70, {width: 300});
//     doc.fontSize(7).fillColor("gray").text(`${day}, ${date}`, Math.round((doc.page.width - 100)), 20, {width: 100})
//     doc.font('./utils/resources/fonts/Adelle Sans Semibold.otf').fontSize(13).fillColor("#434343").text(`Daily Production for ${day}`,  Math.round((doc.page.width - 160) /2), 90, {width: 200})
// })

//arrow up
    // doc.polygon([12, 0], [6, 12], [19, 12]);
    // doc.rect(10, 12, 5, 10).fillAndStroke("red", "red")
    // doc.stroke();
//arrow down
    // doc.rect(10, 0, 5, 10)
    // doc.polygon([8, 10], [14, 20], [20, 10]).fillAndStroke("red", "red")
    // doc.stroke();
