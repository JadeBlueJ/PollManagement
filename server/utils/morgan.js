const morgan = require("morgan");
const logger = require("../utils/logger");

const skip = () => {
    const env = process.env.NODE_ENV || "development";
    return env !== "development";
};


// Define custom token for colorizing status codes
morgan.token('status-color', (req, res) => {
    const status = res.statusCode;
    let color;

    if (status >= 500) {
        color = 'red';
    } else if (status >= 400) {
        color = 'yellow';
    } else if (status >= 300) {
        color = 'cyan';
    } else {
        color = 'green';
    }

    return chalk[color](status);
});

const morganMiddleware = morgan(
    // Define message format string (this is the default one).
    // The message format is made from tokens, and each token is
    // defined inside the Morgan library.
    // You can create your custom token to show what do you want from a request.
    // ":remote-addr :method :url :status :res[content-length] - :response-time ms",
    ":method :url :status :res[content-length] - :response-time ms",
    // Options: in this case, I overwrote the stream and the skip logic.
    // See the methods above.
    { skip }
);

module.exports = morganMiddleware;