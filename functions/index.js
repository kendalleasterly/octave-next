
const {onRequest} = require("firebase-functions/v2/https");
// const logger = require("firebase-functions/logger");
const routes = require("./api");

const express = require("express")
const app = express()

exports.api = onRequest(app.use("/api", routes));

