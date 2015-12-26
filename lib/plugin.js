'use strict';

const mongoose = require('mongoose');
const moment = require('moment');
const Cron = require('./Cron');

module.exports = function(schema, options) {
  if (!options) options = {};

  schema.add({
    cron: new mongoose.Schema({
      enabled: { // on/off switch
        type: Boolean
      },
      startAt: { // first possible start date
        type: Date
      },
      stopAt: { // last possible start date (`null` if not recurring)
        type: Date
      },
      interval: { // cron string interval (e.g. `* * * * * *`)
        type: String
      },
      removeExpired: { // set to `true` for the expired jobs to be automatically deleted
        type: Boolean
      },
      startedAt: { // (automatic) set every time a job processing starts
        type: Date
      },
      processedAt: { // (automatic) set every time a job processing ends
        type: Date
      },
      state: { // (automatic) job state (0=pending, 1=processing, 2=expired)
        type: Number
      }
    }, {_id: false})
  });

  schema.index(
    {'cron.enabled': 1, 'cron.state': 1, 'cron.startAt': 1, 'cron.stopAt': 1}
  );

  schema.method('isDisabled', function() {
    return this.cron.state === -1;
  });

  schema.method('isPending', function() {
    return this.cron.state === 0;
  });

  schema.method('isProcessing', function() {
    return this.cron.state === 1;
  });

  schema.method('isEnabled', function() {
    return [0, 1].indexOf(this.cron.state) !== -1;
  });

  schema.method('isExpired', function() {
    return this.cron.state === 2;
  });

  schema.method('isRunnable', function() {
    let started = moment(this.cron.startAt) <= moment();
    let valid = !this.cron.stopAt || moment(this.cron.stopAt) >= moment();
    return started && valid;
  });

  schema.statics.createCron = function(config) {
    return new Cron(this, Object.assign({}, options, config));
  };
};
