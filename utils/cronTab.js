var cron = require("node-cron");
const { generatePDFWithCharts } = require("./chartsToPdf");
const { sendReport } = require("./sendMail");

const dailyUpdates = async () => {
    //first get the data then generate a report and safe it to the server
    await generatePDFWithCharts();
    //send the generated report to the clients
    sendReport();
};

// sendReport();
// generatePDFWithCharts();
//runs at 11:00 pm from sunday til thrusday
cron.schedule("00 23 * * 0-4", () => {
    dailyUpdates();
});
