'use strict';

const mongoose = require('mongoose');
const Cron = require('./cron');

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
      locked: { // (automatic) `true` when job is processing
        type: Boolean
      },
      lastError: { // (automatic) last error message
        type: String
      }
    }, {_id: false})
  });

  schema.index(
    {'cron.enabled': 1, 'cron.locked': 1, 'cron.startAt': 1, 'cron.stopAt': 1}
  );

  schema.statics.createCron = function(config) {
    return new Cron(this, Object.assign({}, options, config));
  };
};
