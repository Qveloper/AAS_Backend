const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf } = format;
const moment = require('moment-timezone');
var util = require('util');
var winstonDaily = require('winston-daily-rotate-file');
var env = process.env.NODE_ENV || 'development';
var logLevel = require('../config/config.json')[env]['logLevel'];

const logDir = './logs/';
const appendTimestamp = format((info, opts) => {
    if (opts.tz)
        info.timestamp = moment().tz(opts.tz).format();
    return info;
})
const myFormat = printf(info => {
    return `${info.timestamp} ${info.level}: ${info.message}`;
});

const customTransports = process.env.NODE_ENV === 'test' ? [
    new transports.Console({
        name: 'debug-console'
    })
] : [
    new transports.Console({
        name: 'debug-console'
    }),
    new winstonDaily({
        name: 'info-file',
        filename: logDir + 'app_%DATE%.log', // 파일 이름 (아래 설정한 날짜 형식이 %DATE% 위치에 들어간다)
        datePattern: 'YYYY-MM-DD',
        maxsize: 50000000,
        maxFiles: 1000,
    })
]

const logLevels = {
    test: 0,
    error: 1,
    warn: 2,
    info: 3,
    verbose: 4,
    debug: 5,
    silly: 6
}

var logger = createLogger({
    level: logLevel,
    levels: logLevels,
    colorize: true,
    format: combine(appendTimestamp({ tz: 'Asia/Seoul' }), myFormat),
    transports: customTransports
})

logger.stream = {
    write: function(message, encoding) {
        logger.info(message);
    }
};

function formatArgs(args) {
    return [util.format.apply(util.format, Array.prototype.slice.call(args))];
}

console.log = function() {
    if (process.env.NODE_ENV === 'test') {
        logger.test.apply(logger, formatArgs(arguments))
    } else {
        logger.debug.apply(logger, formatArgs(arguments));
    }
};
console.info = function() {
    logger.info.apply(logger, formatArgs(arguments));
};
console.warn = function() {
    logger.warn.apply(logger, formatArgs(arguments));
};
console.error = function() {
    logger.error.apply(logger, formatArgs(arguments));
};
console.debug = function() {
    logger.debug.apply(logger, formatArgs(arguments));
};

module.exports = logger;