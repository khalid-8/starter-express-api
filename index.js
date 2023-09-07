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

app.use("/api", api);

app.use(bodyParser.json());

app.use(cors({origin: true}));

app.get("/", (req, res) => {
    res.send("Hello world")
})

app.listen(process.env.PORT, function () {
    console.log(`started at ${process.env.PORT}`);
});


//console.log = () => { }