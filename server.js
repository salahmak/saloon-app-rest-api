const express = require("express");
const bodyParser = require("body-parser");
const auth = require("./routes/auth.js");
const users = require("./routes/users.js");
const saloons = require("./routes/saloons.js");
const MongoClient = require("mongodb").MongoClient;

require("dotenv").config();

const DB_NAME = process.env.DB_NAME;
const DB_URL = process.env.DB_URL;


const PORT = process.env.PORT;

const app = express();
app.use(bodyParser.json());

app.get("/api", (req, res) => {
  res.send("Welcome to the api");
});

app.get("/", (req, res) => {
  res.send("Welcome to the app");
});

app.use("/api/auth", auth);
app.use("/api/users", users);
app.use("/api/saloons", saloons);



MongoClient.connect(DB_URL, { useNewUrlParser: true,useUnifiedTopology: true }).then(client =>{
    console.log("connected to db");
    app.listen(PORT, () => {
        console.log(`app is listening at http://localhost:${PORT}`);
      });
      app.db = client.db(DB_NAME)
}).catch(err =>{
    console.log(err)
})
