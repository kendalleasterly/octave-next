
const {onRequest} = require("firebase-functions/v2/https");
// const logger = require("firebase-functions/logger");
const {app} = require("./api");

exports.api = onRequest(app);

