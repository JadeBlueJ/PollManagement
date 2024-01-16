const winston = require('winston');
require('winston-daily-rotate-file');
const fs = require('fs')
const moment = require('moment')
const path = require('path');


module.exports = function (errorObj, message, dirPath) {

  //# Check if the specified directory exists, otherwise create one.
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }


  const timeStamp = () => new Date().toLocaleTimeString();
  const timeStampFormats = moment().format('y-m-d HH:mm:ss');

  var transport1 = new (winston.transports.DailyRotateFile)({
    filename: path.join(dirPath, '%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    timestamp: timeStamp,
    level: "debug"
  });

  var transport2 = new (winston.transports.Console)({
    level: "debug",
  })

  var logger = winston.createLogger({
    format: winston.format.combine(
      winston.format.prettyPrint()
    ),
    transports: [
      transport1, // to log onto the log-file
      transport2, // to print on console
    ]
  });


  // if failure 
  if (errorObj) {
    logger.error({
      Time: timeStampFormats,
      JobDescription: `${message}`,
      level: "error",
      stack: errorObj
    });
  } else {
    // for success
    logger.log('info', message)
  }
}