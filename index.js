const express = require("express");
const cors = require('cors')
const dotenv = require('dotenv');
const app = express();

app.use(cors())
dotenv.config();


app.get("/", (req, res) => {
  //CODE
  res.json({message : "Hello world !"});
});
app.listen(process.env.PORT, () => {
  console.log("Server has started");
});