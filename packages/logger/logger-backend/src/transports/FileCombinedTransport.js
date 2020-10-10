require('dotenv').config()
import winston from "winston";
import DefaultFormatter from "../formatters/DefaultFormatter";


function FileCombinedTransport(level, formatter) {

    if (!formatter) {
        formatter = DefaultFormatter
    }

    if(!level){
        level= process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'debug'
    }

    return new winston.transports.File({
        filename: 'logs/combined.log',
        format: formatter,
        level: level,
        maxsize: process.env.LOG_FILE_MAX_SIZE ? process.env.LOG_FILE_MAX_SIZE : 50000000,
        maxFiles: process.env.LOG_FILE_MAX_FILES ? process.env.LOG_FILE_MAX_FILES : 3,
    })
}


export default FileCombinedTransport