const nodemailer = require("nodemailer");
//host: "192.168.111.35",
// custom simple logger

let transporter = nodemailer.createTransport({
    host: "smtp.eajb.com.sa",
    port: 25,
    secure: false,
    tls: {
        rejectUnauthorized: false,
    },
});

function endOfMonthText(date) {
    if (!date) return;

    if (date === "11" || "12") return "th";
    if (date[date.length - 1] === "1") return "st";
    if (date[date.length - 2] === "1") return "nd";
    if (date[date.length - 3] === "1") return "rd";

    return "th";
}
const emailList = ["production_line_efficiency@samco.com.sa"];
async function sendReport() {
    const dayString = new Date().toLocaleString("en-US", { timeZone: "Asia/Riyadh", weekday: "long" }).split(",")[0];
    const dayNum = new Date().toLocaleString("en-US", { timeZone: "Asia/Riyadh", day: "numeric" }).split(",")[0];
    const month = new Date().toLocaleString("en-US", { timeZone: "Asia/Riyadh", month: "long" });

    const dateDisplay = `${dayString}, ${month} ${dayNum}'${endOfMonthText(dayNum)}`;

    const options = {
        from: "Line Efficiency Dashboard <production_line_efficiency@samco.com.sa>",
        to: emailList,
        subject: "SAMCO Production Efficiency Update",
        text: `
        Hello,
        this is your daily update for SAMCO Proudction, please see the attached report`,
        html: `
        <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
            <html xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
            <html lang="en">
            <head>
            <title>Line Efficiensy Dashboard</title>
            <meta charset="UTF-8">
            <meta content="width=device-width, initial-scale=1" name="viewport">
            <meta name="x-apple-disable-message-reformatting">
            <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Lato">
            <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta content="telephone=no" name="format-detection">
            
            <style type="text/css">
                body {
                font-family: "Roboto", "Lato", sans-serif;
                background-color: #f0f0f0 !important;
                margin: 0;
                }
                .wrap{
                width: 100%;
                table-layout: fixed;
                margin-bottom: 10px;
                margin: 0;
                }
                .header-tr{
                display: flex; 
                flex-direction: column; 
                justify-content: center; 
                background-color: #0032c8;
                padding: 10px;
                }
                th.temp-title {
                text-align: center;
                }
                h2{
                margin-top: 15px;
                font-weight: 900 !important;
                margin-bottom: 5px;
                color: #fff;
                }
                tbody{
                padding: 20px;
                }
                td{
                text-align: left;
                }
                p{
                color: rgb(35, 35, 35);
                }
                #current_date{
                color:  #0032c8;
                }
                .footer{
                    height: 50vh; 
                    position: relative;
                }
            </style>
            
            
            </head>
            <body style="width:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0">
            <center class="wrapper" width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top;">
                <table width="100%">
                <thead>
                    <tr class="header-tr" style="display: flex; flex-direction: column; justify-content: center; background-color: #0032c8; padding: 10px" >
                    <th>
                        <a href="http://samco-jed-ap02/dashboard"><img src="cid:unique@nodemailer.com" alt="Group-black2" border="0" width="150px"/> </a>
                    
                        <div class="temp-title">
                            <h2 style="margin-top: 15px;font-weight: 900 !important;margin-bottom: 5px;color: #fff;">
                                Your Daily Updates for SAMCO Production Efficiency
                            </h2>
                        </div>
                    </th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                    <td style="padding: 10px">
                        <p style="color: rgb(35, 35, 35);">
                        Hello,
                        </p>
                        <p style="color: rgb(35, 35, 35);">
                        this is your daily update for SAMCO Proudction on <span id="current_date" style="color:  #0032c8;">${dateDisplay}</span>,
                        </p>
                        <p style="color: rgb(35, 35, 35);">
                        please see the attached report.
                        </p>
                        <div class="footer" style="height: 50vh; position: relative;">
                        <p style="color: #8c8c8c; position: absolute; bottom: 15px">
                        This Email is Auto generated by <a href="http://samco-jed-ap02/dashboard" style="color:#0032c8; text-decoration: none;">Line Efficiency Dashboard</a>
                        </p>
                        </div>
                    </td> 
                    </tr>
                </tbody>
                </table>
                
            </center>
            
            <script>
            function goToDashboard() {
            window.location.assign("http://samco-jed-ap02/dashboard")
            }
            </script>
            </body>
            </html>        
        `,
        attachments: [
            {
                filename: "email_logo.png",
                path: "./utils/resources/email_logo.png",
                cid: "unique@nodemailer.com",
            },
            {
                filename: "report.pdf",
                path: "./utils/resources/report.pdf",
            },
        ],
    };

    transporter.sendMail(options, (err, info) => {
        if (err) {
            console.log(err);
            return;
        }
        console.log(info.response);
    });
}

async function sendWarning(email, line, subject, msg) {
    return new Promise((resolve, reject) => {
        const options = {
            from: "Line Efficiency Dashboard <production_line_efficiency@samco.com.sa>",
            to: email,
            subject: `WARNING: ${subject} NOTICE!`,
            text: `
            Hello,
            Your recived the following message from ${line}:
            ${msg}`,
            html: `
            <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
            <html xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
            <html lang="en">
            <head>
                <title>Line Efficiensy Dashboard</title>
                <meta charset="UTF-8">
                <meta content="width=device-width, initial-scale=1" name="viewport">
                <meta name="x-apple-disable-message-reformatting">
                <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Lato">
                <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto">
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
                <meta http-equiv="X-UA-Compatible" content="IE=edge">
                <meta content="telephone=no" name="format-detection">
            
                <style type="text/css">
                    body {
                    font-family: "Roboto", "Lato", sans-serif;
                    background-color: #f0f0f0 !important;
                    margin: 0;
                    }
                    .wrap{
                    width: 100%;
                    table-layout: fixed;
                    margin-bottom: 10px;
                    margin: 0;
                    }
                    .header-tr{
                    display: flex; 
                    flex-direction: column; 
                    justify-content: center; 
                    background-color: #EE4B2B;
                    padding: 10px;
                    }
                    th.temp-title {
                    text-align: center;
                    }
                    h2{
                    margin-top: 15px;
                    font-weight: 900 !important;
                    margin-bottom: 5px;
                    color: #fff;
                    }
                    tbody{
                    padding: 20px;
                    }
                    td{
                    text-align: left;
                    }
                    p{
                    color: rgb(35, 35, 35);
                    }
                    #current_date{
                    color:  #0032c8;
                    }
                    .footer{
                        height: 50vh; 
                        position: relative;
                    }
                </style>
            </head>
            <body style="width:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0">
            <center class="wrapper" width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top;">
                <table width="100%">
                <thead>
                    <tr class="header-tr" style="display: flex; flex-direction: column; justify-content: center; background-color: #EE4B2B; padding: 10px" >
                    <th>
                        <a href="http://samco-jed-ap02/dashboard"><img src="cid:unique@nodemailer.com" alt="Group-black2" border="0" width="150px"/> </a>
                    
                        <div class="temp-title">
                            <h2 style="margin-top: 15px;font-weight: 900 !important;margin-bottom: 5px;color: #fff;">
                                Warning Message From Line Efficiency Dashboard
                            </h2>
                        </div>
                    </th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                    <td style="padding: 10px">
                        <p style="color: rgb(35, 35, 35);">
                        Hello,
                        </p>
                        <p style="color: rgb(35, 35, 35);">
                        You received the following message from ${line}:
                        </p>
                        <blockquote style="color: #36454F; font-weight: 900; padding: 10px; border-left: 5px solid rgba(0, 0, 0, .70);  border-radius: 5px;">
                        ${msg}
                        </blockquote>
                        <p style="color: red;">
                            please contact SAMCO production team and try to resolve this issue as soon as possible.
                        </p>
                        <div class="footer" style="height: 50vh; position: relative;">
                        <p style="color: #8c8c8c; position: absolute; bottom: 15px">
                        This Email is Auto generated by <a href="http://samco-jed-ap02/dashboard" style="color:#0032c8; text-decoration: none;">Line Efficiency Dashboard</a>
                        </p>
                        </div>
                    </td> 
                    </tr>
                </tbody>
                </table>
            </center>
            
            <script>
            function goToDashboard() {
                window.location.assign("http://samco-jed-ap02/dashboard")
            }
            </script>
            </body>
            </html>
            `,
            attachments: [
                {
                    filename: "email_logo.png",
                    path: "./utils/resources/email_logo.png",
                    cid: "unique@nodemailer.com",
                },
            ],
        };

        transporter.sendMail(options, (err, info) => {
            if (err) {
                console.log(err);
                return reject(err);
            }
            console.log(info);
            resolve(info);
        });
    });
}

module.exports = {
    sendReport,
    sendWarning,
};


    // auth: {
    //     user: "producction_line_efficiency@samco.com.sa",
    // },
    // service: "hotmail",
    // auth: {
    //     //producction_line_efficiency@samco.com.sa
    //     user: "khalid.alnahdi@samco.com.sa", // generated ethereal user
    //     pass: "Kh@led1123", // generated ethereal password
    // },