import {DefaultLogger as winston} from '@dracul/logger-backend';

const QueueModel = require('../models/QueueModel');
const isPlainObject = require('../validations/isPlainObject')
const {incrementAddStat, incrementGetStat, incrementDoneStat, incrementErrorStat} = require('./QueueStatsService')

const fetchQueues = function () {

    return new Promise((resolve, reject) => {
        QueueModel.find({}).exec((err, res) => {

            if (err) {
                winston.error("QueueService.fetchQueues ", err)
                reject(err)
            }
            winston.debug("QueueService.fetchQueues successful")
            resolve(res)

        });
    })

}


const addJob = function (topic, payload) {


    if (!topic)
        return Promise.reject(new Error('Topic missing.'))
    else if (!topic instanceof String)
        return Promise.reject(new Error('Topic is not a String.'))

    if (!payload)
        return Promise.reject(new Error('Payload missing.'));
    else if (!isPlainObject(payload))
        return Promise.reject(new Error('Payload is not a plain object.'))


    return new Promise((resolve, reject) => {

        var newJob = new QueueModel({
            topic: topic,
            payload: payload
        })
            .save(function (err, job) {
                if (err) {
                    reject(err)
                    return
                }
                incrementAddStat(topic)
                resolve(job);
            });
    })
}


const getJob = function (topic, workerId, workerHostname, maxRetries, blockDuration) {

    if (!topic)
        return Promise.reject(new Error('Topic missing.'))
    else if (!topic instanceof String)
        return Promise.reject(new Error('Topic is not a String.'))

    return new Promise((resolve, reject) => {

        QueueModel
            .findOneAndUpdate({
                topic: topic,
                blockedUntil: {$lt: Date.now()},
                retries: {$lte: maxRetries},
                done: false
            }, {
                $set: {
                    blockedUntil: new Date(Date.now() + blockDuration),
                    workerId: workerId,
                    workerHostname: workerHostname
                },
                $inc: {
                    retries: 1
                },
            }, {
                new: true,
                sort: {createdAt: 1}
            })
            .exec(function (err, job) {

                if (err) {
                    reject(err);
                    return
                } else if (!job) {
                    resolve(null);
                } else {
                    incrementGetStat(topic)
                    resolve(job)
                }
            })

    })
}


const ackJob = function (jobId) {

    if (!jobId)
        return Promise.reject(new Error('jobId missing.'))
    else if (!jobId instanceof String)
        return Promise.reject(new Error('jobId is not a String.'))

    return new Promise((resolve, reject) => {

        QueueModel.findOneAndUpdate({
            _id: jobId
        }, {
            $set: {
                done: true
            }
        }, {
            new: true
        }, function (err, job) {
            if (err) {
                reject(err)
                return
            } else if (!job) {
                reject(new Error('Job id invalid, job not found.'))
                return
            } else
                incrementDoneStat(job.topic)
            resolve(job)
        });


    })

}


const errorJob = function (jobId, errorMessage, done = true) {

    if (!jobId)
        return Promise.reject(new Error('jobId missing.'))
    else if (!jobId instanceof String)
        return Promise.reject(new Error('jobId is not a String.'))

    if (!errorMessage)
        return Promise.reject(new Error('errorMessage missing.'))
    else if (!errorMessage instanceof String)
        return Promise.reject(new Error('errorMessage is not a String.'))

    return new Promise((resolve, reject) => {
        QueueModel.findOneAndUpdate({
            _id: jobId
        }, {
            $set: {
                done: done,
                error: errorMessage
            }
        }, {
            new: true
        }, function (err, job) {
            if (err)
                reject(err);
            else if (!job)
                reject(new Error('Job id invalid, job not found.'));
            else
                incrementErrorStat(job.topic)
            resolve(job)
        });
    })

}


const resetQueue = function () {

    return new Promise((resolve, reject) => {
        QueueModel.remove({}, function (err) {
            if (err)
                reject(err);
            else
                resolve(true);
        });

    })

}

const cleanQueue = function () {

    return new Promise((resolve, reject) => {
        QueueModel.remove({
            $or: [
                {done: true},
                {retries: {$gt: this.options.maxRetries}}
            ]
        }, function (err) {
            if (err)
                reject(err);
            else
                resolve(true);
        })
    })

}




module.exports = {
    addJob,
    getJob,
    ackJob,
    errorJob,
    cleanQueue,
    resetQueue,
    fetchQueues
}
