import morgan from "morgan";
import fs from "fs";
import path from "path";
const rfs = require("rotating-file-stream");

// Ensure logs directory exists
const logDirectory = path.join(__dirname, "../logs");
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);

// Create a rotating write stream
const accessLogStream = rfs.createStream("access.log", {
    interval: "3d", // rotate daily
    path: logDirectory,
    maxFiles: 5, // keep 5 days of logs
});

// Middleware function to log all HTTP requests
const requestLogger = morgan("combined", {
    stream: accessLogStream,
    skip: (req, res) => res.statusCode < 400, // log only requests with status code >= 400
});

export default requestLogger;