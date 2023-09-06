const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
// const {auth, admin} = require("./utils/firebase");
const app = express();

require("dotenv").config();

// if (process.env.NODE_ENV === 'production') {
   // console.log = () => {}
   // console.error = () => {}
   // console.debug = () => {}
//}

const api = require("./utils/api");

app.use("/dashboard_be/api", api);

app.use(bodyParser.json());

app.use(cors({origin: true}));

require("./utils/cronTab")

app.get("/dashboard_be", (req, res) => {
    res.send("Hello world")
})

app.listen(process.env.PORT, function () {
    console.log("started at 8080");
});


//console.log = () => { }