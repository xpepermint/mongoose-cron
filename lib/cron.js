'use strict';

const moment = require('moment');
const later = require('later');
const events = require('events');
const errors = require('./errors');

class Cron extends events.EventEmitter {
  constructor(model, handler, options) {
    super();

    this._model = model;
    this._handler = handler;
    if (!options) options = {};

    this._running = false;
    this._heartbeat = null;
    this._idleDelay = options.idleDelay || 0; // when there are no jobs for processing, wait 0 sek before continue
    this._nextDelay = options.nextDelay || 0; // wait 0 min before processing the same job again
  }

  /*
  * Returns true if the cron is running.
  */

  isRunning() {
    return this._running;
  }

  /*
  * Starts the heartbit.
  */

  start() {
    if (this._running) return;

    this._running = true;
    this._tick();
  }

  /*
  * Stops the heartbit of the schedule.
  */

  stop() {
    clearTimeout(this._heartbeat);
    this._running = false;
  }

  /*
  * Returns the next date when the job should be processed or `null` if the job
  * is expired or not recurring.
  */

  getNextStart(doc) {
    if (!doc.schedule) { // not recurring job
      return null;
    }

    let future = moment().add(this._nextDelay, 'millisecond'); // date when the next start is possible
    let start = moment(doc.startAt);
    if (start >= future) { // already in future
      return doc.startAt;
    }

    try { // new date
      let schedule = later.parse.cron(doc.schedule, true);
      let dates = later.schedule(schedule).next(2, future.toDate(), doc.stopAt);
      return dates[1];
    } catch (err) {
      return null;
    }
  }

  /*
  * Private method which is called on every heartbit.
  */

  _tick() {
    if (!this._running) return;

    let tickDate = new Date();
    let doc = null;
    return this._model.findOneAndUpdate(
      {state: 0, startAt: {$lte: tickDate}, $or: [{stopAt: {$gte: tickDate}}, {stopAt: {$exists: false}}]},
      {state: 1, startedAt: tickDate},
      {sort: {startAt: 1}}
    ).then(res => {
      doc = res;
      return this._handleDocument(doc);
    }).then(res => {
      return this._rescheduleDocument(doc);
    }).then(res => {
      return this._tick();
    }).catch(err => {
      return this._handleError(err);
    });
  }

  /*
  * Private method which processes a document of a tick.
  */

  _handleDocument(doc) {
    if (!doc) {
      throw new errors.CronNoDocumentError();
    } else {
      return this._handler(doc);
    }
  }

  /*
  * Private method which tries to reschedule a document, marks it as expired or
  * deletes a job if `removeExpired` is set to `true`.
  */

  _rescheduleDocument(doc) {
    let nextStart = this.getNextStart(doc);
    if (!nextStart) {
      console.log('expired', doc.removeExpired)
      if (doc.removeExpired === true) {
        console.log('yes');
        return doc.remove(); // delete
      } else {
        return doc.update({state: 2, processedAt: new Date()}); // mark as expired
      }
    } else {
      return doc.update({state: 0, processedAt: new Date(), startAt: nextStart}); // continue
    }
  }

  /*
  * Private method for handling errors.
  */

  _handleError(err) {
    let promise = Promise.resolve();

    switch(err.name) {
      case 'CronNoDocumentError':
        break;
      default:
        console.log(err);
    }

    return promise.then(res => {
      clearTimeout(this._heartbeat);
      this._heartbeat = setTimeout(this._tick.bind(this), this._idleDelay);
    });
  }
}

module.exports.Cron = Cron;
